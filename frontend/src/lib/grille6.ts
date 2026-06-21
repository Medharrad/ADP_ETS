// =============================================================================
// GRILLE D'OBSERVATION — 6 TESTS PHYSIQUES (ADP 2026 · CRMEF Inezgane · BOUARGANE)
// Reproduit fidèlement la grille fournie (Default_Grille_6Tests.docx) :
//   - 6 tests physiques (T1…T6)
//   - barème de conversion « résultat brut → note /10 » (Guide page 2)
//   - Total /60  ·  Note /20 = Total ÷ 60 × 20
// Données de référence figées — identiques pour chaque enseignant. Pur / no DOM.
// =============================================================================

export interface Test6 {
  /** Code court affiché en tête de colonne, ex. "T1". */
  code: string;
  /** Nom du test. */
  nom: string;
  /** Unité de saisie du résultat brut, ex. "sec", "reps / 20 sec". */
  unite: string;
  /** Description / consigne (Guide de notation page 2). */
  description: string;
  /**
   * Barème : pour chaque note 0..10, le résultat brut MINIMUM qui l'accorde.
   * `null` = palier inatteignable (« — » dans la grille, ex. note 1 sur T3/T4).
   * Pour les tests « directs » (T6) le barème n'est pas utilisé.
   */
  seuils: (number | null)[];
  /** true → la saisie EST déjà la note /10 (T6, évaluation directe par critères). */
  direct?: boolean;
  /** Critères d'évaluation directe (T6 uniquement). */
  criteres?: { libelle: string; points: number }[];
}

export const TESTS: Test6[] = [
  {
    code: "T1",
    nom: "GAINAGE",
    unite: "sec",
    description:
      "Le gymnaste est en position planche, en appui sur les pointes de pied et les mains, épaules au-dessus des mains, bras tendus. Le segment jambes-bassin-tronc-tête est aligné, abdominaux et fessiers contractés. Il tient cette position un maximum de temps, jusqu'à déformation de l'alignement.",
    // note  0  1  2  3  4  5  6  7  8  9  10
    seuils: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
  },
  {
    code: "T2",
    nom: "MAINTIEN ATR CONTRE LE MUR",
    unite: "sec",
    description:
      "Le gymnaste est en position d'Appui Tendu Renversé, le ventre face au mur, paumes à 5 cm du mur. Il maintient un alignement parfait le plus longtemps possible. L'évaluateur marque un trait sur le mur (position des pieds) et déclenche le chrono. Si les pieds passent sous le trait : avertissement. Au 2e avertissement, arrêt du chrono.",
    seuils: [0, 3, 6, 9, 12, 15, 18, 21, 25, 30, 35],
  },
  {
    code: "T3",
    nom: "FERMETURE CARPÉE / OUVERTURE FRAPPÉE",
    unite: "reps / 20 sec",
    description:
      "Le gymnaste est allongé sur le dos, bras tendus alignés dans le prolongement du buste. Il monte simultanément jambes et buste, puis redescend en frappant le tapis avec l'ensemble du corps. On ne comptabilise que les montées. Jambes tendues et serrées, mouvement le plus rapide possible.",
    // 0-1 → 0 · note 1 inatteignable (—) · 9-10 → 9 · ≥11 → 10
    seuils: [0, null, 2, 3, 4, 5, 6, 7, 8, 9, 11],
  },
  {
    code: "T4",
    nom: "MONTER / DESCENDRE SUR UNE HAUTEUR",
    unite: "reps / 30 sec",
    description:
      "Exercice de pliométrie (« box jump »). But : effectuer le maximum de répétitions en 30 secondes. Points clés : sauter vers le haut (pas vers l'avant), utiliser le balancier des bras, extension complète de la hanche (ne pas rester fléchi en l'air).",
    // 0-4 → 0 · note 1 inatteignable (—) · 20-22 → 9 · ≥24 → 10
    seuils: [0, null, 6, 8, 10, 12, 14, 16, 18, 20, 24],
  },
  {
    code: "T5",
    nom: "POMPES",
    unite: "reps max",
    description:
      "Face au sol, corps sur pieds et mains, pieds joints, mains plus écartées que les épaules. Le corps s'abaisse en restant droit jusqu'à ce que la poitrine frôle le sol, puis remonte. Fessiers et abdominaux contractés, coudes formant un angle de 0 à 40° avec le corps. Catégories 7-8 ans et 9-10 ans filles FIR : exercice autorisé sur les genoux.",
    // 0 · 1-2 · 3-4 · 5-6 · 7-8 · 9-10 · 11-12 · 13-14 · 15-16 · 17-18 · ≥19
    seuils: [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
  },
  {
    code: "T6",
    nom: "SOUPLESSE FERMETURE CARPÉE AU SOL",
    unite: "/10 direct",
    description:
      "Le gymnaste est en position assise, pieds en flexion contre un tapis d'environ 20 cm de hauteur. Il pose les mains à plat sur le tapis en rapprochant le ventre des cuisses. Évaluation directe sur 10 selon les critères ci-dessous — pas de conversion nécessaire.",
    seuils: [],
    direct: true,
    criteres: [
      { libelle: "Jambes tendues", points: 2 },
      { libelle: "Les poignets dépassent le tapis", points: 3 },
      { libelle: "Le ventre touche les cuisses", points: 5 },
    ],
  },
];

export const NB_TESTS = TESTS.length; // 6
export const TOTAL_MAX = NB_TESTS * 10; // 60

/**
 * Convertit un résultat brut en note /10 via le barème du test.
 * Pour un test direct (T6), le brut EST la note (clampée 0–10).
 * Retourne null si le brut n'est pas un nombre valide.
 */
export function rawToNote(test: Test6, raw: number | null): number | null {
  if (raw === null || Number.isNaN(raw)) return null;
  if (test.direct) return Math.max(0, Math.min(10, raw));
  for (let note = 10; note >= 0; note--) {
    const seuil = test.seuils[note];
    if (seuil !== null && seuil !== undefined && raw >= seuil) return note;
  }
  return 0;
}

/** Parse une saisie texte en nombre (accepte la virgule décimale). Vide → null. */
export function parseRaw(input: string): number | null {
  const s = (input ?? "").trim().replace(",", ".");
  if (s === "") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export interface LigneResultat {
  /** note /10 par test (null si non saisi). */
  notes: (number | null)[];
  /** somme des notes saisies, /60. */
  total: number;
  /** note /20 = total ÷ 60 × 20. */
  note20: number;
  /** true quand les 6 tests sont renseignés. */
  complet: boolean;
}

/** Calcule notes, Total /60 et Note /20 pour une ligne (6 résultats bruts). */
export function calculerLigne(raws: (number | null)[]): LigneResultat {
  const notes = TESTS.map((t, i) => rawToNote(t, raws[i] ?? null));
  let total = 0;
  for (const n of notes) total += n ?? 0;
  const note20 = (total / TOTAL_MAX) * 20;
  const complet = notes.every((n) => n !== null);
  return { notes, total, note20, complet };
}

/**
 * Agrège les 6 notes /10 en 3 familles (/10) pour le moteur pédagogique existant
 * (axes / plan / profils A·B·C). Mapping :
 *   - Force          = moyenne(T3 fermeture carpée, T4 box-jump, T5 pompes)
 *   - Souplesse      = T6 souplesse fermeture
 *   - Équilibre/gain = moyenne(T1 gainage, T2 maintien ATR)  ← tenues statiques / stabilité
 * Les notes manquantes sont ignorées dans chaque moyenne (0 si la famille est vide).
 */
export function notes6ToObs3(notes: (number | null)[]): [number, number, number] {
  const mean = (idxs: number[]) => {
    const vals = idxs.map((i) => notes[i]).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  };
  const force = mean([2, 3, 4]); // T3 · T4 · T5
  const souplesse = notes[5] ?? 0; // T6
  const equilibre = mean([0, 1]); // T1 · T2
  return [force, souplesse, equilibre];
}

/** Moyenne par test + moyenne Total/60 et Note/20 (BILAN CLASSE). */
export function bilanClasse(lignesRaws: (number | null)[][]) {
  const lignes = lignesRaws.map(calculerLigne);
  // une ligne « compte » dès qu'au moins une note y est saisie
  const actives = lignes.filter((l) => l.notes.some((n) => n !== null));
  const n = actives.length;
  const moyTests = TESTS.map((_, i) => {
    const vals = actives.map((l) => l.notes[i]).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  });
  const moyTotal = n ? actives.reduce((s, l) => s + l.total, 0) / n : 0;
  const moyNote20 = n ? actives.reduce((s, l) => s + l.note20, 0) / n : 0;
  return { lignes, moyTests, moyTotal, moyNote20, nbActifs: n };
}
