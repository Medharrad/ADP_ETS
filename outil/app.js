/* =============================================================================
   Outil ADP 2026 — RM & Souplesse · DI-GYM
   Version statique (HTML/CSS/JS pur, hors-ligne, 100 % locale).

   La LOGIQUE MÉTIER (observables, seuils, décisions, distribution des séances,
   plan de cycle, parsing/export CSV) est portée À L'IDENTIQUE depuis le projet
   Next.js :  src/lib/referentiel.ts · src/lib/calc.ts · src/lib/csv.ts.
   Aucun seuil ni aucune règle pédagogique n'a été modifié.

   Ajouts propres au déploiement GitHub Pages :
     • persistance automatique (localStorage)         → condition 3
     • export / import de session (JSON)               → condition 6
     • réinitialisation avec confirmation              → condition 5
     • données de démonstration                        → condition 8
   Les fonctionnalités « IA » du projet Next.js ne sont PAS reprises : elles
   dépendent d'une API payante, interdite par la condition 1.
   ============================================================================= */
(function () {
  "use strict";

  // ===========================================================================
  // 1) RÉFÉRENTIEL — copie fidèle de src/lib/referentiel.ts
  // ===========================================================================

  /** Observables (familles musculaires) — notés /10. */
  const OBS = [
    {
      id: "OBS-01",
      nom: "Force musculaire (tronc · MS · MI)",
      famille: "RM-01 · RM-02 · RM-03",
      codes: { A: "FO−", B: "FO~", C: "FO+" },
    },
    {
      id: "OBS-02",
      nom: "Souplesse (jambes · dos)",
      famille: "RM-04 · RM-05",
      codes: { A: "SO−", B: "SO~", C: "SO+" },
    },
    {
      id: "OBS-03",
      nom: "Équilibre & coordination",
      famille: "RM-06",
      codes: { A: "EQ−", B: "EQ~", C: "EQ+" },
    },
  ];

  /** Seuils de score : >= C → profil C, >= B → profil B, sinon A. */
  const SH = { C: 7.5, B: 4.5 };

  /** Code métier → score numérique (import CSV codé A/B/C). */
  const DS = { A: 3, B: 6, C: 9 };

  /** Situations d'apprentissage par niveau. */
  const SA = {
    A: { nom: "SA-A1", lib: "Construction et mobilisation de base" },
    B: { nom: "SA-B1", lib: "Consolidation et développement" },
    C: { nom: "SA-C1", lib: "Complexification et progression" },
  };

  /** Axes prioritaires RM-01 → RM-06. */
  const AX = [
    {
      id: 1,
      oi: 0,
      titre: "RM-01 · Force du tronc — Gainage (planche)",
      desc: "Maintien de l'axe corporel (tête-épaules-hanches-talons) en isométrie · Test : planche frontale isométrique — durée de tenue (s), appui avant-bras + pointes de pieds, dos plat",
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

  /** DI[nombreAxes][nombreSeances] → séances allouées par axe (dans l'ordre). */
  const DI = {
    3: { 6: [2, 2, 2], 7: [2, 2, 3], 8: [3, 2, 3], 9: [3, 3, 3], 10: [3, 4, 3] },
    4: { 6: [1, 2, 2, 1], 7: [2, 2, 2, 1], 8: [2, 2, 2, 2], 9: [2, 3, 2, 2], 10: [3, 2, 3, 2] },
  };

  const SEANCES = { min: 6, max: 10, default: 8 };
  const AXES_RANGE = { min: 3, max: 4 };

  // ===========================================================================
  // 2) CALC — copie fidèle de src/lib/calc.ts (déterministe, sans DOM)
  // ===========================================================================

  /** Score 0–10 → profil A/B/C. */
  function profil(v) {
    return v >= SH.C ? "C" : v >= SH.B ? "B" : "A";
  }

  /** Observables sous le seuil B, triés du plus faible au plus fort. */
  function lacunes(vs) {
    const l = [];
    vs.forEach((v, i) => {
      if (v < SH.B) l.push({ i: i, v: v });
    });
    return l.sort((a, b) => a.v - b.v);
  }

  const AXE_PRIO_LABELS = [
    "Force musculaire — renforcer le tronc, les membres supérieurs et inférieurs",
    "Souplesse — gagner en amplitude des jambes et du dos",
    "Équilibre & coordination — stabiliser et affiner la proprioception",
  ];

  /** Axe prioritaire déduit de la lacune la plus faible. */
  function axePrio(l) {
    if (l.length === 0) return "Approfondissement — composition et performance";
    return AXE_PRIO_LABELS[l[0].i] || AXE_PRIO_LABELS[0];
  }

  /** SA recommandée : aucune lacune → C ; lacune profonde (<3) → A ; sinon B. */
  function getSA(l) {
    if (l.length === 0) return SA.C;
    return l[0].v < 3 ? SA.A : SA.B;
  }

  const DECISIONS = {
    A: "Classe débutante — Priorité renforcement de base : gainage du tronc, force MS et MI",
    B: "Classe intermédiaire — Différenciation A/B : consolider la force, développer la souplesse",
    C: "Classe avancée — Approfondissement : souplesse fonctionnelle, équilibre et coordination",
  };

  /** Analyse d'une classe : résultats par élève (classés) + agrégats. */
  function analyser(students) {
    const results = students.map((e) => {
      const moy = (e.vs[0] + e.vs[1] + e.vs[2]) / 3;
      const ls = lacunes(e.vs);
      return {
        prenom: e.prenom,
        vs: e.vs,
        moy: moy,
        profil: profil(moy),
        profilDetail: e.vs.map(profil),
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
      total ? results.reduce((s, r) => s + r.vs[i], 0) / total : 0
    );

    const counts = { A: 0, B: 0, C: 0 };
    results.forEach((r) => counts[r.profil]++);

    const mx = Math.max(counts.A, counts.B, counts.C);
    const dominant = counts.A === mx ? "A" : counts.B === mx ? "B" : "C";

    return {
      results: results,
      moyClasse: moyClasse,
      moyObservables: moyObservables,
      counts: counts,
      total: total,
      dominant: dominant,
      decision: DECISIONS[dominant],
    };
  }

  /** Classe les axes par % d'élèves concernés (sous le seuil B sur l'observable). */
  function rankAxes(results) {
    const total = results.length || 1;
    return AX.map((axe) => ({
      axe: axe,
      pertinence: Math.round(
        (results.filter((r) => r.vs[axe.oi] < SH.B).length / total) * 100
      ),
    })).sort((a, b) => b.pertinence - a.pertinence);
  }

  /** Répartit les séances entre les axes sélectionnés (table DI). */
  function distribute(selectedAxeIds, nSeances) {
    const na = selectedAxeIds.length;
    const dist = (DI[na] && DI[na][nSeances]) || [];
    const axes = selectedAxeIds
      .map((id) => AX.find((a) => a.id === id))
      .filter(Boolean);
    return dist
      .map((seances, i) => ({ axe: axes[i], seances: seances }))
      .filter((d) => d.axe);
  }

  /** Génère le plan de cycle différencié complet (miroir de genPlan). */
  function genPlan(selectedAxeIds, nSeances, analysis) {
    const na = selectedAxeIds.length;
    const dist = (DI[na] && DI[na][nSeances]) || [];
    const axes = selectedAxeIds
      .map((id) => AX.find((a) => a.id === id))
      .filter(Boolean);

    const sequences = [];
    let cursor = 0;

    dist.forEach((ns, si) => {
      const axe = axes[si];
      if (!axe) return;
      const seanceStart = cursor + 1;
      const seanceEnd = cursor + ns;
      const seances = [];

      for (let s = 0; s < ns; s++) {
        const numero = cursor + 1 + s;
        const isLast = si === dist.length - 1 && s === ns - 1;
        const objectif = isLast
          ? "Bilan et évaluation des capacités musculaires (retest terrain)"
          : "Développer : " + axe.titre;
        seances.push({
          numero: numero,
          axeId: axe.id,
          objectif: objectif,
          groupes: axe.csg,
          indicateur: s < ns - 1 ? axe.ind : undefined,
          isLast: isLast,
        });
      }

      sequences.push({ index: si, axe: axe, seanceStart: seanceStart, seanceEnd: seanceEnd, seances: seances });
      cursor += ns;
    });

    const seqStr = dist
      .map((ns, i) => {
        const a = axes[i];
        return a ? "Axe " + a.id + " (" + ns + " séance" + (ns > 1 ? "s" : "") + ")" : "?";
      })
      .join(" — ");

    const counts = analysis.counts;
    const total = analysis.total;
    const dom =
      counts.A >= counts.B && counts.A >= counts.C
        ? "A"
        : counts.B >= counts.C
          ? "B"
          : "C";
    const pct = total ? Math.round((counts[dom] / total) * 100) : 0;
    const reeval = Math.ceil(dist.length / 2);

    const resume =
      seqStr +
      ". Ce cycle de " + nSeances + " séances cible " + na + " axes prioritaires. " +
      "Profil le plus concerné : " + dom + " (" + counts[dom] + " élève" + (counts[dom] > 1 ? "s" : "") + " · " + pct + "%). " +
      "Réévaluer après la séquence " + reeval + " avec une nouvelle collecte terrain.";

    return { sequences: sequences, nSeances: nSeances, nAxes: na, resume: resume };
  }

  /** Cellule CSV brute → score 0–10 (codes métier, A/B/C ou nombre). */
  function codeToScore(raw) {
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

  /** Code métier pour un observable + profil (export CSV). */
  function codeFor(obsIndex, level) {
    return OBS[obsIndex].codes[level];
  }

  // ===========================================================================
  // 3) CSV — copie fidèle de src/lib/csv.ts
  // ===========================================================================

  const NAME_PATTERNS = ["PRENOM", "PRÉNOM", "NOM_ELEVE", "ELEVE", "ÉLÈVE", "STUDENT", "NOM"];
  const OBS_PATTERNS = [
    ["OBS01", "OBS-01", "OBS_1", "OBS1", "FORCE", "FO", "POMPE", "SQUAT", "PLANCHE", "GAINAGE"],
    ["OBS02", "OBS-02", "OBS_2", "OBS2", "SOUPLESSE", "SOUPL", "SO", "ETIRE", "ÉTIRE", "PONT"],
    ["OBS03", "OBS-03", "OBS_3", "OBS3", "EQUILIBRE", "ÉQUIL", "EQUIL", "EQ", "UNIPODAL", "PROPRIO"],
  ];

  function detectSep(line) {
    const cand = [";", "\t", ","].map((s) => [s, line.split(s).length - 1]);
    cand.sort((a, b) => b[1] - a[1]);
    return cand[0][1] > 0 ? cand[0][0] : ",";
  }

  function cells(line, sep) {
    return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, "").trim());
  }

  /** Analyse un CSV en élèves validés. Ne lève jamais d'exception. */
  function parseStudentsCsv(text) {
    const clean = text.replace(/^﻿/, "");
    const lines = clean.split(/\r?\n/);

    let hi = -1;
    for (let i = 0; i < lines.length; i++) {
      const up = lines[i].toUpperCase();
      if (NAME_PATTERNS.some((p) => up.includes(p))) {
        hi = i;
        break;
      }
    }

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

    let nameCol = 0;
    let obsCols = [1, 2, 3];
    if (!headerless) {
      const hdrs = cells(lines[hi], sep).map((h) => h.toUpperCase());
      const findCol = (pats) => {
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

    const students = [];
    let ignored = 0;
    const dataStart = headerless ? hi : hi + 1;

    for (let li = dataStart; li < lines.length; li++) {
      const raw = lines[li].trim();
      if (!raw || raw.toUpperCase().includes("BILAN_CLASSE")) {
        if (raw) ignored++;
        continue;
      }
      const cols = cells(lines[li], sep);
      const prenom = (cols[nameCol] || "").trim();
      if (!prenom) {
        ignored++;
        continue;
      }

      const vs = obsCols.map((ci) => (ci > -1 ? codeToScore(cols[ci] || "") : null));
      const issues = [];
      vs.forEach((v, i) => {
        if (v === null) issues.push("OBS-0" + (i + 1) + " manquant");
        else if (v < 0 || v > 10) {
          issues.push("OBS-0" + (i + 1) + " hors 0–10");
          vs[i] = null;
        }
      });

      students.push({ prenom: prenom, vs: vs, issues: issues, complete: issues.length === 0 });
    }

    return { students: students, ignored: ignored, separator: sep };
  }

  /** Modèle CSV prêt à remplir (BOM + en-tête + quelques lignes d'exemple). */
  function buildTemplateCsv() {
    return (
      "﻿" +
      "Prénom;Force;Souplesse;Équilibre\n" +
      "Sara;9;8;7\n" +
      "Yacine;3;2;4\n" +
      "Imane;6;5;6\n" +
      "Nour;FO~;SO-;EQ+\n"
    );
  }

  // ===========================================================================
  // 4) ÉTAT + PERSISTANCE AUTOMATIQUE (condition 3)
  // ===========================================================================

  const STORAGE_KEY = "adp-rm-session-v1";
  const SCHEMA = "adp-rm/1";

  let idCounter = 0;
  const nextId = () => ++idCounter;

  function emptyRow() {
    return { id: nextId(), prenom: "", vs: ["", "", ""], errs: [false, false, false] };
  }

  function todayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function defaultState() {
    return {
      step: 1,
      classe: "",
      dateStr: todayStr(),
      rows: Array.from({ length: 5 }, emptyRow),
      axsel: [],
      nseances: SEANCES.default,
      analyzed: false,
    };
  }

  let state = defaultState();
  let analysis = null; // dérivé (recalculé via runAnalyse)

  /** Sauvegarde automatique dans localStorage. */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, state: state }));
      markSaved();
    } catch (e) {
      /* localStorage indisponible (mode privé strict) — l'app reste utilisable. */
    }
  }

  /** Recharge l'état depuis localStorage si présent. */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const s = data && data.state ? data.state : null;
      if (!s || !Array.isArray(s.rows)) return false;
      // Réindexe les id pour éviter les collisions.
      idCounter = 0;
      s.rows = s.rows.map((r) => ({
        id: nextId(),
        prenom: typeof r.prenom === "string" ? r.prenom : "",
        vs: Array.isArray(r.vs) ? [r.vs[0] || "", r.vs[1] || "", r.vs[2] || ""] : ["", "", ""],
        errs: [false, false, false],
      }));
      state = Object.assign(defaultState(), s, { rows: s.rows });
      if (!state.dateStr) state.dateStr = todayStr();
      if (state.analyzed) runAnalyse(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ===========================================================================
  // 5) UTILITAIRES UI (échappement, toast, modale de confirmation)
  // ===========================================================================

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let toastTimer = null;
  function toast(msg, kind) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "toast " + (kind || "") + " show";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.className = "toast " + (kind || "");
    }, 2600);
  }

  function markSaved() {
    const el = document.getElementById("savedMark");
    if (el) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      el.textContent = "✓ Enregistré localement · " + hh + ":" + mm;
    }
  }

  /** Modale de confirmation (Promise<boolean>). */
  function confirmModal(title, message, confirmLabel) {
    return new Promise((resolve) => {
      const bg = document.createElement("div");
      bg.className = "modal-bg";
      bg.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true">' +
        "<h3>" + esc(title) + "</h3>" +
        "<p>" + esc(message) + "</p>" +
        '<div class="brow">' +
        '<button type="button" class="btn bo" data-no>Annuler</button>' +
        '<button type="button" class="btn bdanger" data-yes>' + esc(confirmLabel || "Confirmer") + "</button>" +
        "</div></div>";
      document.body.appendChild(bg);
      const close = (val) => {
        document.body.removeChild(bg);
        resolve(val);
      };
      bg.querySelector("[data-no]").addEventListener("click", () => close(false));
      bg.querySelector("[data-yes]").addEventListener("click", () => close(true));
      bg.addEventListener("click", (e) => {
        if (e.target === bg) close(false);
      });
    });
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function fileStamp() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function badge(level) {
    return '<span class="b b' + level.toLowerCase() + '">' + level + "</span>";
  }

  // ===========================================================================
  // 6) ACTIONS MÉTIER (analyse, navigation, axes, séances)
  // ===========================================================================

  function clampScore(raw) {
    if (raw === "") return raw;
    const n = parseFloat(raw);
    if (isNaN(n)) return raw;
    if (n > 10) return "10";
    if (n < 0) return "0";
    return raw;
  }

  /** Analyse la classe à partir des lignes saisies. silent = pas d'alerte. */
  function runAnalyse(silent) {
    const students = [];
    let anyError = false;

    state.rows.forEach((r) => {
      r.errs = [false, false, false];
      const prenom = (r.prenom || "").trim();
      if (!prenom) return;
      const vals = [];
      let ok = true;
      r.vs.forEach((raw, i) => {
        const v = parseFloat(raw);
        if (isNaN(v) || v < 0 || v > 10) {
          r.errs[i] = true;
          ok = false;
          anyError = true;
        } else {
          vals.push(v);
        }
      });
      if (ok && vals.length === 3) {
        students.push({ prenom: prenom, vs: [vals[0], vals[1], vals[2]] });
      }
    });

    if (students.length === 0) {
      analysis = null;
      state.analyzed = false;
      if (!silent) {
        state._s1error = anyError
          ? "Certaines saisies sont invalides (scores 0–10 requis)."
          : "Aucun élève valide. Vérifiez les saisies.";
      }
      return false;
    }
    state._s1error = null;
    analysis = analyser(students);
    state.analyzed = true;
    return true;
  }

  function goStep(n) {
    if (n === 2 && !analysis) {
      toast("Analysez la classe d'abord.", "err");
      return;
    }
    if (n === 3 && state.axsel.length < AXES_RANGE.min) {
      toast("Sélectionnez au moins " + AXES_RANGE.min + " axes.", "err");
      return;
    }
    state.step = n;
    save();
    render();
    window.scrollTo(0, 0);
  }

  function toggleAxe(id) {
    const sel = state.axsel;
    const idx = sel.indexOf(id);
    if (idx > -1) {
      sel.splice(idx, 1);
    } else {
      if (sel.length >= AXES_RANGE.max) {
        toast("Maximum " + AXES_RANGE.max + " axes atteint.", "err");
        return;
      }
      sel.push(id);
    }
    save();
    render();
  }

  // -- Export CSV des résultats (condition 7) — miroir de exportCsv() ---------
  function exportCsv() {
    if (!analysis) {
      toast("Analysez la classe d'abord.", "err");
      return;
    }
    const bom = "﻿";
    const hdr =
      "Prénom;Code Force;Force;Code Souplesse;Souplesse;Code Équilibre;Équilibre;Moyenne;/20;Rang;Profil global;Profil détaillé;Lacune 1;SA recommandée\n";
    const body = analysis.results
      .map((r) =>
        [
          r.prenom,
          codeFor(0, r.profilDetail[0]),
          r.vs[0].toFixed(1),
          codeFor(1, r.profilDetail[1]),
          r.vs[1].toFixed(1),
          codeFor(2, r.profilDetail[2]),
          r.vs[2].toFixed(1),
          r.moy.toFixed(2),
          (r.moy * 2).toFixed(2),
          r.rang,
          r.profil,
          r.profilDetail.join("/"),
          r.lacunes.length > 0
            ? OBS[r.lacunes[0].i].id + " : " + r.lacunes[0].v.toFixed(1) + "/10"
            : "Aucune",
          r.sa.nom + " - " + r.sa.lib,
        ].join(";")
      )
      .join("\n");
    download("ADP-RM_" + fileStamp() + ".csv", bom + hdr + body, "text/csv;charset=utf-8");
  }

  // -- Export / Import de SESSION JSON (condition 6) --------------------------
  function exportSession() {
    const payload = { schema: SCHEMA, exportedAt: new Date().toISOString(), state: state };
    download("session_ADP-RM_" + fileStamp() + ".json", JSON.stringify(payload, null, 2), "application/json");
    toast("Session exportée (JSON).", "ok");
  }

  function importSession(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target.result));
        const s = data && data.state ? data.state : data;
        if (!s || !Array.isArray(s.rows)) throw new Error("format");
        idCounter = 0;
        const rows = s.rows.map((r) => ({
          id: nextId(),
          prenom: typeof r.prenom === "string" ? r.prenom : "",
          vs: Array.isArray(r.vs) ? [r.vs[0] || "", r.vs[1] || "", r.vs[2] || ""] : ["", "", ""],
          errs: [false, false, false],
        }));
        state = Object.assign(defaultState(), s, { rows: rows });
        if (!state.dateStr) state.dateStr = todayStr();
        analysis = null;
        if (state.analyzed) runAnalyse(true);
        save();
        render();
        toast("Session importée.", "ok");
      } catch (err) {
        toast("Fichier de session invalide.", "err");
      }
    };
    reader.onerror = () => toast("Lecture du fichier impossible.", "err");
    reader.readAsText(file, "UTF-8");
  }

  // -- Réinitialisation (condition 5) -----------------------------------------
  async function resetSession() {
    const ok = await confirmModal(
      "Nouvelle session ?",
      "Toutes les données saisies (élèves, scores, axes, cycle) seront effacées définitivement de cet appareil. Pensez à « Exporter la session » au préalable si besoin.",
      "Tout effacer"
    );
    if (!ok) return;
    state = defaultState();
    analysis = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    save();
    render();
    toast("Nouvelle session démarrée.", "ok");
  }

  // -- Données de démonstration (condition 8) ---------------------------------
  const DEMO = [
    { prenom: "Sara", vs: ["9", "8", "7"] },
    { prenom: "Yacine", vs: ["3", "2", "4"] },
    { prenom: "Imane", vs: ["6", "5", "6"] },
    { prenom: "Nizar", vs: ["8", "4", "5"] },
    { prenom: "Salma", vs: ["5", "9", "8"] },
    { prenom: "Adam", vs: ["2", "3", "3"] },
    { prenom: "Lina", vs: ["7", "7", "9"] },
    { prenom: "Mehdi", vs: ["4", "6", "5"] },
    { prenom: "Aya", vs: ["9", "9", "8"] },
    { prenom: "Omar", vs: ["3", "4", "2"] },
  ];

  async function loadDemo() {
    const hasData = state.rows.some((r) => r.prenom.trim() || r.vs.some((v) => v.trim()));
    if (hasData) {
      const ok = await confirmModal(
        "Charger les données d'exemple ?",
        "Cela remplacera les lignes actuelles par un jeu de 10 élèves de démonstration.",
        "Charger l'exemple"
      );
      if (!ok) return;
    }
    idCounter = 0;
    state.rows = DEMO.map((d) => ({ id: nextId(), prenom: d.prenom, vs: [d.vs[0], d.vs[1], d.vs[2]], errs: [false, false, false] }));
    state.classe = state.classe || "3ème B (démo)";
    state.step = 1;
    state.axsel = [];
    runAnalyse(true);
    save();
    render();
    toast("Données d'exemple chargées — cliquez « Analyser la classe ».", "ok");
  }

  // -- Import CSV (état transitoire de prévisualisation) ----------------------
  let csvPreview = null; // { result, fileName }

  function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseStudentsCsv(String(e.target.result));
      csvPreview = { result: result, fileName: file.name };
      render();
    };
    reader.onerror = () => toast("Lecture du fichier impossible.", "err");
    reader.readAsText(file, "UTF-8");
  }

  function applyCsvPreview() {
    if (!csvPreview || !csvPreview.result) return;
    const students = csvPreview.result.students.map((s) => ({
      prenom: s.prenom,
      vs: s.vs.map((v) => (v === null ? "" : String(v))),
    }));
    // Conserve les lignes déjà remplies, ajoute les importées.
    const kept = state.rows.filter((r) => r.prenom.trim() || r.vs.some((v) => v.trim()));
    const imported = students.map((s) => ({ id: nextId(), prenom: s.prenom, vs: s.vs, errs: [false, false, false] }));
    state.rows = kept.concat(imported);
    csvPreview = null;
    save();
    render();
    toast(students.length + " élève" + (students.length > 1 ? "s" : "") + " importé" + (students.length > 1 ? "s" : ""), "ok");
  }

  // ===========================================================================
  // 7) RENDU (interface) — reproduit le wizard 4 étapes du projet Next.js
  // ===========================================================================

  const STEPS = [
    { n: 1, label: "Diagnostic" },
    { n: 2, label: "Axes" },
    { n: 3, label: "Paramétrage" },
    { n: 4, label: "Planification" },
  ];

  function headerHtml() {
    return (
      '<header class="appbar">' +
      '<div class="appbar-row">' +
      '<div class="appbar-mark">EPS</div>' +
      "<div>" +
      '<h1 class="appbar-title">Aide à la décision pédagogique</h1>' +
      '<p class="appbar-sub">RM &amp; Souplesse · ADP 2026 · CRMEF Inezgane</p>' +
      "</div></div></header>"
    );
  }

  function sessionBarHtml() {
    return (
      '<div class="toolbar noPrint">' +
      '<button type="button" class="tool" data-act="demo">✨ Exemple</button>' +
      '<button type="button" class="tool" data-act="export-session">📤 Exporter</button>' +
      '<label class="tool" tabindex="0">📥 Importer' +
      '<input type="file" accept=".json,application/json" id="importSessionInput" hidden /></label>' +
      '<button type="button" class="tool danger" data-act="reset">🗑️ Réinitialiser</button>' +
      '<span class="savemark" id="savedMark"></span>' +
      "</div>"
    );
  }

  function stepperHtml() {
    let h = '<nav class="steps noPrint">';
    STEPS.forEach((s) => {
      const stateCls = s.n === state.step ? "active" : s.n < state.step ? "done" : "";
      const num = s.n < state.step ? "✓" : s.n;
      h +=
        '<button type="button" class="step ' + stateCls + '" data-goto="' + s.n + '">' +
        '<span class="step-num">' + num + "</span>" +
        '<span class="step-label">' + s.label + "</span></button>";
    });
    return h + "</nav>";
  }

  // -- Étape 1 ----------------------------------------------------------------
  function step1Html() {
    const obsHeads = ["Force", "Souplesse", "Équilibre"];

    let rowsHtml = "";
    state.rows.forEach((r, idx) => {
      rowsHtml +=
        '<div class="srow">' +
        '<div class="srow-top">' +
        '<span class="srow-n">' + (idx + 1) + "</span>" +
        '<input type="text" class="inp-name" placeholder="Prénom de l\'élève" data-row="' + r.id + '" data-field="prenom" value="' + esc(r.prenom) + '" />' +
        '<button type="button" class="iconbtn" data-removerow="' + r.id + '" aria-label="Supprimer">✕</button>' +
        "</div>" +
        '<div class="srow-scores">' +
        [0, 1, 2]
          .map(
            (i) =>
              '<label class="fld"><span class="fld-l">' + obsHeads[i] + "</span>" +
              '<input type="number" min="0" max="10" step="0.5" inputmode="decimal" placeholder="0–10" class="fld-in ' +
              (r.errs[i] ? "err" : "") +
              '" data-row="' + r.id + '" data-field="vs" data-i="' + i + '" value="' + esc(r.vs[i]) + '" /></label>'
          )
          .join("") +
        "</div></div>";
    });

    let h =
      '<section class="card noPrint">' +
      '<h2 class="card-h">📝 Diagnostic — saisie des données</h2>' +
      '<div class="metarow">' +
      '<label class="fld fld-grow"><span class="fld-l">Classe / Groupe</span>' +
      '<input type="text" id="classeInput" value="' + esc(state.classe) + '" placeholder="Ex : 3ème B" /></label>' +
      '<label class="fld"><span class="fld-l">Date</span>' +
      '<input type="date" id="dateInput" value="' + esc(state.dateStr) + '" /></label></div>' +
      '<p class="hint hint-blk">Scores /10 — Force (planche·pompes·squats) · Souplesse (doigts-sol·pont) · Équilibre (unipodal).</p>' +
      '<div class="roster">' + rowsHtml + "</div>" +
      '<div class="addbar">' +
      '<button type="button" class="btn bo bsm" data-addrows="1">+ Élève</button>' +
      '<button type="button" class="btn bo bsm" data-addrows="5">+ 5</button>' +
      '<button type="button" class="btn bo bsm" data-addrows="10">+ 10</button>' +
      "</div>";

    // Import CSV
    h += '<div class="sep">' + csvImportHtml() + "</div>";

    if (state._s1error) h += '<div class="alert err">' + esc(state._s1error) + "</div>";

    h +=
      '<div class="actions">' +
      '<button type="button" class="btn bp bblock" data-act="analyse">📊 Analyser la classe</button>' +
      '<div class="actions-sub">' +
      '<button type="button" class="btn bo" data-act="export-csv">📄 Export CSV</button>' +
      '<button type="button" class="btn bo" data-act="print">🖨️ Imprimer</button>' +
      "</div></div></section>";

    if (analysis) h += resultsHtml();
    return h;
  }

  function csvImportHtml() {
    let h = '<div class="csv">';
    h +=
      '<div class="csv-h"><h3>📄 Importer une liste (CSV)</h3>' +
      '<button type="button" class="btn bo bsm" data-act="csv-template">📄 Modèle</button></div>';

    if (!csvPreview) {
      h +=
        '<div class="dz" id="dropzone" role="button" tabindex="0">' +
        '<div class="dz-i">📂</div>' +
        "<p class=\"dz-t\">Toucher pour choisir un fichier, ou glisser-déposer</p>" +
        '<p class="hint">Colonnes : <strong>Prénom · Force · Souplesse · Équilibre</strong> — scores 0–10 ou codes (FO~ · SO− · EQ+)</p>' +
        '<input type="file" accept=".csv,.txt" id="csvInput" hidden /></div>';
    } else if (csvPreview.result.error) {
      h +=
        '<div class="alert err">' + esc(csvPreview.result.error) + "</div>" +
        '<button type="button" class="btn bo bsm" data-act="csv-reset">Réessayer</button>';
    } else {
      const res = csvPreview.result;
      const complete = res.students.filter((s) => s.complete).length;
      const partial = res.students.length - complete;
      h += '<div class="chips">';
      h += '<span class="chip">📄 ' + esc(csvPreview.fileName) + "</span>";
      h += '<span class="chip">' + res.students.length + " élève(s)</span>";
      h += '<span class="chip green">' + complete + " complet(s)</span>";
      if (partial > 0) h += '<span class="chip amber">' + partial + " partiel(s)</span>";
      if (res.ignored > 0) h += '<span class="chip muted">' + res.ignored + " ignorée(s)</span>";
      h += "</div>";

      if (res.students.length === 0) {
        h += '<div class="alert warn">Aucun élève valide trouvé dans le fichier.</div>';
      } else {
        h += '<ul class="csvprev">';
        res.students.forEach((s) => {
          h +=
            '<li class="' + (s.complete ? "ok" : "warn") + '">' +
            '<span class="csvprev-n">' + esc(s.prenom) + "</span>" +
            '<span class="csvprev-v">' + s.vs.map((v) => (v === null ? "—" : v)).join(" · ") + "</span>" +
            '<span class="csvprev-s">' + (s.complete ? "✅" : "⚠️") + "</span></li>";
        });
        h += "</ul>";
      }

      h +=
        '<div class="actions-sub" style="margin-top:10px">' +
        '<button type="button" class="btn bg bsm" data-act="csv-apply"' + (res.students.length === 0 ? " disabled" : "") + ">📥 Importer " + (res.students.length || "") + " élève" + (res.students.length > 1 ? "s" : "") + "</button>" +
        '<button type="button" class="btn bo bsm" data-act="csv-reset">Annuler</button></div>' +
        '<p class="hint">Les élèves sont ajoutés à la liste. Les scores manquants se complètent à la main.</p>';
    }
    return h + "</div>";
  }

  function resultsHtml() {
    const a = analysis;
    const obsHeads = ["Force", "Souplesse", "Équilibre"];
    let h = '<section class="card"><h2 class="card-h">📊 Résultats individuels</h2><div class="reslist">';

    a.results.forEach((r) => {
      const lac =
        r.lacunes.length === 0
          ? "Aucune lacune"
          : r.lacunes
              .map((l) => OBS[l.i].id + " (" + l.v.toFixed(1) + "/10)")
              .join(" · ");
      const scores = [0, 1, 2]
        .map(
          (i) =>
            '<div class="score"><span class="score-l">' + obsHeads[i] + "</span>" +
            '<span class="score-v">' + r.vs[i].toFixed(1) + "</span>" + badge(r.profilDetail[i]) + "</div>"
        )
        .join("");
      h +=
        '<article class="rescard ' + r.profil + '">' +
        '<div class="rescard-h">' +
        '<span class="rank">#' + r.rang + "</span>" +
        '<span class="rname">' + esc(r.prenom) + "</span>" +
        badge(r.profil) +
        "</div>" +
        '<div class="moyline"><strong>' + r.moy.toFixed(1) + "</strong>/10 · " + (r.moy * 2).toFixed(1) + "/20</div>" +
        '<div class="scores">' + scores + "</div>" +
        '<dl class="metalist">' +
        '<div class="meta"><dt>Lacune(s)</dt><dd>' + lac + "</dd></div>" +
        '<div class="meta"><dt>Axe prioritaire</dt><dd>' + esc(r.axe) + "</dd></div>" +
        '<div class="meta"><dt>SA recommandée</dt><dd><strong>' + r.sa.nom + "</strong> · " + esc(r.sa.lib) + "</dd></div>" +
        "</dl></article>";
    });
    h += "</div>" +
      '<div class="actions-sub noPrint">' +
      '<button type="button" class="btn bo bsm" data-act="export-csv">📄 Export CSV</button>' +
      '<button type="button" class="btn bo bsm" data-act="print">🖨️ Imprimer</button></div></section>';

    h += bilanHtml();

    h +=
      '<div class="actions noPrint">' +
      '<button type="button" class="btn bg bblock" data-goto="2">Étape 2 — Axes prioritaires →</button></div>';
    return h;
  }

  function bilanHtml() {
    const a = analysis;
    const pct = (n) => (a.total ? Math.round((n / a.total) * 100) : 0);
    const obsMeta = (m) => {
      if (m >= SH.C) return { bc: "#27AE60", st: "Bon niveau", stb: "var(--gb)", stc: "var(--gt)" };
      if (m >= SH.B) return { bc: "#E67E22", st: "En cours", stb: "var(--ob)", stc: "var(--ot)" };
      return { bc: "#C0392B", st: "Lacune collective", stb: "var(--rb)", stc: "var(--rt)" };
    };
    const grbBg = { A: "var(--rb)", B: "var(--ob)", C: "var(--gb)" };

    let h = '<section class="card"><h2 class="card-h">🏟 Bilan de classe</h2><div class="stats">';
    h += '<div class="stat A"><div class="stat-v">' + a.counts.A + '</div><div class="stat-l">Débutants A · ' + pct(a.counts.A) + "%</div></div>";
    h += '<div class="stat B"><div class="stat-v">' + a.counts.B + '</div><div class="stat-l">Interm. B · ' + pct(a.counts.B) + "%</div></div>";
    h += '<div class="stat C"><div class="stat-v">' + a.counts.C + '</div><div class="stat-l">Avancés C · ' + pct(a.counts.C) + "%</div></div>";
    h += '<div class="stat"><div class="stat-v">' + a.moyClasse.toFixed(1) + '</div><div class="stat-l">Moy /10</div></div>';
    h += '<div class="stat"><div class="stat-v">' + (a.moyClasse * 2).toFixed(1) + '</div><div class="stat-l">Moy /20</div></div>';
    h += '<div class="stat"><div class="stat-v">' + a.total + '</div><div class="stat-l">Élèves</div></div>';
    h += "</div>";

    h += '<h3 class="sub-h">Analyse par famille musculaire</h3>';
    a.moyObservables.forEach((m, i) => {
      const meta = obsMeta(m);
      const pc = Math.round((m / 10) * 100);
      h +=
        '<div class="obsbar"><div class="obsbar-top"><span class="obsbar-l">' + esc(OBS[i].nom) + "</span>" +
        '<span class="obsbar-st" style="background:' + meta.stb + ";color:" + meta.stc + '">' + meta.st + " · " + m.toFixed(1) + "/10</span></div>" +
        '<div class="obsbar-track"><div class="obsbar-fill" style="width:' + pc + "%;background:" + meta.bc + '"></div></div></div>';
    });

    h += '<h3 class="sub-h">Groupes de besoin</h3>';
    ["A", "B", "C"].forEach((p) => {
      if (a.counts[p] === 0) return;
      h +=
        '<div class="need" style="background:' + grbBg[p] + '">' + badge(p) +
        '<span class="need-n">' + a.counts[p] + " élève" + (a.counts[p] > 1 ? "s" : "") + " · " + pct(a.counts[p]) + "%</span>" +
        '<span class="need-sa">' + SA[p].nom + " · " + esc(SA[p].lib) + "</span></div>";
    });

    h +=
      '<div class="decision"><h3>Décision dominante automatique</h3><p>' + esc(a.decision) + "</p>" +
      '<p class="decision-x">Décision finale : l\'enseignant</p></div></section>';
    return h;
  }

  // -- Étape 2 ----------------------------------------------------------------
  function step2Html() {
    const ranked = analysis ? rankAxes(analysis.results) : [];
    const n = state.axsel.length;
    const msg =
      n + " axe" + (n > 1 ? "s" : "") + " sélectionné" + (n > 1 ? "s" : "") +
      (n < AXES_RANGE.min
        ? " — minimum " + AXES_RANGE.min + " requis"
        : n === AXES_RANGE.max
          ? " — maximum atteint"
          : " — vous pouvez en ajouter un 4e");

    let h =
      '<section class="card"><h2 class="card-h">🎯 Axes prioritaires</h2>' +
      '<div class="alert info">Sélectionnez entre <strong>3 et 4 axes</strong>, classés par pertinence selon les données réelles.</div>' +
      '<div class="axmsg">' + msg + "</div>";

    ranked.forEach((item) => {
      const axe = item.axe;
      const sel = state.axsel.indexOf(axe.id) > -1;
      const obs = OBS[axe.oi];
      const moy = analysis ? analysis.moyObservables[axe.oi] : 0;
      h +=
        '<div class="axis' + (sel ? " sel" : "") + '" data-axe="' + axe.id + '">' +
        '<input type="checkbox" class="axis-check" ' + (sel ? "checked" : "") + ' data-axe-check="' + axe.id + '" />' +
        '<div class="axis-body">' +
        '<div class="axis-title">Axe ' + axe.id + " — " + esc(axe.titre) + "</div>" +
        '<div class="axis-desc">' + esc(axe.desc) + "</div>" +
        '<div class="axis-bar"><i style="width:' + Math.min(item.pertinence, 100) + '%"></i></div>' +
        '<div class="axis-meta">' +
        "<span><strong>" + item.pertinence + "%</strong> concernés</span>" +
        "<span>" + esc(obs.nom) + " · " + moy.toFixed(1) + "/10</span>" +
        "<span>" + axe.csg.A.sa + "</span>" +
        "</div></div></div>";
    });

    h +=
      '<div class="actions">' +
      '<button type="button" class="btn bg bblock" data-goto="3"' + (n < AXES_RANGE.min ? " disabled" : "") + ">Paramétrer le cycle →</button>" +
      '<button type="button" class="btn bo bblock" data-goto="1">← Retour au diagnostic</button></div></section>';
    return h;
  }

  // -- Étape 3 ----------------------------------------------------------------
  function step3Html() {
    let h =
      '<section class="card"><h2 class="card-h">⚙️ Paramétrage du cycle</h2>' +
      '<h3 class="sub-h">Nombre de séances</h3>' +
      '<div class="slider">' +
      '<input type="range" id="seancesRange" min="' + SEANCES.min + '" max="' + SEANCES.max + '" value="' + state.nseances + '" />' +
      '<div class="slider-val" id="seancesVal">' + state.nseances + "</div></div>" +
      '<p class="hint" id="seancesInfo"></p>' +
      '<div class="distlist" id="distList"></div>' +
      '<div class="actions">' +
      '<button type="button" class="btn bg bblock" data-goto="4">Générer la planification →</button>' +
      '<button type="button" class="btn bo bblock" data-goto="2">← Retour aux axes</button></div></section>';
    return h;
  }

  function distListHtml() {
    const dist = distribute(state.axsel, state.nseances);
    let h = "";
    dist.forEach((d, i) => {
      h +=
        '<div class="distseq"><div class="distseq-h">Séquence ' + (i + 1) + " · " + d.seances + " séance" + (d.seances > 1 ? "s" : "") + "</div>" +
        '<div class="distseq-b">Axe ' + d.axe.id + " — " + esc(d.axe.titre) + "</div></div>";
    });
    return h;
  }

  function refreshStep3() {
    const valEl = document.getElementById("seancesVal");
    const infoEl = document.getElementById("seancesInfo");
    const listEl = document.getElementById("distList");
    const dist = distribute(state.axsel, state.nseances);
    if (valEl) valEl.textContent = state.nseances;
    if (infoEl) infoEl.textContent = "séances — " + dist.length + " séquences";
    if (listEl) listEl.innerHTML = distListHtml();
  }

  // -- Étape 4 ----------------------------------------------------------------
  const GROUP_LABELS = { A: "Groupe A · Débutants", B: "Groupe B · Intermédiaires", C: "Groupe C · Avancés" };

  function step4Html() {
    const plan = analysis && state.axsel.length ? genPlan(state.axsel, state.nseances, analysis) : null;
    let h = '<section class="card"><h2 class="card-h">📅 Planification du cycle</h2>';

    if (!plan) {
      h += '<div class="alert err">Aucune planification — revenez à l\'étape 3.</div>';
    } else {
      plan.sequences.forEach((seq) => {
        h +=
          '<section class="seq"><div class="seq-h">' +
          "<h3>Séquence " + (seq.index + 1) + " — " + esc(seq.axe.titre) + "</h3>" +
          '<span class="seq-badge">Séances ' + seq.seanceStart + " à " + seq.seanceEnd + "</span></div>";

        seq.seances.forEach((s) => {
          h +=
            '<article class="seance">' +
            '<div class="seance-h"><span class="snum">Séance ' + s.numero + "</span>" +
            '<span class="saxe">Axe ' + seq.axe.id + "</span></div>" +
            '<div class="sobj">' + esc(s.objectif) + "</div>" +
            '<div class="groups">' +
            ["A", "B", "C"]
              .map(
                (g) =>
                  '<div class="grp ' + g + '">' +
                  '<div class="grp-h">' + GROUP_LABELS[g] + " · " + s.groupes[g].sa + "</div>" +
                  '<div class="grp-b"><div class="grp-c">' + esc(s.groupes[g].c) + "</div>" +
                  '<div class="grp-cr">✓ ' + esc(s.groupes[g].cr) + "</div></div></div>"
              )
              .join("") +
            "</div>";
          if (s.indicateur) {
            h +=
              '<div class="indic">📋 À observer avant la séance suivante — <em>' + esc(s.indicateur) + "</em> " +
              '<span class="indic-x">(indicatif — décision de progression : vous)</span></div>';
          }
          h += "</article>";
        });

        h += exercisePanelHtml(seq.axe) + "</section>";
      });

      h +=
        '<div class="summary"><h3>Résumé du cycle</h3><p>' + esc(plan.resume) + "</p>" +
        '<p class="summary-x">Décision finale de progression : l\'enseignant.</p></div>';
    }

    h +=
      '<div class="actions noPrint">' +
      '<button type="button" class="btn bg bblock" data-act="print">🖨️ Imprimer / PDF</button>' +
      '<div class="actions-sub">' +
      '<button type="button" class="btn bo" data-act="export-csv">📄 Export CSV</button>' +
      '<button type="button" class="btn bo" data-goto="3">← Retour</button>' +
      "</div></div></section>";
    return h;
  }

  function exercisePanelHtml(axe) {
    return (
      '<div class="ex">' +
      '<div class="ex-col ex-boys"><h4>🧒 Exercices Garçons</h4><ul>' +
      axe.exG.map((ex) => "<li>" + esc(ex) + "</li>").join("") +
      "</ul></div>" +
      '<div class="ex-col ex-girls"><h4>👧 Exercices Filles</h4><ul>' +
      axe.exF.map((ex) => "<li>" + esc(ex) + "</li>").join("") +
      "</ul></div>" +
      '<div class="ex-prog"><strong>Programme :</strong> ' + esc(axe.prog) + "</div></div>"
    );
  }

  // -- Rendu global -----------------------------------------------------------
  function render() {
    let stepHtml = "";
    if (state.step === 1) stepHtml = step1Html();
    else if (state.step === 2) stepHtml = step2Html();
    else if (state.step === 3) stepHtml = step3Html();
    else if (state.step === 4) stepHtml = step4Html();

    const app = document.getElementById("app");
    app.innerHTML =
      headerHtml() + sessionBarHtml() + stepperHtml() + '<main class="wrap">' + stepHtml + "</main>";

    attachEvents();
    if (state.step === 3) refreshStep3();
    markSaved();
  }

  // ===========================================================================
  // 8) ÉVÉNEMENTS
  // ===========================================================================

  function attachEvents() {
    const app = document.getElementById("app");

    // Boutons d'action (délégation par data-act).
    app.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.getAttribute("data-act");
        if (act === "analyse") {
          runAnalyse(false);
          save();
          render();
        } else if (act === "export-csv") exportCsv();
        else if (act === "print") window.print();
        else if (act === "export-session") exportSession();
        else if (act === "reset") resetSession();
        else if (act === "demo") loadDemo();
        else if (act === "csv-template")
          download("modele_eleves_ADP-RM.csv", buildTemplateCsv(), "text/csv;charset=utf-8");
        else if (act === "csv-apply") applyCsvPreview();
        else if (act === "csv-reset") {
          csvPreview = null;
          render();
        }
      });
    });

    // Navigation par étape.
    app.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => goStep(parseInt(btn.getAttribute("data-goto"), 10)));
    });

    // Import session.
    const imp = document.getElementById("importSessionInput");
    if (imp) imp.addEventListener("change", (e) => { if (e.target.files[0]) importSession(e.target.files[0]); });

    if (state.step === 1) attachStep1Events();
    if (state.step === 2) attachStep2Events();
    if (state.step === 3) attachStep3Events();
  }

  function attachStep1Events() {
    const app = document.getElementById("app");

    const classeInput = document.getElementById("classeInput");
    if (classeInput)
      classeInput.addEventListener("input", (e) => { state.classe = e.target.value; save(); });
    const dateInput = document.getElementById("dateInput");
    if (dateInput)
      dateInput.addEventListener("input", (e) => { state.dateStr = e.target.value; save(); });

    // Saisie prénom / scores : mise à jour SANS re-rendu (focus conservé).
    app.querySelectorAll("[data-row]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const id = parseInt(input.getAttribute("data-row"), 10);
        const row = state.rows.find((r) => r.id === id);
        if (!row) return;
        const field = input.getAttribute("data-field");
        if (field === "prenom") {
          row.prenom = e.target.value;
        } else {
          const i = parseInt(input.getAttribute("data-i"), 10);
          const clamped = clampScore(e.target.value);
          if (clamped !== e.target.value) e.target.value = clamped;
          row.vs[i] = clamped;
          row.errs[i] = false;
          input.classList.remove("err");
        }
        save();
      });
    });

    app.querySelectorAll("[data-addrows]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const n = parseInt(btn.getAttribute("data-addrows"), 10);
        for (let k = 0; k < n; k++) state.rows.push(emptyRow());
        save();
        render();
      });
    });

    app.querySelectorAll("[data-removerow]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-removerow"), 10);
        state.rows = state.rows.filter((r) => r.id !== id);
        if (state.rows.length === 0) state.rows.push(emptyRow());
        save();
        render();
      });
    });

    // CSV : zone de dépôt + sélecteur de fichier.
    const dz = document.getElementById("dropzone");
    const csvInput = document.getElementById("csvInput");
    if (dz && csvInput) {
      dz.addEventListener("click", () => csvInput.click());
      dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") csvInput.click(); });
      dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dgo"); });
      dz.addEventListener("dragleave", () => dz.classList.remove("dgo"));
      dz.addEventListener("drop", (e) => {
        e.preventDefault();
        dz.classList.remove("dgo");
        if (e.dataTransfer.files[0]) handleCsvFile(e.dataTransfer.files[0]);
      });
      csvInput.addEventListener("change", (e) => { if (e.target.files[0]) handleCsvFile(e.target.files[0]); });
    }
  }

  function attachStep2Events() {
    const app = document.getElementById("app");
    app.querySelectorAll("[data-axe]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target && e.target.getAttribute && e.target.getAttribute("data-axe-check") !== null) return;
        toggleAxe(parseInt(card.getAttribute("data-axe"), 10));
      });
    });
    app.querySelectorAll("[data-axe-check]").forEach((cb) => {
      cb.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleAxe(parseInt(cb.getAttribute("data-axe-check"), 10));
      });
    });
  }

  function attachStep3Events() {
    const range = document.getElementById("seancesRange");
    if (range)
      range.addEventListener("input", (e) => {
        state.nseances = parseInt(e.target.value, 10);
        save();
        refreshStep3(); // mise à jour ciblée (ne ré-affiche pas le curseur).
      });
  }

  // ===========================================================================
  // 9) DÉMARRAGE
  // ===========================================================================

  function initPrivacyBanner() {
    const banner = document.getElementById("privacy");
    const closeBtn = document.getElementById("privacyClose");
    try {
      if (localStorage.getItem("adp-rm-privacy-ack") === "1" && banner) banner.style.display = "none";
    } catch (e) {}
    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        if (banner) banner.style.display = "none";
        try { localStorage.setItem("adp-rm-privacy-ack", "1"); } catch (e) {}
      });
  }

  function registerServiceWorker() {
    // Service worker → fonctionnement hors-ligne même après rechargement.
    // (Nécessite HTTPS ou localhost ; GitHub Pages est en HTTPS.)
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
  }

  function start() {
    initPrivacyBanner();
    load();
    render();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
