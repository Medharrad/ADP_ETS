// =============================================================================
// CSV parsing for the student roster import. Handles the ADP-RM field format
// (Nom_Eleve + métier codes FO/SO/EQ) and a simple "Prénom;Force;Souplesse;
// Équilibre" sheet, with header detection, separator detection (; , or tab),
// quoted cells, BOM, and métier-code → score mapping. Pure / no DOM.
// =============================================================================

import { codeToScore } from "./calc";

export interface ParsedStudent {
  prenom: string;
  /** the three observable scores, null when missing/invalid */
  vs: [number | null, number | null, number | null];
  /** human-readable issues for this row (e.g. "OBS-01 manquant") */
  issues: string[];
  /** true when prénom + all three scores are present and valid */
  complete: boolean;
}

export interface ParseResult {
  students: ParsedStudent[];
  /** non-empty lines that were skipped (blank prénom, BILAN row, etc.) */
  ignored: number;
  separator: string;
  /** fatal problem — when set, `students` is empty */
  error?: string;
}

const NAME_PATTERNS = ["PRENOM", "PRÉNOM", "NOM_ELEVE", "ELEVE", "ÉLÈVE", "STUDENT", "NOM"];
const OBS_PATTERNS: string[][] = [
  ["OBS01", "OBS-01", "OBS_1", "OBS1", "FORCE", "FO", "POMPE", "SQUAT", "PLANCHE", "GAINAGE"],
  ["OBS02", "OBS-02", "OBS_2", "OBS2", "SOUPLESSE", "SOUPL", "SO", "ETIRE", "ÉTIRE", "PONT"],
  ["OBS03", "OBS-03", "OBS_3", "OBS3", "EQUILIBRE", "ÉQUIL", "EQUIL", "EQ", "UNIPODAL", "PROPRIO"],
];

function detectSep(line: string): string {
  const cand: Array<[string, number]> = ([";", "\t", ","] as const).map((s) => [
    s,
    line.split(s).length - 1,
  ]);
  cand.sort((a, b) => b[1] - a[1]);
  return cand[0][1] > 0 ? cand[0][0] : ",";
}

function cells(line: string, sep: string): string[] {
  return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, "").trim());
}

/** Parse raw CSV text into validated students. Never throws. */
export function parseStudentsCsv(text: string): ParseResult {
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/);

  // 1) Find a header line by a prénom/nom keyword.
  let hi = -1;
  for (let i = 0; i < lines.length; i++) {
    const up = lines[i].toUpperCase();
    if (NAME_PATTERNS.some((p) => up.includes(p))) {
      hi = i;
      break;
    }
  }

  // 2) No keyword header → inspect the first non-empty line. If its cells after
  //    the first look like numeric scores, the file is headerless (data starts
  //    there); otherwise treat that line as the header.
  let headerless = false;
  if (hi === -1) {
    let first = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        first = i;
        break;
      }
    }
    if (first === -1) {
      return { students: [], ignored: 0, separator: ";", error: "Fichier CSV vide." };
    }
    const c0 = cells(lines[first], detectSep(lines[first]));
    const numericCells = c0.slice(1).filter((x) => {
      const n = parseFloat(x);
      return !isNaN(n) && n >= 0 && n <= 10;
    }).length;
    headerless = c0.length >= 2 && numericCells >= 1;
    hi = first;
  }

  const sep = detectSep(lines[hi]);

  // 3) Resolve columns (positional when headerless).
  let nameCol = 0;
  let obsCols: number[] = [1, 2, 3];
  if (!headerless) {
    const hdrs = cells(lines[hi], sep).map((h) => h.toUpperCase());
    const findCol = (pats: string[]) => {
      for (const p of pats) {
        const idx = hdrs.findIndex((h) => h.includes(p));
        if (idx > -1) return idx;
      }
      return -1;
    };
    nameCol = findCol(NAME_PATTERNS);
    if (nameCol === -1) nameCol = 0;
    obsCols = OBS_PATTERNS.map((p) => findCol(p));
    for (let k = 0; k < 3; k++) {
      if (obsCols[k] === -1) {
        const pos = nameCol + 1 + k;
        obsCols[k] = pos < hdrs.length ? pos : -1;
      }
    }
  }

  const students: ParsedStudent[] = [];
  let ignored = 0;
  const dataStart = headerless ? hi : hi + 1;

  for (let li = dataStart; li < lines.length; li++) {
    const raw = lines[li].trim();
    if (!raw || raw.toUpperCase().includes("BILAN_CLASSE")) {
      if (raw) ignored++;
      continue;
    }
    const cols = cells(lines[li], sep);
    const prenom = (cols[nameCol] ?? "").trim();
    if (!prenom) {
      ignored++;
      continue;
    }

    const vs = obsCols.map((ci) => (ci > -1 ? codeToScore(cols[ci] ?? "") : null)) as [
      number | null,
      number | null,
      number | null,
    ];
    const issues: string[] = [];
    vs.forEach((v, i) => {
      if (v === null) issues.push(`OBS-0${i + 1} manquant`);
      else if (v < 0 || v > 10) {
        issues.push(`OBS-0${i + 1} hors 0–10`);
        vs[i] = null;
      }
    });

    students.push({ prenom, vs, issues, complete: issues.length === 0 });
  }

  return { students, ignored, separator: sep };
}

/** A ready-to-fill template (BOM + header + a few example rows). */
export function buildTemplateCsv(): string {
  return (
    "﻿" +
    "Prénom;Force;Souplesse;Équilibre\n" +
    "Sara;9;8;7\n" +
    "Yacine;3;2;4\n" +
    "Imane;6;5;6\n" +
    "Nour;FO~;SO-;EQ+\n"
  );
}
