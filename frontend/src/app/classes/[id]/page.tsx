"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { RosterManager } from "@/components/roster-manager";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useRevalidate } from "@/lib/use-revalidate";
import { analyser } from "@/lib/calc";
import { OBS } from "@/lib/referentiel";
import { getClass, type ClassDetail, type Diagnostic } from "@/lib/api";

function diagAverages(d: Diagnostic) {
  const students = d.scores.map((s) => ({
    prenom: s.prenom,
    vs: [s.obs1, s.obs2, s.obs3] as [number, number, number],
  }));
  if (students.length === 0)
    return { moyClasse: 0, moyObservables: [0, 0, 0] as [number, number, number], total: 0 };
  const a = analyser(students);
  return { moyClasse: a.moyClasse, moyObservables: a.moyObservables, total: a.total };
}

export default function ClassDetailPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classId = Number(params.id);

  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return getClass(classId)
      .then(setData)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Classe introuvable");
        router.replace("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [classId, router]);

  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  useRevalidate(refresh, ready);

  const sortedDiagnostics = useMemo(
    () =>
      data
        ? [...data.diagnostics].sort((a, b) =>
            (a.date ?? a.created_at).localeCompare(b.date ?? b.created_at),
          )
        : [],
    [data],
  );

  if (!ready || loading) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[var(--c-muted)]">Chargement…</p>
      </main>
    );
  }
  if (!data) return null;

  const { class: klass, students, cycles } = data;
  const hasRoster = students.length > 0;

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-ink)]">
      <AppHeader />
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:underline">
              ← Tableau de bord
            </Link>
            <h1 className="font-serif text-2xl">
              {klass.nom}
              {klass.niveau && (
                <span className="ml-2 rounded-full border border-[var(--c-primary)]/20 bg-[var(--c-soft)] px-2.5 py-0.5 align-middle text-xs font-bold text-[var(--c-primary)]">
                  {klass.niveau}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              {students.length} élève(s) · {sortedDiagnostics.length} diagnostic(s) ·{" "}
              {cycles.length} cycle(s)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/classes/${classId}/evaluate`}
              className="rounded-xl bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[var(--c-primary)]/25 transition hover:brightness-105"
            >
              {hasRoster ? "📋 Nouvelle évaluation — 6 tests" : "📋 Premier diagnostic — 6 tests"}
            </Link>
            <Link
              href={`/classes/${classId}/grille`}
              className="rounded-xl border border-[var(--c-primary)]/30 bg-[var(--c-surface)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)] hover:bg-[var(--c-soft)]"
            >
              🖨 Fiche imprimable
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* Progress */}
            <section className="rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-surface)] p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-lg">Évolution de la classe</h2>
              {sortedDiagnostics.length === 0 ? (
                <p className="text-sm text-[var(--c-muted)]">
                  Aucun diagnostic. Lancez une première évaluation pour suivre la progression.
                </p>
              ) : (
                <ProgressTable diagnostics={sortedDiagnostics} />
              )}
            </section>

            {/* Cycles */}
            <section className="rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-surface)] p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-lg">Cycles planifiés</h2>
              {cycles.length === 0 ? (
                <p className="text-sm text-[var(--c-muted)]">
                  Aucun cycle. Terminez un diagnostic puis générez une planification.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cycles.map((cy) => (
                    <li key={cy.id}>
                      <Link
                        href={`/classes/${classId}/cycle/${cy.id}`}
                        className="flex items-center justify-between rounded-md border border-[var(--c-border)] px-3 py-2 text-sm transition-colors hover:border-[var(--c-primary)]"
                      >
                        <span>
                          {JSON.parse(cy.axes_json).length} axes · {cy.n_seances} séances
                          {cy.edited ? " · modifié" : ""}
                        </span>
                        <span className="text-xs text-[var(--c-muted)]">
                          {new Date(cy.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Roster (editable) */}
          <aside className="rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-surface)] p-4 shadow-sm">
            <RosterManager
              classId={classId}
              className={klass.nom}
              students={students}
              onSaved={refresh}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

function ProgressTable({ diagnostics }: { diagnostics: Diagnostic[] }) {
  const cols = diagnostics.map((d) => ({
    label: d.label || d.date || "—",
    ...diagAverages(d),
  }));

  const rows = [
    { key: "Moyenne", get: (c: (typeof cols)[number]) => c.moyClasse },
    ...OBS.map((o, i) => ({ key: o.id, get: (c: (typeof cols)[number]) => c.moyObservables[i] })),
  ];

  const delta = (cur: number, prev: number | undefined) => {
    if (prev === undefined) return null;
    const d = cur - prev;
    if (Math.abs(d) < 0.05) return <span className="text-[var(--c-muted)]"> →</span>;
    return d > 0 ? (
      <span className="text-[var(--c-success-ink)]"> ▲ {d.toFixed(1)}</span>
    ) : (
      <span className="text-[var(--c-danger-deep)]"> ▼ {Math.abs(d).toFixed(1)}</span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-[var(--c-border)] p-2 text-left text-xs text-[var(--c-muted)]"></th>
            {cols.map((c, i) => (
              <th key={i} className="border-b border-[var(--c-border)] p-2 text-center text-xs">
                {c.label}
                <br />
                <span className="font-normal text-[var(--c-muted)]">{c.total} élèves</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border-b border-[var(--c-border2)] p-2 font-semibold">{r.key}</td>
              {cols.map((c, i) => (
                <td key={i} className="border-b border-[var(--c-border2)] p-2 text-center">
                  {r.get(c).toFixed(1)}
                  {delta(r.get(c), i > 0 ? r.get(cols[i - 1]) : undefined)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
