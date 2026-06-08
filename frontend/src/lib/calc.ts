// =============================================================================
// CALC — pure pedagogical logic for ADP-GYM.
// Ported from the vanilla-JS functions in outil_v0_GYM-ART_DI-GYM.html
// (prof, lacs, axPrio, getSA, analyser, bldAx ranking, genPlan).
// No DOM, no side effects — deterministic given the référentiel.
// =============================================================================

import {
  AX,
  DI,
  DS,
  OBS,
  SA,
  SH,
  type Axe,
  type Consigne,
  type Niveau,
  type SituationApprentissage,
} from "./referentiel";

// -- Per-student input & result ----------------------------------------------

export interface StudentInput {
  prenom: string;
  /** the three observable scores, each 0–10 */
  vs: [number, number, number];
}

export interface Lacune {
  /** index into OBS (0,1,2) */
  i: number;
  /** the score for that observable */
  v: number;
}

export interface StudentResult {
  prenom: string;
  vs: [number, number, number];
  /** average /10 */
  moy: number;
  /** global profile from the average */
  profil: Niveau;
  /** per-observable profile */
  profilDetail: [Niveau, Niveau, Niveau];
  /** observables below threshold B, weakest first */
  lacunes: Lacune[];
  /** priority axis label */
  axe: string;
  /** recommended learning situation */
  sa: SituationApprentissage;
  /** rank in class (1 = best average) */
  rang: number;
}

// -- Atomic functions (ported 1:1) -------------------------------------------

/** Map a 0–10 score to an A/B/C profile. */
export function profil(v: number): Niveau {
  return v >= SH.C ? "C" : v >= SH.B ? "B" : "A";
}

/** Observables below threshold B, sorted weakest-first. */
export function lacunes(vs: number[]): Lacune[] {
  const l: Lacune[] = [];
  vs.forEach((v, i) => {
    if (v < SH.B) l.push({ i, v });
  });
  return l.sort((a, b) => a.v - b.v);
}

const AXE_PRIO_LABELS = [
  "Force musculaire — renforcer le tronc, les membres supérieurs et inférieurs",
  "Souplesse — gagner en amplitude des jambes et du dos",
  "Équilibre & coordination — stabiliser et affiner la proprioception",
];

/** Priority-axis label derived from the weakest lacune. */
export function axePrio(l: Lacune[]): string {
  if (l.length === 0) return "Approfondissement — composition et performance";
  return AXE_PRIO_LABELS[l[0].i] || AXE_PRIO_LABELS[0];
}

/** Recommended SA: none → C; deep gap (<3) → A; otherwise B. */
export function getSA(l: Lacune[]): SituationApprentissage {
  if (l.length === 0) return SA.C;
  return l[0].v < 3 ? SA.A : SA.B;
}

// -- Class analysis -----------------------------------------------------------

export interface ClassAnalysis {
  results: StudentResult[];
  /** class average /10 */
  moyClasse: number;
  /** average per observable /10 */
  moyObservables: [number, number, number];
  /** count of students per profile */
  counts: Record<Niveau, number>;
  total: number;
  /** dominant profile (A wins ties, then B, then C) */
  dominant: Niveau;
  /** automatic dominant decision text */
  decision: string;
}

const DECISIONS: Record<Niveau, string> = {
  A: "Classe débutante — Priorité renforcement de base : gainage du tronc, force MS et MI",
  B: "Classe intermédiaire — Différenciation A/B : consolider la force, développer la souplesse",
  C: "Classe avancée — Approfondissement : souplesse fonctionnelle, équilibre et coordination",
};

/**
 * Analyse a roster: compute per-student results (ranked) and class aggregates.
 * Mirrors analyser() + bldR1() stats from the HTML tool.
 */
export function analyser(students: StudentInput[]): ClassAnalysis {
  const results: StudentResult[] = students.map((e) => {
    const moy = (e.vs[0] + e.vs[1] + e.vs[2]) / 3;
    const ls = lacunes(e.vs);
    return {
      prenom: e.prenom,
      vs: e.vs,
      moy,
      profil: profil(moy),
      profilDetail: e.vs.map(profil) as [Niveau, Niveau, Niveau],
      lacunes: ls,
      axe: axePrio(ls),
      sa: getSA(ls),
      rang: 0,
    };
  });

  results.sort((a, b) => b.moy - a.moy);
  results.forEach((r, i) => (r.rang = i + 1));

  const total = results.length;
  const moyClasse = total ? results.reduce((s, r) => s + r.moy, 0) / total : 0;
  const moyObservables = [0, 1, 2].map((i) =>
    total ? results.reduce((s, r) => s + r.vs[i], 0) / total : 0,
  ) as [number, number, number];

  const counts: Record<Niveau, number> = { A: 0, B: 0, C: 0 };
  results.forEach((r) => counts[r.profil]++);

  const mx = Math.max(counts.A, counts.B, counts.C);
  const dominant: Niveau = counts.A === mx ? "A" : counts.B === mx ? "B" : "C";

  return {
    results,
    moyClasse,
    moyObservables,
    counts,
    total,
    dominant,
    decision: DECISIONS[dominant],
  };
}

// -- Axis ranking (step 2) ----------------------------------------------------

export interface AxeScore {
  axe: Axe;
  /** % of students concerned (score below B on the axis's observable) */
  pertinence: number;
}

/**
 * Rank all axes by how many students are concerned (weakest on the axis's
 * targeted observable), most-relevant first. Mirrors bldAx().
 */
export function rankAxes(results: StudentResult[]): AxeScore[] {
  const total = results.length || 1;
  return AX.map((axe) => ({
    axe,
    pertinence: Math.round(
      (results.filter((r) => r.vs[axe.oi] < SH.B).length / total) * 100,
    ),
  })).sort((a, b) => b.pertinence - a.pertinence);
}

// -- Cycle plan generation (step 3 preview + step 4) --------------------------

export interface SeanceDistribution {
  axe: Axe;
  /** number of séances allocated to this axis */
  seances: number;
}

/** Distribute séances across selected axes (DI lookup). Mirrors uSl()/genPlan(). */
export function distribute(
  selectedAxeIds: number[],
  nSeances: number,
): SeanceDistribution[] {
  const na = selectedAxeIds.length;
  const dist = (DI[na] && DI[na][nSeances]) || [];
  const axes = selectedAxeIds
    .map((id) => AX.find((a) => a.id === id))
    .filter((a): a is Axe => Boolean(a));
  return dist.map((seances, i) => ({ axe: axes[i], seances })).filter((d) => d.axe);
}

export interface PlanSeance {
  numero: number;
  axeId: number;
  objectif: string;
  /** per-group consignes (A/B/C) */
  groupes: Record<Niveau, Consigne>;
  /** observation indicator shown before the next séance (undefined on last of sequence) */
  indicateur?: string;
  isLast: boolean;
}

export interface PlanSequence {
  index: number;
  axe: Axe;
  seanceStart: number;
  seanceEnd: number;
  seances: PlanSeance[];
}

export interface CyclePlan {
  sequences: PlanSequence[];
  nSeances: number;
  nAxes: number;
  resume: string;
}

/**
 * Generate the full differentiated cycle plan. Mirrors genPlan().
 */
export function genPlan(
  selectedAxeIds: number[],
  nSeances: number,
  analysis: ClassAnalysis,
): CyclePlan {
  const na = selectedAxeIds.length;
  const dist = (DI[na] && DI[na][nSeances]) || [];
  const axes = selectedAxeIds
    .map((id) => AX.find((a) => a.id === id))
    .filter((a): a is Axe => Boolean(a));

  const sequences: PlanSequence[] = [];
  let cursor = 0; // 0-based séance offset

  dist.forEach((ns, si) => {
    const axe = axes[si];
    if (!axe) return;
    const seanceStart = cursor + 1;
    const seanceEnd = cursor + ns;
    const seances: PlanSeance[] = [];

    for (let s = 0; s < ns; s++) {
      const numero = cursor + 1 + s;
      const isLast = si === dist.length - 1 && s === ns - 1;
      const objectif = isLast
        ? "Bilan et évaluation des capacités musculaires (retest terrain)"
        : `Développer : ${axe.titre}`;
      seances.push({
        numero,
        axeId: axe.id,
        objectif,
        groupes: axe.csg,
        indicateur: s < ns - 1 ? axe.ind : undefined,
        isLast,
      });
    }

    sequences.push({ index: si, axe, seanceStart, seanceEnd, seances });
    cursor += ns;
  });

  // Résumé
  const seqStr = dist
    .map((ns, i) => {
      const a = axes[i];
      return a ? `Axe ${a.id} (${ns} séance${ns > 1 ? "s" : ""})` : "?";
    })
    .join(" — ");

  const { counts, total } = analysis;
  const dom: Niveau =
    counts.A >= counts.B && counts.A >= counts.C
      ? "A"
      : counts.B >= counts.C
        ? "B"
        : "C";
  const pct = total ? Math.round((counts[dom] / total) * 100) : 0;
  const reeval = Math.ceil(dist.length / 2);

  const resume =
    `${seqStr}. Ce cycle de ${nSeances} séances cible ${na} axes prioritaires. ` +
    `Profil le plus concerné : ${dom} (${counts[dom]} élève${counts[dom] > 1 ? "s" : ""} · ${pct}%). ` +
    `Réévaluer après la séquence ${reeval} avec une nouvelle collecte terrain.`;

  return { sequences, nSeances, nAxes: na, resume };
}

// -- CSV helpers --------------------------------------------------------------

/**
 * Convert a raw CSV cell to a 0–10 score. Accepts métier codes
 * (FO−/FO~/FO+, SO…, EQ…), plain A/B/C, or a numeric value.
 * Returns null when the cell can't be interpreted. Mirrors the gs() closure.
 */
export function codeToScore(raw: string): number | null {
  const r = (raw || "").trim().toUpperCase();
  if (!r) return null;
  if (r.indexOf("FO-") > -1 || r === "FO−") return DS.A;
  if (r === "FO~") return DS.B;
  if (r === "FO+") return DS.C;
  if (r.indexOf("SO-") > -1 || r === "SO−") return DS.A;
  if (r === "SO~") return DS.B;
  if (r === "SO+") return DS.C;
  if (r.indexOf("EQ-") > -1 || r === "EQ−") return DS.A;
  if (r === "EQ~") return DS.B;
  if (r === "EQ+") return DS.C;
  if (r === "A") return DS.A;
  if (r === "B") return DS.B;
  if (r === "C") return DS.C;
  const n = parseFloat(r);
  return isNaN(n) ? null : n;
}

/** Métier code for an observable index + profile (used for CSV export). */
export function codeFor(obsIndex: number, level: Niveau): string {
  return OBS[obsIndex].codes[level];
}
