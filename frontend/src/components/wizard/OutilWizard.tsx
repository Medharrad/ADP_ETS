"use client";

// =============================================================================
// OutilWizard — the 4-step ADP-GYM decision wizard, ported from
// outil_v0_GYM-ART_DI-GYM.html into React. Client-only for now (Milestone 2);
// persistence is wired in Milestone 4. All pedagogical logic comes from
// lib/calc.ts + lib/referentiel.ts.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import styles from "./wizard.module.css";
import { AX, AXES_RANGE, OBS, SA, SEANCES, SH, type Axe, type Niveau } from "@/lib/referentiel";
import {
  analyser,
  codeFor,
  distribute,
  genPlan,
  rankAxes,
  type ClassAnalysis,
  type CyclePlan,
  type StudentInput,
} from "@/lib/calc";
import { aiEnrich, aiJustify, aiSummary } from "@/lib/api";
import { CsvImport } from "./CsvImport";

// -- helpers ------------------------------------------------------------------

/** Join CSS-module class tokens (space-separated, ignores unknown tokens). */
function cx(...tokens: Array<string | false | undefined>): string {
  return tokens
    .filter(Boolean)
    .flatMap((t) => (t as string).split(/\s+/))
    .map((t) => styles[t] ?? "")
    .filter(Boolean)
    .join(" ");
}

interface Row {
  id: number;
  prenom: string;
  vs: [string, string, string];
  errs: [boolean, boolean, boolean];
}

const STEPS = [
  { n: 1, label: "Diagnostic" },
  { n: 2, label: "Axes" },
  { n: 3, label: "Paramétrage" },
  { n: 4, label: "Planification" },
] as const;

function emptyRow(id: number): Row {
  return { id, prenom: "", vs: ["", "", ""], errs: [false, false, false] };
}

/**
 * Clamp a typed score into the valid 0–10 range as the teacher types. Empty and
 * partial entries (e.g. "" or "9.") pass through untouched so decimals can still
 * be keyed in; only a parseable number outside the range is corrected.
 */
function clampScore(raw: string): string {
  if (raw === "") return raw;
  const n = parseFloat(raw);
  if (isNaN(n)) return raw;
  if (n > 10) return "10";
  if (n < 0) return "0";
  return raw;
}

const badge = (level: Niveau) => (
  <span className={cx("b" + level.toLowerCase())}>{level}</span>
);

/** On-demand AI helper: a button that runs `run()` and shows the returned text. */
function AiPanel({ label, run }: { label: string; run: () => Promise<string> }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  async function go() {
    setLoading(true);
    try {
      setText(await run());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la génération IA");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={cx("axmsg")} style={{ marginTop: 8 }}>
      <button type="button" className={cx("btn bo bsm")} onClick={go} disabled={loading}>
        {loading ? "✨ Génération…" : label}
      </button>
      {text && (
        <div
          style={{
            whiteSpace: "pre-wrap",
            marginTop: 7,
            fontSize: ".78rem",
            lineHeight: 1.55,
            color: "var(--ink)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// =============================================================================

export interface OutilWizardProps {
  /** Prefill the roster with these names (re-evaluation reuses the class roster). */
  initialRoster?: { prenom: string }[];
  /** Class metadata shown in the header. */
  classMeta?: { nom: string; niveau: string | null };
  /** When provided, a "save diagnostic" action appears after analysis. */
  onSaveDiagnostic?: (students: StudentInput[]) => Promise<void>;
  /** When provided, a "save cycle" action appears on the planification step. */
  onSaveCycle?: (data: {
    axes: number[];
    nseances: number;
    plan: CyclePlan;
  }) => Promise<void>;
  /** Enables the optional AI-assist buttons (requires auth + a saved API key). */
  enableAi?: boolean;
}

export function OutilWizard({
  initialRoster,
  classMeta,
  onSaveDiagnostic,
  onSaveCycle,
  enableAi = false,
}: OutilWizardProps = {}) {
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const [step, setStep] = useState(1);
  const [classe, setClasse] = useState(classMeta?.nom ?? "");
  const [dateStr, setDateStr] = useState("");
  const [rows, setRows] = useState<Row[]>(() => {
    const seed = initialRoster?.length
      ? initialRoster.map((s) => ({ ...emptyRow(0), prenom: s.prenom }))
      : Array.from({ length: 5 }, () => emptyRow(0));
    return seed.map((r) => ({ ...r, id: ++idRef.current }));
  });

  const [savingDiag, setSavingDiag] = useState(false);
  const [diagSaved, setDiagSaved] = useState(false);
  const [savingCycle, setSavingCycle] = useState(false);
  const [cycleSaved, setCycleSaved] = useState(false);
  const [analysis, setAnalysis] = useState<ClassAnalysis | null>(null);
  const [s1error, setS1error] = useState<string | null>(null);

  const [axsel, setAxsel] = useState<number[]>([]);
  const [nseances, setNseances] = useState<number>(SEANCES.default);

  // Set today's date on the client to avoid SSR/CSR hydration mismatch.
  useEffect(() => {
    setDateStr(new Date().toISOString().split("T")[0]);
  }, []);

  // -- row editing ------------------------------------------------------------
  const addRows = (n: number) =>
    setRows((rs) => [...rs, ...Array.from({ length: n }, () => emptyRow(nextId()))]);
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const setPrenom = (id: number, v: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, prenom: v } : r)));
  const setScore = (id: number, i: number, v: string) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const vs = [...r.vs] as [string, string, string];
        vs[i] = clampScore(v);
        const errs = [...r.errs] as [boolean, boolean, boolean];
        errs[i] = false;
        return { ...r, vs, errs };
      }),
    );

  // -- analyse ----------------------------------------------------------------
  function runAnalyse() {
    const students: StudentInput[] = [];
    const nextRows = rows.map((r) => ({ ...r, errs: [false, false, false] as [boolean, boolean, boolean] }));
    let anyError = false;

    for (const r of nextRows) {
      const prenom = r.prenom.trim();
      if (!prenom) continue;
      const vals: number[] = [];
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
        students.push({ prenom, vs: [vals[0], vals[1], vals[2]] });
      }
    }

    setRows(nextRows);

    if (students.length === 0) {
      setAnalysis(null);
      setS1error(
        anyError
          ? "Certaines saisies sont invalides (scores 0–10 requis)."
          : "Aucun élève valide. Vérifiez les saisies.",
      );
      return;
    }
    setS1error(null);
    setAnalysis(analyser(students));
  }

  // -- navigation -------------------------------------------------------------
  function goStep(n: number) {
    if (n === 2 && !analysis) {
      window.alert("Analysez la classe d'abord.");
      return;
    }
    if (n === 3 && axsel.length < AXES_RANGE.min) {
      window.alert(`Sélectionnez au moins ${AXES_RANGE.min} axes.`);
      return;
    }
    setStep(n);
    window.scrollTo(0, 0);
  }

  // -- axes (step 2) ----------------------------------------------------------
  const rankedAxes = useMemo(
    () => (analysis ? rankAxes(analysis.results) : []),
    [analysis],
  );
  function toggleAxe(id: number) {
    setAxsel((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id);
      if (sel.length >= AXES_RANGE.max) {
        window.alert(`Maximum ${AXES_RANGE.max} axes atteint.`);
        return sel;
      }
      return [...sel, id];
    });
  }

  // -- plan (steps 3 & 4) -----------------------------------------------------
  const distribution = useMemo(
    () => distribute(axsel, nseances),
    [axsel, nseances],
  );
  const plan: CyclePlan | null = useMemo(
    () => (analysis && axsel.length ? genPlan(axsel, nseances, analysis) : null),
    [analysis, axsel, nseances],
  );

  // Re-running analysis / changing the plan invalidates a previous save.
  useEffect(() => setDiagSaved(false), [analysis]);
  useEffect(() => setCycleSaved(false), [plan]);

  // -- AI run closures (only when enabled + data present) ---------------------
  const summaryRun =
    enableAi && analysis
      ? () =>
          aiSummary({
            classe,
            niveau: classMeta?.niveau ?? null,
            total: analysis.total,
            counts: analysis.counts,
            moyClasse: analysis.moyClasse,
            moyObservables: analysis.moyObservables,
            decision: analysis.decision,
          }).then((r) => r.text)
      : undefined;

  const justifyRun =
    enableAi && analysis && axsel.length
      ? () =>
          aiJustify({
            axes: axsel.map((id) => {
              const a = AX.find((x) => x.id === id)!;
              const sc = rankedAxes.find((s) => s.axe.id === id);
              return { id, titre: a.titre, pertinence: sc?.pertinence ?? 0 };
            }),
            counts: analysis.counts,
            total: analysis.total,
          }).then((r) => r.text)
      : undefined;

  async function saveDiagnostic() {
    if (!analysis || !onSaveDiagnostic) return;
    setSavingDiag(true);
    try {
      await onSaveDiagnostic(
        analysis.results.map((r) => ({ prenom: r.prenom, vs: r.vs })),
      );
      setDiagSaved(true);
      toast.success("Diagnostic enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setSavingDiag(false);
    }
  }

  async function saveCycle() {
    if (!plan || !onSaveCycle) return;
    setSavingCycle(true);
    try {
      // A cycle is derived from the diagnostic — never persist one without it.
      // If the teacher skipped "Enregistrer le diagnostic", save it first so the
      // class roster + scores are stored alongside the cycle.
      const savedDiagNow = !!(analysis && onSaveDiagnostic && !diagSaved);
      if (savedDiagNow) {
        await onSaveDiagnostic!(analysis!.results.map((r) => ({ prenom: r.prenom, vs: r.vs })));
        setDiagSaved(true);
      }
      await onSaveCycle({ axes: axsel, nseances, plan });
      setCycleSaved(true);
      toast.success(savedDiagNow ? "Diagnostic et cycle enregistrés" : "Cycle enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setSavingCycle(false);
    }
  }

  // -- CSV import -------------------------------------------------------------
  /** Apply a CSV-parsed roster: drop empty placeholder rows, append imported. */
  function applyCsvImport(students: { prenom: string; vs: [string, string, string] }[]) {
    setRows((rs) => {
      const kept = rs.filter((r) => r.prenom.trim() || r.vs.some((v) => v.trim()));
      const imported: Row[] = students.map((s) => ({
        id: nextId(),
        prenom: s.prenom,
        vs: s.vs,
        errs: [false, false, false],
      }));
      return [...kept, ...imported];
    });
  }

  // -- CSV export -------------------------------------------------------------
  function exportCsv() {
    if (!analysis) {
      window.alert("Analysez la classe d'abord.");
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
            ? `${OBS[r.lacunes[0].i].id} : ${r.lacunes[0].v.toFixed(1)}/10`
            : "Aucune",
          `${r.sa.nom} - ${r.sa.lib}`,
        ].join(";"),
      )
      .join("\n");
    const d = new Date();
    const dt = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const blob = new Blob([bom + hdr + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ADP-RM_${dt}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===========================================================================
  return (
    <div className={cx("root")}>
      {/* Header */}
      <div className={cx("hdr")}>
        <div className={cx("hdrTop")}>
          <div>
            <h1>Outil d&rsquo;aide à la décision pédagogique — EPS</h1>
            <div className={cx("sub")}>
              Renforcement Musculaire &amp; Souplesse · ADP 2026 · CRMEF Inezgane · BOUARGANE
            </div>
            <div className={cx("hdrB")}>
              <span className={cx("hb hbg")}>RM-01 → RM-06</span>
              {classMeta ? (
                <span className={cx("hb hbg")}>
                  {classMeta.nom}
                  {classMeta.niveau ? ` · ${classMeta.niveau}` : ""}
                </span>
              ) : (
                <span className={cx("hb hbo")}>4ème · 3ème</span>
              )}
              <span className={cx("hb hbo")}>DI — Diagnostique Initial</span>
              <span className={cx("hb hbo")}>coll1 DI 08</span>
            </div>
          </div>
          <div className={cx("nn")}>🚫 Outil sans note — Décision : l&rsquo;enseignant</div>
        </div>
      </div>

      {/* Stepper */}
      <div className={cx("stpWrap", "noPrint")}>
        {STEPS.map((s, i) => {
          const state = s.n === step ? "active" : s.n < step ? "done" : "";
          return (
            <span key={s.n} style={{ display: "contents" }}>
              <button
                type="button"
                className={cx("stp", state)}
                onClick={() => (state ? goStep(s.n) : undefined)}
              >
                <span className={cx("sn")}>{s.n}</span> {s.label}
              </button>
              {i < STEPS.length - 1 && <span className={cx("sarr")}>›</span>}
            </span>
          );
        })}
      </div>

      <div className={cx("main")}>
        {step === 1 && (
          <Step1
            classe={classe}
            setClasse={setClasse}
            dateStr={dateStr}
            setDateStr={setDateStr}
            rows={rows}
            setPrenom={setPrenom}
            setScore={setScore}
            addRows={addRows}
            removeRow={removeRow}
            runAnalyse={runAnalyse}
            analysis={analysis}
            s1error={s1error}
            applyCsvImport={applyCsvImport}
            exportCsv={exportCsv}
            goStep={goStep}
            canSave={!!onSaveDiagnostic}
            savingDiag={savingDiag}
            diagSaved={diagSaved}
            saveDiagnostic={saveDiagnostic}
            summaryRun={summaryRun}
          />
        )}

        {step === 2 && (
          <Step2
            ranked={rankedAxes}
            analysis={analysis}
            axsel={axsel}
            toggleAxe={toggleAxe}
            goStep={goStep}
            justifyRun={justifyRun}
          />
        )}

        {step === 3 && (
          <Step3
            nseances={nseances}
            setNseances={setNseances}
            distribution={distribution}
            goStep={goStep}
          />
        )}

        {step === 4 && (
          <Step4
            plan={plan}
            goStep={goStep}
            canSave={!!onSaveCycle}
            savingCycle={savingCycle}
            cycleSaved={cycleSaved}
            saveCycle={saveCycle}
            enableAi={enableAi}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STEP 1 — Diagnostic
// =============================================================================
function Step1(props: {
  classe: string;
  setClasse: (v: string) => void;
  dateStr: string;
  setDateStr: (v: string) => void;
  rows: Row[];
  setPrenom: (id: number, v: string) => void;
  setScore: (id: number, i: number, v: string) => void;
  addRows: (n: number) => void;
  removeRow: (id: number) => void;
  runAnalyse: () => void;
  analysis: ClassAnalysis | null;
  s1error: string | null;
  applyCsvImport: (students: { prenom: string; vs: [string, string, string] }[]) => void;
  exportCsv: () => void;
  goStep: (n: number) => void;
  canSave: boolean;
  savingDiag: boolean;
  diagSaved: boolean;
  saveDiagnostic: () => void;
  summaryRun?: () => Promise<string>;
}) {
  const a = props.analysis;
  return (
    <div>
      <div className={cx("card", "noPrint")}>
        <h2>📝 Saisie des données — Séance S1</h2>
        <div style={{ display: "flex", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 170 }}>
            <label className={cx("fieldLabel")}>Classe / Groupe</label>
            <input
              type="text"
              value={props.classe}
              onChange={(e) => props.setClasse(e.target.value)}
              placeholder="Ex : 3ème B"
            />
          </div>
          <div style={{ flex: "0 0 155px" }}>
            <label className={cx("fieldLabel")}>Date</label>
            <input
              type="date"
              value={props.dateStr}
              onChange={(e) => props.setDateStr(e.target.value)}
            />
          </div>
        </div>

        <div className={cx("fg")} style={{ marginBottom: 2 }}>
          <span className={cx("fgh")} style={{ textAlign: "left" }}>
            Prénom *
          </span>
          {OBS.map((o, i) => (
            <span key={o.id} className={cx("fgh")}>
              {["Force", "Souplesse", "Équilibre"][i]}
              <br />
              <small style={{ fontWeight: 400, fontSize: ".62rem" }}>
                {["planche·pompes·squats /10", "doigts-sol·pont /10", "unipodal /10"][i]}
              </small>
            </span>
          ))}
          <span />
        </div>

        <div>
          {props.rows.map((r) => (
            <div key={r.id} className={cx("fg")}>
              <input
                type="text"
                placeholder="Prénom"
                value={r.prenom}
                onChange={(e) => props.setPrenom(r.id, e.target.value)}
              />
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  placeholder="0-10"
                  className={r.errs[i] ? "err" : undefined}
                  value={r.vs[i]}
                  onChange={(e) => props.setScore(r.id, i, e.target.value)}
                />
              ))}
              <button
                type="button"
                className={cx("btn bo bsm")}
                style={{ padding: "2px 7px" }}
                onClick={() => props.removeRow(r.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
          <button type="button" className={cx("btn bo bsm")} onClick={() => props.addRows(1)}>
            + Élève
          </button>
          <button type="button" className={cx("btn bo bsm")} onClick={() => props.addRows(5)}>
            + 5
          </button>
          <button type="button" className={cx("btn bo bsm")} onClick={() => props.addRows(10)}>
            + 10
          </button>
        </div>

        {/* CSV import */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--bd)" }}>
          <CsvImport onImport={props.applyCsvImport} />
        </div>

        {props.s1error && <div className={cx("al ale")}>{props.s1error}</div>}

        <div className={cx("brow")}>
          <button type="button" className={cx("btn bp")} onClick={props.runAnalyse}>
            🔍 Analyser la classe
          </button>
          <button type="button" className={cx("btn bo")} onClick={props.exportCsv}>
            💾 Export CSV
          </button>
          <button type="button" className={cx("btn bo")} onClick={() => window.print()}>
            🖨 Imprimer
          </button>
        </div>
      </div>

      {/* Results */}
      {a && (
        <>
          <div className={cx("card")}>
            <h2>📊 Tableau individuel</h2>
            <div className={cx("tw")}>
              <table>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Prénom</th>
                    <th>Force</th>
                    <th>Souples.</th>
                    <th>Équil.</th>
                    <th>Moy /10</th>
                    <th>/20</th>
                    <th>Profil</th>
                    <th>Détaillé</th>
                    <th>Lacune(s)</th>
                    <th>Axe prioritaire</th>
                    <th>SA</th>
                  </tr>
                </thead>
                <tbody>
                  {a.results.map((r) => (
                    <tr key={r.prenom + r.rang} className={cx("r" + r.profil.toLowerCase())}>
                      <td>{r.rang}</td>
                      <td>
                        <strong>{r.prenom}</strong>
                      </td>
                      <td>{r.vs[0].toFixed(1)}</td>
                      <td>{r.vs[1].toFixed(1)}</td>
                      <td>{r.vs[2].toFixed(1)}</td>
                      <td>
                        <strong>{r.moy.toFixed(1)}</strong>
                      </td>
                      <td>{(r.moy * 2).toFixed(1)}</td>
                      <td>{badge(r.profil)}</td>
                      <td>
                        {r.profilDetail.map((p, i) => (
                          <span key={i}>
                            {i > 0 && " / "}
                            {badge(p)}
                          </span>
                        ))}
                      </td>
                      <td style={{ fontSize: ".67rem" }}>
                        {r.lacunes.length === 0
                          ? "Aucune lacune"
                          : r.lacunes.map((l, i) => (
                              <span key={i}>
                                {i > 0 && <br />}
                                L{i + 1} — {OBS[l.i].id} : {l.v.toFixed(1)}/10
                              </span>
                            ))}
                      </td>
                      <td style={{ fontSize: ".69rem" }}>{r.axe}</td>
                      <td>
                        <strong>{r.sa.nom}</strong>
                        <br />
                        <small>{r.sa.lib}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={cx("brow", "noPrint")}>
              <button type="button" className={cx("btn bo bsm")} onClick={props.exportCsv}>
                💾 Export CSV
              </button>
              <button type="button" className={cx("btn bo bsm")} onClick={() => window.print()}>
                🖨 Imprimer
              </button>
            </div>
          </div>

          <ClassBilan a={a} />

          {props.summaryRun && (
            <div className={cx("card", "noPrint")}>
              <h3>Assistance IA</h3>
              <AiPanel label="✨ Générer un résumé de classe (IA)" run={props.summaryRun} />
            </div>
          )}

          <div
            className={cx("brow", "noPrint")}
            style={{ justifyContent: "flex-end", alignItems: "center" }}
          >
            {props.canSave && (
              <button
                type="button"
                className={cx("btn bp")}
                disabled={props.savingDiag}
                onClick={props.saveDiagnostic}
              >
                {props.savingDiag
                  ? "Enregistrement…"
                  : props.diagSaved
                    ? "✓ Diagnostic enregistré"
                    : "💾 Enregistrer le diagnostic"}
              </button>
            )}
            <button type="button" className={cx("btn bg")} onClick={() => props.goStep(2)}>
              Passer à l&rsquo;étape 2 — Axes prioritaires →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// -- class bilan block --------------------------------------------------------
function ClassBilan({ a }: { a: ClassAnalysis }) {
  const pct = (n: number) => (a.total ? Math.round((n / a.total) * 100) : 0);
  const obsMeta = (m: number) => {
    if (m >= SH.C)
      return { bc: "#27AE60", st: "Bon niveau", stb: "var(--gb)", stc: "var(--gt)" };
    if (m >= SH.B)
      return { bc: "#E67E22", st: "En cours", stb: "var(--ob)", stc: "var(--ot)" };
    return { bc: "#C0392B", st: "Lacune collective", stb: "var(--rb)", stc: "var(--rt)" };
  };
  const grbBg: Record<Niveau, string> = { A: "var(--rb)", B: "var(--ob)", C: "var(--gb)" };

  return (
    <div className={cx("card")}>
      <h2>🏟 Bilan de classe</h2>
      <div className={cx("sr")}>
        <div className={cx("sc sca")}>
          <div className={cx("v")}>{a.counts.A}</div>
          <div className={cx("l")}>
            Débutants A<br />
            {pct(a.counts.A)}%
          </div>
        </div>
        <div className={cx("sc scb")}>
          <div className={cx("v")}>{a.counts.B}</div>
          <div className={cx("l")}>
            Interm. B<br />
            {pct(a.counts.B)}%
          </div>
        </div>
        <div className={cx("sc scc")}>
          <div className={cx("v")}>{a.counts.C}</div>
          <div className={cx("l")}>
            Avancés C<br />
            {pct(a.counts.C)}%
          </div>
        </div>
        <div className={cx("sc")}>
          <div className={cx("v")}>{a.moyClasse.toFixed(1)}</div>
          <div className={cx("l")}>Moy /10</div>
        </div>
        <div className={cx("sc")}>
          <div className={cx("v")}>{(a.moyClasse * 2).toFixed(1)}</div>
          <div className={cx("l")}>Moy /20</div>
        </div>
        <div className={cx("sc")}>
          <div className={cx("v")}>{a.total}</div>
          <div className={cx("l")}>Élèves</div>
        </div>
      </div>

      <h3 style={{ marginTop: 11, marginBottom: 6 }}>Analyse par famille musculaire</h3>
      <div>
        {a.moyObservables.map((m, i) => {
          const meta = obsMeta(m);
          const pc = Math.round((m / 10) * 100);
          return (
            <div key={i} className={cx("obr")}>
              <div className={cx("obrl")}>{OBS[i].nom}</div>
              <div className={cx("obrt")}>
                <div className={cx("obrf")} style={{ width: `${pc}%`, background: meta.bc }} />
              </div>
              <div className={cx("obrv")}>{m.toFixed(1)}/10</div>
              <div className={cx("obst")} style={{ background: meta.stb, color: meta.stc }}>
                {meta.st}
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 11, marginBottom: 6 }}>Groupes de besoin</h3>
      <div>
        {(["A", "B", "C"] as Niveau[]).map((p) =>
          a.counts[p] === 0 ? null : (
            <div key={p} className={cx("grb")} style={{ background: grbBg[p] }}>
              {badge(p)}
              <span style={{ flex: 1 }}>
                {a.counts[p]} élève{a.counts[p] > 1 ? "s" : ""} — {pct(a.counts[p])}%
              </span>
              <span style={{ fontSize: ".73rem", fontWeight: 700 }}>
                {SA[p].nom} : {SA[p].lib}
              </span>
            </div>
          ),
        )}
      </div>

      <div className={cx("dbox")}>
        <h3>Décision dominante automatique</h3>
        <p>{a.decision}</p>
        <p style={{ fontSize: ".67rem", marginTop: 5, opacity: 0.6 }}>
          (Décision finale : l&rsquo;enseignant)
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2 — Axes prioritaires
// =============================================================================
function Step2(props: {
  ranked: ReturnType<typeof rankAxes>;
  analysis: ClassAnalysis | null;
  axsel: number[];
  toggleAxe: (id: number) => void;
  goStep: (n: number) => void;
  justifyRun?: () => Promise<string>;
}) {
  const n = props.axsel.length;
  const msg =
    `${n} axe${n > 1 ? "s" : ""} sélectionné${n > 1 ? "s" : ""}` +
    (n < AXES_RANGE.min
      ? ` — minimum ${AXES_RANGE.min} requis`
      : n === AXES_RANGE.max
        ? " — maximum atteint"
        : " — vous pouvez en ajouter un 4e");

  return (
    <div className={cx("card")}>
      <h2>🎯 Sélection des axes prioritaires</h2>
      <div className={cx("al ali")} style={{ marginBottom: 8 }}>
        Sélectionnez entre <strong>3 et 4 axes</strong>. Classés par pertinence selon les
        données réelles.
      </div>
      <div className={cx("axmsg")}>{msg}</div>

      <div>
        {props.ranked.map(({ axe, pertinence }) => {
          const sel = props.axsel.includes(axe.id);
          const obs = OBS[axe.oi];
          const moy = props.analysis?.moyObservables[axe.oi] ?? 0;
          return (
            <div
              key={axe.id}
              className={cx("axc", sel && "sel")}
              onClick={() => props.toggleAxe(axe.id)}
            >
              <div className={cx("ah")}>
                <input
                  type="checkbox"
                  checked={sel}
                  onChange={() => props.toggleAxe(axe.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div style={{ flex: 1 }}>
                  <div className={cx("at")}>
                    Axe {axe.id} — {axe.titre}
                  </div>
                  <div className={cx("ad")}>{axe.desc}</div>
                  <div className={cx("am")}>
                    <span>
                      <span className={cx("pb")} style={{ width: Math.min(pertinence, 100) }} />
                      Pertinence : {pertinence}% concernés
                    </span>
                    <span>
                      Famille : {obs.nom} · Moy : {moy.toFixed(1)}/10
                    </span>
                    <span>SA : {axe.csg.A.sa}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {props.justifyRun && n >= AXES_RANGE.min && (
        <AiPanel label="✨ Justifier les axes choisis (IA)" run={props.justifyRun} />
      )}

      <div className={cx("brow")}>
        <button type="button" className={cx("btn bo")} onClick={() => props.goStep(1)}>
          ← Retour
        </button>
        <button
          type="button"
          className={cx("btn bg")}
          disabled={n < AXES_RANGE.min}
          onClick={() => props.goStep(3)}
        >
          Paramétrer le cycle →
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 3 — Paramétrage du cycle
// =============================================================================
function Step3(props: {
  nseances: number;
  setNseances: (n: number) => void;
  distribution: ReturnType<typeof distribute>;
  goStep: (n: number) => void;
}) {
  return (
    <div className={cx("card")}>
      <h2>⚙️ Paramétrage du cycle</h2>
      <h3>Nombre de séances</h3>
      <div className={cx("slw")}>
        <input
          type="range"
          min={SEANCES.min}
          max={SEANCES.max}
          value={props.nseances}
          onChange={(e) => props.setNseances(parseInt(e.target.value, 10))}
        />
        <div className={cx("slv")}>{props.nseances}</div>
        <div style={{ fontSize: ".75rem", color: "var(--sl)" }}>
          séances — {props.distribution.length} séquences
        </div>
      </div>

      <div>
        {props.distribution.map((d, i) => (
          <div key={i} className={cx("dseq")}>
            <div className={cx("sh")}>
              Séquence {i + 1} — {d.seances} séance{d.seances > 1 ? "s" : ""}
            </div>
            <div className={cx("ss")}>
              Axe {d.axe.id} — {d.axe.titre}
            </div>
          </div>
        ))}
      </div>

      <div className={cx("brow")}>
        <button type="button" className={cx("btn bo")} onClick={() => props.goStep(2)}>
          ← Retour
        </button>
        <button type="button" className={cx("btn bg")} onClick={() => props.goStep(4)}>
          Générer la planification →
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 4 — Planification dynamique
// =============================================================================
function Step4(props: {
  plan: CyclePlan | null;
  goStep: (n: number) => void;
  canSave: boolean;
  savingCycle: boolean;
  cycleSaved: boolean;
  saveCycle: () => void;
  enableAi: boolean;
}) {
  const plan = props.plan;
  return (
    <div className={cx("card")}>
      <h2>📅 Planification dynamique du cycle</h2>

      {!plan ? (
        <div className={cx("al ale")}>Aucune planification — revenez à l&rsquo;étape 3.</div>
      ) : (
        <>
          <div>
            {plan.sequences.map((seq) => (
              <div key={seq.index} className={cx("sqb")}>
                <div className={cx("sqh")}>
                  <h3>
                    Séquence {seq.index + 1} — {seq.axe.titre}
                  </h3>
                  <span className={cx("sqt")}>
                    Séances {seq.seanceStart} à {seq.seanceEnd}
                  </span>
                </div>
                <table className={cx("pt")}>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Axe</th>
                      <th>Objectif</th>
                      <th className={cx("ga")}>
                        Groupe A — Débutants
                        <br />
                        <small>{seq.axe.csg.A.sa}</small>
                      </th>
                      <th className={cx("gb")}>
                        Groupe B — Intermédiaires
                        <br />
                        <small>{seq.axe.csg.B.sa}</small>
                      </th>
                      <th className={cx("gc")}>
                        Groupe C — Avancés
                        <br />
                        <small>{seq.axe.csg.C.sa}</small>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seq.seances.map((s) => (
                      <GroupRows key={s.numero} seq={seq} s={s} />
                    ))}
                  </tbody>
                </table>
                <ExercisePanel axe={seq.axe} />
                {props.enableAi && (
                  <div className="noPrint">
                    <AiPanel
                      label={`✨ Enrichir le groupe A — Axe ${seq.axe.id} (IA)`}
                      run={() =>
                        aiEnrich({
                          axeTitre: seq.axe.titre,
                          niveau: "A",
                          consigne: seq.axe.csg.A.c,
                          critere: seq.axe.csg.A.cr,
                        }).then((r) => r.text)
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={cx("cycs")}>
            <h3>Résumé du cycle</h3>
            <p>{plan.resume}</p>
            <p style={{ fontSize: ".67rem", marginTop: 5, opacity: 0.6 }}>
              Décision finale de progression : l&rsquo;enseignant.
            </p>
          </div>
        </>
      )}

      <div className={cx("brow", "noPrint")}>
        <button type="button" className={cx("btn bo")} onClick={() => props.goStep(3)}>
          ← Retour
        </button>
        <button type="button" className={cx("btn bo")} onClick={() => window.print()}>
          🖨 Imprimer
        </button>
        {props.canSave && (
          <button
            type="button"
            className={cx("btn bg")}
            disabled={props.savingCycle || !plan}
            onClick={props.saveCycle}
            style={{ marginLeft: "auto" }}
          >
            {props.savingCycle
              ? "Enregistrement…"
              : props.cycleSaved
                ? "✓ Cycle enregistré"
                : "💾 Enregistrer le cycle"}
          </button>
        )}
      </div>
    </div>
  );
}

function GroupRows({
  seq,
  s,
}: {
  seq: CyclePlan["sequences"][number];
  s: CyclePlan["sequences"][number]["seances"][number];
}) {
  const tints: Record<Niveau, string> = { A: "var(--rt)", B: "var(--ot)", C: "var(--gt)" };
  return (
    <>
      <tr>
        <td>
          <strong>{s.numero}</strong>
        </td>
        <td style={{ fontSize: ".67rem" }}>Axe {seq.axe.id}</td>
        <td style={{ fontSize: ".69rem" }}>{s.objectif}</td>
        {(["A", "B", "C"] as Niveau[]).map((g) => (
          <td key={g} className={cx("g" + g.toLowerCase())}>
            <strong>{s.groupes[g].sa}</strong>
            <br />
            {s.groupes[g].c}
            <br />
            <em style={{ fontSize: ".63rem", color: tints[g] }}>✓ {s.groupes[g].cr}</em>
          </td>
        ))}
      </tr>
      {s.indicateur && (
        <tr>
          <td colSpan={6}>
            <div className={cx("ind")}>
              📋 À observer avant la séance suivante — <em>{s.indicateur}</em>{" "}
              <span style={{ color: "var(--sl)", fontSize: ".62rem" }}>
                (Indicatif — décision de progression : vous)
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Differentiated exercise lists (Garçons / Filles) + training programme for an axis. */
function ExercisePanel({ axe }: { axe: Axe }) {
  return (
    <div className={cx("exPanel")}>
      <div className={cx("exGrid")}>
        <div className={cx("exCol", "exBoys")}>
          <h4>🧒 Exercices Garçons</h4>
          <ul>
            {axe.exG.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
        <div className={cx("exCol", "exGirls")}>
          <h4>👧 Exercices Filles</h4>
          <ul>
            {axe.exF.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className={cx("exProg")}>
        <strong>Programme :</strong> {axe.prog}
      </div>
    </div>
  );
}
