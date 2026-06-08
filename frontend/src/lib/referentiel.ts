// =============================================================================
// RÉFÉRENTIEL — ADP-RM (Renforcement Musculaire ET Souplesse · ADP 2026)
// Built from Referentiel_RM_Souplesse_ADP2026.md (CRMEF Inezgane · BOUARGANE).
// Six critères RM-01…RM-06 (force tronc/MS/MI · souplesse jambes/dos · équilibre)
// regroupés en 3 familles notées /10 : Force · Souplesse · Équilibre.
// Différenciation Garçons / Filles dans les listes d'exercices (exG / exF).
// Fixed global reference data — same for every teacher.
// =============================================================================

/** A/B/C profile level. A = débutant, B = intermédiaire, C = avancé. */
export type Niveau = "A" | "B" | "C";

export interface Observable {
  id: string;
  nom: string;
  famille: string;
  /** métier code per level, e.g. FO−/FO~/FO+ */
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
  /** exercices différenciés — garçons */
  exG: string[];
  /** exercices différenciés — filles */
  exF: string[];
  /** programme d'entraînement progressif (S1–S9) */
  prog: string;
}

export interface SituationApprentissage {
  nom: string;
  lib: string;
}

// -- Observables --------------------------------------------------------------

export const OBS: Observable[] = [
  {
    id: "OBS-01",
    nom: "Force musculaire (tronc · MS · MI)",
    famille: "RM-01 · RM-02 · RM-03",
    codes: { A: "FO−", B: "FO~", C: "FO+" },
    conduites: {
      A: "Planche < 20s · pompes 0–3 · squats < 6 — force insuffisante",
      B: "Planche 20–44s · pompes 4–8 · squats 6–13 — en construction",
      C: "Planche ≥ 45s · pompes ≥ 9 · squats ≥ 14 — force stable",
    },
    motrice: {
      A: "l'élève réalise quelques répétitions mais sans maintenir le gainage",
      B: "l'élève réalise des séries complètes avec une forme correcte",
      C: "l'élève réalise des séries longues, amplitude totale et gainage maintenu",
    },
  },
  {
    id: "OBS-02",
    nom: "Souplesse (jambes · dos)",
    famille: "RM-04 · RM-05",
    codes: { A: "SO−", B: "SO~", C: "SO+" },
    conduites: {
      A: "Doigts loin du sol (+10cm) · pont impossible — amplitude limitée",
      B: "Doigts près du sol · pont bras fléchis — souplesse en cours",
      C: "Doigts au sol · pont bras tendus / roue — souplesse fonctionnelle",
    },
    motrice: {
      A: "l'élève est bloqué avant l'horizontale, articulations raides",
      B: "l'élève atteint une amplitude moyenne, assistée ou partielle",
      C: "l'élève mobilise une amplitude complète, fluide et contrôlée",
    },
  },
  {
    id: "OBS-03",
    nom: "Équilibre & coordination",
    famille: "RM-06",
    codes: { A: "EQ−", B: "EQ~", C: "EQ+" },
    conduites: {
      A: "Unipodal yeux fermés < 5s · chute immédiate · aucune correction",
      B: "Unipodal 5–14s · oscillations récupérées · corrections conscientes",
      C: "Unipodal ≥ 15s · micro-corrections automatiques · aucune oscillation < 10s",
    },
    motrice: {
      A: "l'élève chute vite, compense massivement avec les bras",
      B: "l'élève tient avec des corrections visibles et conscientes",
      C: "l'élève stabilise par des micro-corrections proprioceptives automatiques",
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
  A: { nom: "SA-A1", lib: "Construction et mobilisation de base" },
  B: { nom: "SA-B1", lib: "Consolidation et développement" },
  C: { nom: "SA-C1", lib: "Complexification et progression" },
};

// -- Axes prioritaires --------------------------------------------------------

export const AX: Axe[] = [
  {
    id: 1,
    oi: 0,
    titre: "RM-01 · Force du tronc — Gainage (planche)",
    desc: "Maintien de l'axe corporel (tête-épaules-hanches-talons) en isométrie · Test : planche frontale isométrique — durée de tenue (s), appui avant-bras + pointes de pieds, dos plat",
    prereq: "Conscience du bassin neutre · respiration en gainage",
    impact: "Transmission des forces · protection du rachis · maintien postural",
    ind: "l'élève tient la planche ≥ 45 s, alignement parfait, aucune compensation",
    csg: {
      A: { sa: "SA-A1", c: "Construction : planche sur genoux puis complète", cr: "Tenir ≥ 20 s sans effondrement ni dos creux" },
      B: { sa: "SA-B1", c: "Consolidation : endurance musculaire du gainage", cr: "Tenir 45 s sans compensation lombaire" },
      C: { sa: "SA-C1", c: "Complexifier : planche dynamique, charge ajoutée", cr: "Alignement parfait maintenu, même en dynamique" },
    },
    exG: ["Planche ventrale 3×20s", "Planche latérale 3×15s/côté", "Mountain climbers 3×15", "Superman 3×12"],
    exF: ["Planche ventrale 3×15s", "Hollow hold 3×15s", "Gainage dynamique bras 3×12", "Dead bug 3×10"],
    prog: "S1-S3 : planche genoux → complète · S4-S6 : planche + déstabilisation · S7-S9 : planche dynamique · +10s/semaine",
  },
  {
    id: 2,
    oi: 0,
    titre: "RM-02 · Force des membres supérieurs — Pompes",
    desc: "Porter / pousser le poids du corps sur les bras, amplitude complète, gainage maintenu · Test : pompes au sol — max de répétitions complètes, coudes 45°, front à 3 cm du sol",
    prereq: "Gainage de base · alignement tête-hanches-pieds",
    impact: "Poussée · maintien postural en appui · transferts de charge",
    ind: "l'élève réalise ≥ 9 pompes (G) / ≥ 7 (F), amplitude totale, gainage maintenu",
    csg: {
      A: { sa: "SA-A1", c: "Construction : pompes contre mur → inclinées → genoux", cr: "Atteindre 4 pompes (G) / 3 (F) corps aligné" },
      B: { sa: "SA-B1", c: "Développement : volume + tempo 2-0-2", cr: "Atteindre 9 pompes (G) / 7 (F), gainage tenu" },
      C: { sa: "SA-C1", c: "Progression : pompes déclinées, dips, chargées", cr: "Amplitude totale, remontée explosive, gainage du début à la fin" },
    },
    exG: ["Pompes classiques 3×8", "Dips sur banc 3×10", "Maintien ATR contre mur 4×5s", "Pompes déclinées 3×8"],
    exF: ["Pompes sur genoux 3×10", "Appuis statiques sol 3×10s", "ATR assisté 4×5s", "Pompes inclinées sur banc 3×10"],
    prog: "S1-S3 : pompes inclinées/genoux · S4-S6 : pompes classiques 3×6 tempo 3-0-1 · S7-S9 : volume + variantes · +1 rep/séance",
  },
  {
    id: 3,
    oi: 0,
    titre: "RM-03 · Force des membres inférieurs — Squats",
    desc: "Puissance d'impulsion + contrôle excentrique à la réception, amplitude, alignement genoux · Test : squat au poids du corps — max de répétitions (cuisses // sol), 1 série max",
    prereq: "Mobilité de cheville · descente contrôlée sans valgus",
    impact: "Poussée des jambes · stabilité du bassin · puissance MI",
    ind: "l'élève réalise ≥ 14 squats complets, amplitude totale, genoux alignés",
    csg: {
      A: { sa: "SA-A1", c: "Construction : squat sur chaise → goblet squat", cr: "Atteindre 6 squats cuisses // sol, sans valgus" },
      B: { sa: "SA-B1", c: "Développement : squat 3×10 tempo 3-1-1 + fentes", cr: "Atteindre 14 squats, remontée contrôlée" },
      C: { sa: "SA-C1", c: "Progression : squat bulgare, sauts, pistol assisté", cr: "Amplitude totale, remontée explosive, aucune perte de qualité" },
    },
    exG: ["Squats complets 3×12", "Fentes avant 3×10/jambe", "Sauts explosifs 3×8", "Nordic curl assisté 3×6"],
    exF: ["Squats 3×12", "Fentes avant 3×10/jambe", "Step-up sur banc 3×10/jambe", "Fentes latérales 3×10"],
    prog: "S1-S3 : squat sur chaise · S4-S6 : squat complet + fentes 3×10 · S7-S9 : squat sauté + step-up · +1 rep/semaine",
  },
  {
    id: 4,
    oi: 1,
    titre: "RM-04 · Souplesse des jambes",
    desc: "Amplitude ischio-jambiers, adducteurs, psoas (statique et dynamique) · Test : distance doigts-sol debout, jambes tendues, flexion max du tronc (− sous le sol, + au-dessus)",
    prereq: "Échauffement articulaire · mobilité de hanche",
    impact: "Grand écart · flexion du tronc · amplitude gestuelle",
    ind: "doigts touchent ou dépassent le sol (0 cm ou dessous), grand écart 170-180°",
    csg: {
      A: { sa: "SA-A1", c: "Mobilisation progressive : étirements 2×30s quotidiens", cr: "Descendre le tronc jusqu'à l'horizontale" },
      B: { sa: "SA-B1", c: "Consolidation : étirements actifs et dynamiques", cr: "Doigts près du sol, grand écart ~150° assisté" },
      C: { sa: "SA-C1", c: "Maintien : routine mobilité + gainage excentrique", cr: "Doigts au sol, grand écart 170-180° fonctionnel" },
    },
    exG: ["Étirement ischio-jambiers debout 2×30s", "Étirement adducteurs assis 2×30s", "Fente avant statique 2×30s/jambe", "Flexion tronc avec bâton 2×20s"],
    exF: ["Grand écart progressif 3×30-45s", "Papillon adducteurs 3×30s", "Étirement ischio sol 2×30s/jambe", "Fente basse dynamique 2×15"],
    prog: "Après chaque séance : 3 étirements 30s ×2 · PNF recommandé S4+ · associer renforcement excentrique ischio-jambiers",
  },
  {
    id: 5,
    oi: 1,
    titre: "RM-05 · Souplesse du dos",
    desc: "Mobilité rachidienne en extension/flexion, dissociation des ceintures, ondulation segmentaire · Test : test du pont — réalisation et qualité (allongé dos au sol, mains sous épaules, pousser bras + jambes)",
    prereq: "Mobilité dorsale · échauffement de la colonne",
    impact: "Pont · roue · qualité d'ondulation segmentaire",
    ind: "pont bras tendus / roue réalisée, cobra 80°+, ondulation fluide et segmentée",
    csg: {
      A: { sa: "SA-A1", c: "Mobilisation : cobra + chat-vache + extension dorsale", cr: "Réaliser le pont au sol (bras fléchis)" },
      B: { sa: "SA-B1", c: "Développement : pont + roue assistée + cobra actif", cr: "Pont bras tendus, cobra ~60°" },
      C: { sa: "SA-C1", c: "Entretien : roue libre + bridges dynamiques", cr: "Roue seul, ondulation fluide et segmentée" },
    },
    exG: ["Cobra stretch 3×25s", "Extension dorsale superman 3×12", "Pont assisté 3×20s", "Chat-vache 3×10"],
    exF: ["Cobra stretch 3×25s", "Pont 3×25s", "Roue assistée 3×5s", "Ondulation segmentaire 3×10"],
    prog: "3 min mobilité dorsale avant chaque séance · combo extension + flexion · progresser vers la roue S5-S6 pour les avancés",
  },
  {
    id: 6,
    oi: 2,
    titre: "RM-06 · Équilibre et coordination",
    desc: "Stabilité statique unipodale, corrections proprioceptives, coordination segmentaire · Test : équilibre unipodal yeux fermés — durée de maintien (s), chrono arrêté dès que le pied d'appui bouge",
    prereq: "Tonus postural de base",
    impact: "Stabilité · proprioception · postures gymniques tenues",
    ind: "l'élève tient ≥ 15 s sans appui correcteur, micro-corrections automatiques",
    csg: {
      A: { sa: "SA-A1", c: "Construction : appui bi → uni, yeux ouverts → fermés", cr: "Tenir 5 s en appui unipodal" },
      B: { sa: "SA-B1", c: "Développement : appui uni surface instable, arabesque", cr: "Tenir 15 s, oscillations récupérées" },
      C: { sa: "SA-C1", c: "Complexifier : surface instable + charge, yeux fermés", cr: "Aucune oscillation avant 10 s, corrections automatiques" },
    },
    exG: ["Équilibre unipodal yeux ouverts/fermés 3×20s", "Marche sur ligne 3×10m", "Proprioception coussin 3×30s", "Arabesque tenue 3×10s"],
    exF: ["Équilibre unipodal arabesque 3×15s", "Maintien posture gymnique 4×10s", "Proprioception yeux fermés 3×30s", "Enchaînement équilibre 3×5"],
    prog: "5 min proprioception en fin de séance · stable → instable → instable yeux fermés · objectif +5s/semaine",
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
