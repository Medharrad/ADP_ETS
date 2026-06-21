// =============================================================================
// MASSAR — lecture d'un export Excel (.xlsx/.xls) ou CSV depuis Massar afin
// d'extraire automatiquement la liste des élèves (noms). Détecte les colonnes
// nom/prénom en français ET en arabe (الاسم / النسب / الاسم الكامل …).
// =============================================================================

import * as XLSX from "xlsx";

export interface MassarResult {
  /** Noms d'élèves extraits, dans l'ordre du fichier. */
  names: string[];
  /** Étiquette(s) de colonne reconnue(s), pour information. */
  colonnes: string[];
  /** Lignes non vides ignorées (en-têtes, totaux, doublons…). */
  ignored: number;
  /** Problème fatal — `names` est alors vide. */
  error?: string;
}

// Mots-clés d'en-tête (sans accents/casse) → rôle de la colonne.
const FULLNAME_KEYS = [
  "nom et prenom", "nom complet", "nom prenom", "nomprenom",
  "الاسم الكامل", "الاسم والنسب", "الاسم و النسب", "الاسم الشخصي والعائلي",
];
const LASTNAME_KEYS = ["nom", "نسب", "النسب", "اللقب", "العائلي"];
const FIRSTNAME_KEYS = ["prenom", "اسم", "الاسم", "الشخصي"];
// Colonnes à ne jamais prendre pour un nom.
const NON_NAME_KEYS = [
  "code", "massar", "رمز", "ر.ت", "رت", "رقم", "numero", "n°", "ordre",
  "date", "تاريخ", "naissance", "ازدياد", "sexe", "genre", "نوع", "النوع",
  "classe", "قسم", "niveau", "مستوى",
];

/** Normalise pour comparaison : minuscule, sans accents, espaces compactés. */
function norm(s: string): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents latins
    .replace(/\s+/g, " ")
    .trim();
}

function hasKey(header: string, keys: string[]): boolean {
  const h = norm(header);
  return keys.some((k) => h.includes(norm(k)));
}

/** Ratio de cellules « texte non numérique » d'une colonne (heuristique de secours). */
function textRatio(rows: string[][], col: number, start: number): number {
  let txt = 0;
  let tot = 0;
  for (let i = start; i < rows.length; i++) {
    const v = (rows[i]?.[col] ?? "").toString().trim();
    if (!v) continue;
    tot++;
    if (Number.isNaN(parseFloat(v.replace(",", ".")))) txt++;
  }
  return tot ? txt / tot : 0;
}

/**
 * Extrait les noms d'élèves d'une grille de cellules (lignes × colonnes).
 * Cherche une ligne d'en-tête, identifie les colonnes nom/prénom, puis lit
 * les lignes de données. Ne lève jamais d'exception.
 */
export function extractNamesFromRows(rows: string[][]): MassarResult {
  const cleaned = rows
    .map((r) => (r ?? []).map((c) => (c == null ? "" : c.toString().trim())))
    .filter((r) => r.some((c) => c !== ""));

  if (cleaned.length === 0) return { names: [], colonnes: [], ignored: 0, error: "Fichier vide." };

  // 1) Trouver la ligne d'en-tête (parmi les 20 premières lignes).
  let headerIdx = -1;
  let fullCol = -1;
  let lastCol = -1;
  let firstCol = -1;
  const scan = Math.min(cleaned.length, 20);
  for (let i = 0; i < scan; i++) {
    const r = cleaned[i];
    let f = -1, l = -1, p = -1;
    r.forEach((cell, c) => {
      if (hasKey(cell, NON_NAME_KEYS) && !hasKey(cell, FULLNAME_KEYS)) return;
      if (f === -1 && hasKey(cell, FULLNAME_KEYS)) f = c;
      else if (l === -1 && hasKey(cell, LASTNAME_KEYS)) l = c;
      else if (p === -1 && hasKey(cell, FIRSTNAME_KEYS)) p = c;
    });
    if (f !== -1 || l !== -1 || p !== -1) {
      headerIdx = i;
      fullCol = f; lastCol = l; firstCol = p;
      break;
    }
  }

  // 2) Aucune en-tête reconnue → heuristique : colonne la plus « textuelle ».
  let dataStart: number;
  if (headerIdx === -1) {
    const ncol = Math.max(...cleaned.map((r) => r.length));
    let best = 0, bestRatio = -1;
    for (let c = 0; c < ncol; c++) {
      const ratio = textRatio(cleaned, c, 0);
      if (ratio > bestRatio) { bestRatio = ratio; best = c; }
    }
    fullCol = best;
    dataStart = 0;
  } else {
    dataStart = headerIdx + 1;
  }

  const colonnes: string[] = [];
  if (headerIdx !== -1) {
    if (fullCol !== -1) colonnes.push(cleaned[headerIdx][fullCol]);
    if (lastCol !== -1) colonnes.push(cleaned[headerIdx][lastCol]);
    if (firstCol !== -1) colonnes.push(cleaned[headerIdx][firstCol]);
  }

  // 3) Lecture des lignes de données.
  const names: string[] = [];
  const seen = new Set<string>();
  let ignored = 0;
  for (let i = dataStart; i < cleaned.length; i++) {
    const r = cleaned[i];
    let name = "";
    if (fullCol !== -1) {
      name = r[fullCol] ?? "";
    } else if (lastCol !== -1 || firstCol !== -1) {
      const last = lastCol !== -1 ? (r[lastCol] ?? "") : "";
      const first = firstCol !== -1 ? (r[firstCol] ?? "") : "";
      name = `${last} ${first}`.trim();
    }
    name = name.replace(/\s+/g, " ").trim();
    // Ignorer cellules vides, purement numériques, ou répétitions d'en-tête.
    if (!name || !Number.isNaN(parseFloat(name)) || hasKey(name, [...FULLNAME_KEYS, ...LASTNAME_KEYS, ...FIRSTNAME_KEYS])) {
      ignored++;
      continue;
    }
    const key = norm(name);
    if (seen.has(key)) { ignored++; continue; }
    seen.add(key);
    names.push(name);
  }

  if (names.length === 0) {
    return {
      names: [],
      colonnes,
      ignored,
      error: "Aucun nom d'élève détecté. Vérifiez que le fichier contient une colonne « Nom » / « النسب ».",
    };
  }
  return { names, colonnes, ignored };
}

/**
 * Lit un fichier Massar (.xlsx, .xls ou .csv) et renvoie la liste des élèves.
 * Lecture de la première feuille du classeur.
 */
export async function parseMassarFile(file: File): Promise<MassarResult> {
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { names: [], colonnes: [], ignored: 0, error: "Classeur sans feuille." };
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    return extractNamesFromRows(rows as unknown as string[][]);
  } catch (e) {
    return {
      names: [],
      colonnes: [],
      ignored: 0,
      error: e instanceof Error ? `Lecture impossible : ${e.message}` : "Lecture du fichier impossible.",
    };
  }
}
