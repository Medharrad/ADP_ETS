"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
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
      <main className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[#64748B]">Chargement…</p>
      </main>
    );
  }
  if (!data) return null;

  const { class: klass, students, cycles } = data;
  const hasRoster = students.length > 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0C1E3C]">
      <AppHeader />
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs text-[#64748B] hover:underline">
              ← Tableau de bord
            </Link>
            <h1 className="font-serif text-2xl">
              {klass.nom}
              {klass.niveau && (
                <span className="ml-2 rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2.5 py-0.5 align-middle text-xs font-bold text-[#2563EB]">
                  {klass.niveau}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              {students.length} élève(s) · {sortedDiagnostics.length} diagnostic(s) ·{" "}
              {cycles.length} cycle(s)
            </p>
          </div>
          <Link
            href={`/classes/${classId}/evaluate`}
            className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105"
          >
            {hasRoster ? "+ Nouvelle évaluation" : "+ Premier diagnostic"}
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* Progress */}
            <section className="rounded-xl border border-[#2563EB]/20 bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-lg">Évolution de la classe</h2>
              {sortedDiagnostics.length === 0 ? (
                <p className="text-sm text-[#64748B]">
                  Aucun diagnostic. Lancez une première évaluation pour suivre la progression.
                </p>
              ) : (
                <ProgressTable diagnostics={sortedDiagnostics} />
              )}
            </section>

            {/* Cycles */}
            <section className="rounded-xl border border-[#2563EB]/20 bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-lg">Cycles planifiés</h2>
              {cycles.length === 0 ? (
                <p className="text-sm text-[#64748B]">
                  Aucun cycle. Terminez un diagnostic puis générez une planification.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cycles.map((cy) => (
                    <li key={cy.id}>
                      <Link
                        href={`/classes/${classId}/cycle/${cy.id}`}
                        className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2 text-sm transition-colors hover:border-[#2563EB]"
                      >
                        <span>
                          {JSON.parse(cy.axes_json).length} axes · {cy.n_seances} séances
                          {cy.edited ? " · modifié" : ""}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {new Date(cy.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Roster */}
          <aside className="rounded-xl border border-[#2563EB]/20 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-serif text-lg">Liste de classe</h2>
            {students.length === 0 ? (
              <p className="text-sm text-[#64748B]">Roster vide.</p>
            ) : (
              <ol className="space-y-1 text-sm">
                {students.map((s, i) => (
                  <li key={s.id} className="flex gap-2">
                    <span className="w-5 text-right text-[#64748B]">{i + 1}.</span>
                    <span>{s.prenom}</span>
                  </li>
                ))}
              </ol>
            )}
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
    if (Math.abs(d) < 0.05) return <span className="text-[#64748B]"> →</span>;
    return d > 0 ? (
      <span className="text-[#124A1E]"> ▲ {d.toFixed(1)}</span>
    ) : (
      <span className="text-[#7A1212]"> ▼ {Math.abs(d).toFixed(1)}</span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-[#E2E8F0] p-2 text-left text-xs text-[#64748B]"></th>
            {cols.map((c, i) => (
              <th key={i} className="border-b border-[#E2E8F0] p-2 text-center text-xs">
                {c.label}
                <br />
                <span className="font-normal text-[#64748B]">{c.total} élèves</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border-b border-[#F1F5F9] p-2 font-semibold">{r.key}</td>
              {cols.map((c, i) => (
                <td key={i} className="border-b border-[#F1F5F9] p-2 text-center">
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
