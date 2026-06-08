"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import styles from "@/components/wizard/wizard.module.css";
import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import type { CyclePlan } from "@/lib/calc";
import type { Niveau } from "@/lib/referentiel";
import { getCycle, updateCyclePlan } from "@/lib/api";

const GROUPS: Niveau[] = ["A", "B", "C"];
const TINTS: Record<Niveau, string> = { A: "var(--rt)", B: "var(--ot)", C: "var(--gt)" };

export default function CyclePage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string; cid: string }>();
  const classId = Number(params.id);
  const cycleId = Number(params.cid);

  const [plan, setPlan] = useState<CyclePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getCycle(cycleId)
      .then(({ cycle }) => setPlan(JSON.parse(cycle.plan_json) as CyclePlan))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Cycle introuvable");
        router.replace(`/classes/${classId}`);
      })
      .finally(() => setLoading(false));
  }, [ready, cycleId, classId, router]);

  if (!ready || loading || !plan) return null;

  if (!plan.sequences?.length) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[#64748B]">
          Ce cycle ne contient pas de planification détaillée.{" "}
          <Link href={`/classes/${classId}`} className="text-[#2563EB] hover:underline">
            Retour à la classe
          </Link>
        </p>
      </main>
    );
  }

  function update(mut: (p: CyclePlan) => void) {
    setPlan((prev) => {
      if (!prev) return prev;
      const copy = structuredClone(prev);
      mut(copy);
      return copy;
    });
  }

  async function save() {
    if (!plan) return;
    setSaving(true);
    try {
      await updateCyclePlan(cycleId, plan);
      toast.success("Cycle mis à jour");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  const editStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 38,
    border: "1px solid var(--cream3)",
    borderRadius: 4,
    padding: "3px 5px",
    fontFamily: "inherit",
    fontSize: ".71rem",
    resize: "vertical",
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <div className="mx-auto max-w-[1280px] px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/classes/${classId}`}
            className="text-xs text-[#64748B] hover:underline"
          >
            ← Retour à la classe
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-[#2563EB]/40 px-3 py-1.5 text-sm"
            >
              🖨 Imprimer
            </button>
            {editing ? (
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-3.5 py-1.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/25 transition hover:brightness-105 disabled:opacity-40"
              >
                {saving ? "Enregistrement…" : "✓ Enregistrer"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-3.5 py-1.5 text-sm font-bold text-white shadow-md shadow-[#2563EB]/25 transition hover:brightness-105"
              >
                ✎ Modifier
              </button>
            )}
          </div>
        </div>

        <div className={styles.root}>
          <div className={styles.main} style={{ padding: 0 }}>
            <div className={styles.card}>
              <h2>📅 Planification du cycle</h2>

              {plan.sequences.map((seq, si) => (
                <div key={seq.index} className={styles.sqb}>
                  <div className={styles.sqh}>
                    <h3>
                      Séquence {seq.index + 1} — {seq.axe.titre}
                    </h3>
                    <span className={styles.sqt}>
                      Séances {seq.seanceStart} à {seq.seanceEnd}
                    </span>
                  </div>
                  <table className={styles.pt}>
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Objectif</th>
                        {GROUPS.map((g) => (
                          <th
                            key={g}
                            className={styles["g" + g.toLowerCase()]}
                          >
                            Groupe {g}
                            <br />
                            <small>{seq.axe.csg[g].sa}</small>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {seq.seances.map((s, sj) => (
                        <tr key={s.numero}>
                          <td>
                            <strong>{s.numero}</strong>
                          </td>
                          <td style={{ fontSize: ".69rem", minWidth: 140 }}>
                            {editing ? (
                              <textarea
                                style={editStyle}
                                value={s.objectif}
                                onChange={(e) =>
                                  update((p) => {
                                    p.sequences[si].seances[sj].objectif = e.target.value;
                                  })
                                }
                              />
                            ) : (
                              s.objectif
                            )}
                          </td>
                          {GROUPS.map((g) => (
                            <td key={g} className={styles["g" + g.toLowerCase()]}>
                              <strong>{s.groupes[g].sa}</strong>
                              <br />
                              {editing ? (
                                <>
                                  <textarea
                                    style={editStyle}
                                    value={s.groupes[g].c}
                                    onChange={(e) =>
                                      update((p) => {
                                        p.sequences[si].seances[sj].groupes[g].c =
                                          e.target.value;
                                      })
                                    }
                                  />
                                  <textarea
                                    style={{ ...editStyle, color: TINTS[g] }}
                                    value={s.groupes[g].cr}
                                    onChange={(e) =>
                                      update((p) => {
                                        p.sequences[si].seances[sj].groupes[g].cr =
                                          e.target.value;
                                      })
                                    }
                                  />
                                </>
                              ) : (
                                <>
                                  {s.groupes[g].c}
                                  <br />
                                  <em
                                    style={{ fontSize: ".63rem", color: TINTS[g] }}
                                  >
                                    ✓ {s.groupes[g].cr}
                                  </em>
                                </>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {((seq.axe.exG?.length ?? 0) > 0 || (seq.axe.exF?.length ?? 0) > 0) && (
                    <div className={styles.exPanel}>
                      <div className={styles.exGrid}>
                        <div className={`${styles.exCol} ${styles.exBoys}`}>
                          <h4>🧒 Exercices Garçons</h4>
                          <ul>
                            {(seq.axe.exG ?? []).map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                        <div className={`${styles.exCol} ${styles.exGirls}`}>
                          <h4>👧 Exercices Filles</h4>
                          <ul>
                            {(seq.axe.exF ?? []).map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {seq.axe.prog && (
                        <div className={styles.exProg}>
                          <strong>Programme :</strong> {seq.axe.prog}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className={styles.cycs}>
                <h3>Résumé du cycle</h3>
                <p>{plan.resume}</p>
                <p style={{ fontSize: ".67rem", marginTop: 5, opacity: 0.6 }}>
                  Décision finale de progression : l&rsquo;enseignant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
