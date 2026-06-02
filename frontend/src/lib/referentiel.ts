// =============================================================================
// RÉFÉRENTIEL — ADP-GYM (Gymnastique Artistique · DI-GYM · ADP 2026)
// Ported verbatim from outil_v0_GYM-ART_DI-GYM.html (référentiel + grille_v2 +
// ADP2026_DI_GYM). Fixed global reference data — same for every teacher.
// =============================================================================

/** A/B/C profile level. A = débutant, B = intermédiaire, C = avancé. */
export type Niveau = "A" | "B" | "C";

export interface Observable {
  id: string;
  nom: string;
  famille: string;
  /** métier code per level, e.g. PT−/PT~/PT+ */
  codes: Record<Niveau, string>;
  /** observed-conduct descriptor per level */
  conduites: Record<Niveau, string>;
  /** "formulation motrice" descriptor per level */
  motrice: Record<Niveau, string>;
}

/** Per-level learning situation (situation d'apprentissage) bound to an axis. */
export interface Consigne {
  sa: string;
  /** the exercise instruction */
  c: string;
  /** the success criterion */
  cr: string;
}

export interface Axe {
  id: number;
  /** index into OBS this axis primarily targets */
  oi: number;
  titre: string;
  desc: string;
  prereq: string;
  impact: string;
  /** observable indicator of progress */
  ind: string;
  /** consignes per level */
  csg: Record<Niveau, Consigne>;
}

export interface SituationApprentissage {
  nom: string;
  lib: string;
}

// -- Observables --------------------------------------------------------------

export const OBS: Observable[] = [
  {
    id: "OBS-01",
    nom: "Posture et tonicité globale en appui",
    famille: "F1·F5",
    codes: { A: "PT−", B: "PT~", C: "PT+" },
    conduites: {
      A: "Corps mou, chutes de bassin, ruptures > 3 éléments",
      B: "Relâchement sur dernier tiers",
      C: "Gainage continu 100% enchaînement",
    },
    motrice: {
      A: "l'élève maintient le gainage sur 3 éléments consécutifs sans rupture",
      B: "l'élève maintient la tonicité sur plus de la moitié de l'enchaînement",
      C: "l'élève maintient un gainage continu sur la totalité de l'enchaînement",
    },
  },
  {
    id: "OBS-02",
    nom: "Gabarit moteur du renversement — ATR / Roulade",
    famille: "F1",
    codes: { A: "GM−", B: "GM~", C: "GM+" },
    conduites: {
      A: "Renversement absent ou aide systématique",
      B: "Renversement réalisé, axe perturbé",
      C: "ATR aligné 3s, roulade enchaînée sans aide",
    },
    motrice: {
      A: "l'élève réalise l'ATR sans aide pendant 2 secondes",
      B: "l'élève réalise un renversement autonome axe aligné",
      C: "l'élève enchaîne ATR et roulade sans pause",
    },
  },
  {
    id: "OBS-03",
    nom: "Composition et liaisons entre éléments",
    famille: "F1-F5",
    codes: { A: "CL−", B: "CL~", C: "CL+" },
    conduites: {
      A: "Juxtaposition 1 famille, arrêts fréquents",
      B: "2 familles, transitions hésitantes",
      C: "Liaison fluide ≥3 familles, 0 arrêt",
    },
    motrice: {
      A: "l'élève enchaîne 2 éléments de familles différentes sans arrêt complet",
      B: "l'élève produit un enchaînement 2 familles avec au max 1 rupture",
      C: "l'élève réalise un enchaînement 3 familles minimum sans rupture",
    },
  },
];

// -- Thresholds & code→score mapping ------------------------------------------

/** Score thresholds: >= C → profile C, >= B → profile B, else A. */
export const SH = { C: 7.5, B: 4.5 } as const;

/** Métier code → numeric score (used when importing A/B/C coded CSV). */
export const DS: Record<Niveau, number> = { A: 3, B: 6, C: 9 };

// -- Situations d'apprentissage -----------------------------------------------

export const SA: Record<Niveau, SituationApprentissage> = {
  A: { nom: "SA-A1", lib: "Adaptation anatomique posturale" },
  B: { nom: "SA-B1", lib: "Renforcement fonctionnel gymnique" },
  C: { nom: "SA-C1", lib: "Intégration technique et composition" },
};

// -- Axes prioritaires --------------------------------------------------------

export const AX: Axe[] = [
  {
    id: 1,
    oi: 0,
    titre: "Gainage et tonicité posturale globale",
    desc: "Construction et maintien de l'axe corporel sur la durée de l'enchaînement",
    prereq: "N1-5 · Tonus et gestion de l'effort",
    impact: "N2-6 · N2-8 · N2-9",
    ind: "l'élève maintient sa tonicité sur 4 éléments consécutifs sans rupture visible",
    csg: {
      A: { sa: "SA-A1", c: "Tenir la planche 10 secondes, dos droit, lombaires neutres", cr: "Dos aligné tête-talons pendant toute la durée" },
      B: { sa: "SA-B1", c: "3 planches dynamiques enchaînées avec lever de jambe alterné", cr: "Hanches stables lors de chaque lever de jambe" },
      C: { sa: "SA-C1", c: "Maintenir le gainage sur un enchaînement de 5 éléments", cr: "Aucune rupture posturale du premier au dernier élément" },
    },
  },
  {
    id: 2,
    oi: 1,
    titre: "Gabarit moteur du renversement — ATR et roulade",
    desc: "Construction et stabilisation de l'ATR et de la roulade sans aide",
    prereq: "N1-2 · N1-3 · Réalisation et liaison du renversement",
    impact: "N2-3 · N2-4 · N2-6",
    ind: "l'élève réalise un ATR 3 secondes sans aide lors de 2 tentatives consécutives",
    csg: {
      A: { sa: "SA-A1", c: "5 tentatives ATR contre mur, tenir 3 secondes puis lâcher le mur", cr: "Corps aligné tête-épaules-hanches 3 secondes sans appui" },
      B: { sa: "SA-B1", c: "Enchaîner ATR libre et roulade avant groupée sans pause", cr: "ATR tenu 2 secondes, roulade repart sans arrêt" },
      C: { sa: "SA-C1", c: "Réaliser ATR + roulade + élément F2 ou F4", cr: "3 éléments enchaînés sans aide, axe maintenu" },
    },
  },
  {
    id: 3,
    oi: 2,
    titre: "Composition et liaisons multi-familles",
    desc: "Construction d'un enchaînement avec transitions intentionnelles",
    prereq: "N1-4 · N1-1 · Coordonner et choisir",
    impact: "N2-2 · N2-5 · N2-7 · N2-8",
    ind: "l'élève choisit spontanément 2 familles différentes en composition libre",
    csg: {
      A: { sa: "SA-A1", c: "Composer 3 éléments de 2 familles différentes, exécuter 2 fois", cr: "2 familles identifiables, pas d'arrêt entre elles" },
      B: { sa: "SA-B1", c: "Composer 5 éléments avec 2 transitions préparées", cr: "Transitions intentionnelles, sans perte d'équilibre" },
      C: { sa: "SA-C1", c: "Présenter un enchaînement de 8 éléments de 3 familles minimum", cr: "Fluide, 3 familles identifiées, zéro rupture" },
    },
  },
  {
    id: 4,
    oi: 1,
    titre: "Coordination tourner — voler — se renverser",
    desc: "Réalisation d'éléments complexes combinant rotation et renversement (N2-3)",
    prereq: "N1-2 consolidé — Axe 2 prérequis",
    impact: "N2-3 · N2-4 · N2-8",
    ind: "l'élève enchaîne une rotation et un renversement sans pause lors de 2 tentatives sur 3",
    csg: {
      A: { sa: "SA-A1", c: "Roulade avant + arrêt debout + roulade arrière : 3 rotations consécutives", cr: "3 rotations sans aide, directions différentes" },
      B: { sa: "SA-B1", c: "ATR suivi d'une roue, passage sans pause", cr: "Passage ATR-roue sans arrêt, gainage maintenu" },
      C: { sa: "SA-C1", c: "Série acrobatique : 2 renversements + 1 rotation en vol", cr: "Série fluide, éléments enchaînés sans rupture" },
    },
  },
  {
    id: 5,
    oi: 0,
    titre: "Enchaîner sans rupture avec alignement segmentaire",
    desc: "Amplitude, correction et alignement maintenus sur tout l'enchaînement (N2-8)",
    prereq: "N1-2 · N1-4 · N1-5 consolidés — Axes 1-2-3 prérequis",
    impact: "N2-8 · N2-9",
    ind: "l'élève ne présente aucune rupture d'alignement sur les 3 derniers éléments",
    csg: {
      A: { sa: "SA-A1", c: "Réaliser l'enchaînement avec une correction de posture indiquée", cr: "Correction visible sur au moins 3 éléments" },
      B: { sa: "SA-B1", c: "Réaliser 2 fois et noter les éléments où la posture défaille", cr: "L'élève identifie 1 élément à corriger au 2e passage" },
      C: { sa: "SA-C1", c: "Présenter devant un jury de pairs avec code simplifié", cr: "Note maximale sur le critère alignement du code" },
    },
  },
  {
    id: 6,
    oi: 0,
    titre: "Gestion de l'effort et du rythme sur la prestation",
    desc: "Maintien de la qualité tonique et du rythme jusqu'au dernier élément (N2-9)",
    prereq: "N1-5 consolidé — Axe 1 prérequis",
    impact: "N2-9",
    ind: "l'élève maintient une qualité d'exécution constante entre le premier et le dernier élément",
    csg: {
      A: { sa: "SA-A1", c: "3 passages complets avec 1 minute de récupération", cr: "Qualité du 3e passage égale ou supérieure au 1er" },
      B: { sa: "SA-B1", c: "Réaliser l'enchaînement sur musique avec temps forts", cr: "Actions coïncident avec au moins 3 temps forts musicaux" },
      C: { sa: "SA-C1", c: "Donner du rythme par variations d'amplitude et de vitesse", cr: "2 moments de contraste dynamique identifiés par l'observateur" },
    },
  },
];

// -- Session distribution lookup ----------------------------------------------
// DI[nombreAxes][nombreSeances] → array of séances allocated per axis (in order).

export const DI: Record<number, Record<number, number[]>> = {
  3: { 6: [2, 2, 2], 7: [2, 2, 3], 8: [3, 2, 3], 9: [3, 3, 3], 10: [3, 4, 3] },
  4: { 6: [1, 2, 2, 1], 7: [2, 2, 2, 1], 8: [2, 2, 2, 2], 9: [2, 3, 2, 2], 10: [3, 2, 3, 2] },
};

/** Min/max séances supported by the cycle slider. */
export const SEANCES = { min: 6, max: 10, default: 8 } as const;

/** Min/max priority axes selectable. */
export const AXES_RANGE = { min: 3, max: 4 } as const;
