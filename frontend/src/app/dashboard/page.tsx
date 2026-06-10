"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NiveauManager } from "@/components/niveau-manager";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useRevalidate } from "@/lib/use-revalidate";
import { useI18n } from "@/lib/i18n";
import {
  createClass,
  deleteClass,
  listClasses,
  listNiveaux,
  listRecentCycles,
  seedDemo,
  type ClassSummary,
  type Niveau as NiveauItem,
  type RecentCycle,
} from "@/lib/api";

export default function DashboardPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [cycles, setCycles] = useState<RecentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  // There are no built-in levels — each teacher creates their own. Empty until
  // they add one (or pick from the levels they've created).
  const [niveau, setNiveau] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [niveauManagerOpen, setNiveauManagerOpen] = useState(false);

  const refresh = useCallback(() => {
    return Promise.all([listClasses(), listRecentCycles(), listNiveaux()])
      .then(([c, cy, nv]) => {
        setClasses(c.classes);
        setCycles(cy.cycles);
        setNiveaux(nv.niveaux);
        // Default the form's level to the first one the teacher has, without
        // clobbering an existing choice.
        setNiveau((cur) => cur || nv.niveaux[0]?.label || "");
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  // The NiveauManager persists add/delete; we only sync local state + selection.
  function handleNiveauAdded(created: NiveauItem) {
    setNiveaux((prev) => (prev.some((n) => n.id === created.id) ? prev : [...prev, created]));
    setNiveau(created.label); // newly added level becomes the form's selection
  }

  function handleNiveauDeleted(removed: NiveauItem) {
    setNiveaux((prev) => {
      const next = prev.filter((x) => x.id !== removed.id);
      // If the deleted level was selected, fall back to the first remaining one.
      setNiveau((cur) => (cur === removed.label ? next[0]?.label ?? "" : cur));
      return next;
    });
  }

  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  // Re-fetch when returning to the dashboard (e.g. after running a diagnostic
  // on another page), so class stats stay current.
  useRevalidate(refresh, ready);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setCreating(true);
    try {
      const { class: created } = await createClass(nom.trim(), niveau || undefined);
      toast.success(`Classe « ${created.nom} » créée`);
      router.push(`/classes/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleSeed() {
    try {
      const res = await seedDemo();
      if (res.created) {
        toast.success("Classe de démonstration créée");
        refresh();
      } else {
        toast.info(res.reason ?? "Données déjà présentes");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget.id);
      toast.success("Classe supprimée");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la suppression");
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return null;

  const totalStudents = classes.reduce((s, c) => s + c.students, 0);
  const totalDiagnostics = classes.reduce((s, c) => s + c.diagnostics, 0);
  const totalCycles = classes.reduce((s, c) => s + c.cycles, 0);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0C1E3C]">
      <AppHeader />

      <div className="mx-auto max-w-[1280px] px-4 py-7">
        <h1 className="text-2xl font-semibold tracking-tight">{t("dash.title")}</h1>
        <p className="mt-1 text-sm text-[#64748B]">{t("dash.subtitle")}</p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={classes.length} label={t("dash.classes")} icon={GraduationCap} tone="primary" />
          <Stat value={totalStudents} label={t("dash.students")} icon={Users} tone="accent" />
          <Stat value={totalDiagnostics} label={t("dash.diagnostics")} icon={ClipboardCheck} tone="primary" />
          <Stat value={totalCycles} label={t("dash.cycles")} icon={CalendarRange} tone="accent" />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Classes */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">{t("dash.myClasses")}</h2>
            {loading ? (
              <p className="text-sm text-[#64748B]">{t("dash.loading")}</p>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2563EB]/30 bg-white p-8 text-center">
                <p className="text-sm text-[#64748B]">{t("dash.noClasses")}</p>
                <button
                  type="button"
                  onClick={handleSeed}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#2563EB]/30 bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#2563EB] hover:text-white"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("dash.demo")}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#2563EB]/30 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.35)]"
                  >
                    {/* top gradient accent on hover */}
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] transition-transform duration-300 group-hover:scale-x-100" />
                    <Link href={`/classes/${c.id}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg font-semibold text-[#0C1E3C]">{c.nom}</span>
                        {c.niveau && (
                          <span className="rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
                            {c.niveau}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                        <Pill>{c.students} élève(s)</Pill>
                        <Pill>{c.diagnostics} diagnostic(s)</Pill>
                        <Pill>{c.cycles} cycle(s)</Pill>
                      </div>
                      <div className="mt-3 pe-9 text-xs text-[#64748B]">
                        {t("dash.lastDiag")} : {c.last_diagnostic ?? "—"}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(c);
                      }}
                      className="absolute bottom-2.5 end-2.5 grid h-8 w-8 place-items-center rounded-lg text-[#94A3B8] opacity-70 transition hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
                      aria-label={`Supprimer la classe ${c.nom}`}
                      title="Supprimer la classe"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar: create + recent cycles */}
          <aside className="space-y-6">
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <h2 className="mb-4 text-lg font-semibold">{t("dash.newClass")}</h2>
              <label className="mb-1.5 block text-xs font-semibold text-[#64748B]">
                {t("dash.name")}
              </label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : 3ème B"
                className="mb-4 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/12"
              />
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="niveau-select" className="text-xs font-semibold text-[#64748B]">
                  {t("dash.level")}
                </label>
                <button
                  type="button"
                  onClick={() => setNiveauManagerOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#EFF6FF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {t("niveau.manage")}
                </button>
              </div>
              {niveaux.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setNiveauManagerOpen(true)}
                  className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#2563EB]/30 bg-[#EFF6FF]/40 px-3 py-2.5 text-sm font-semibold text-[#2563EB] transition hover:border-[#2563EB] hover:bg-[#EFF6FF]"
                >
                  <Plus className="h-4 w-4" />
                  {t("niveau.createFirst")}
                </button>
              ) : (
                <select
                  id="niveau-select"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  className="mb-5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/12"
                >
                  {niveaux.map((n) => (
                    <option key={n.id}>{n.label}</option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={creating || !nom.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:shadow-xl hover:shadow-[#2563EB]/30 hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
              >
                {creating ? t("dash.creating") : t("dash.create")}
              </button>
            </form>

            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <h2 className="mb-4 text-lg font-semibold">{t("dash.recentCycles")}</h2>
              {cycles.length === 0 ? (
                <p className="text-sm text-[#64748B]">{t("dash.noCycles")}</p>
              ) : (
                <ul className="space-y-2.5">
                  {cycles.map((cy) => (
                    <li key={cy.id}>
                      <Link
                        href={`/classes/${cy.class_id}/cycle/${cy.id}`}
                        className="block rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm transition hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0C1E3C]">{cy.class_nom}</span>
                          <span className="text-xs text-[#64748B]">{cy.n_seances} séances</span>
                        </div>
                        <div className="mt-0.5 text-xs text-[#64748B]">
                          {JSON.parse(cy.axes_json).length} axes
                          {cy.edited ? " · modifié" : ""}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      <NiveauManager
        open={niveauManagerOpen}
        niveaux={niveaux}
        onClose={() => setNiveauManagerOpen(false)}
        onAdded={handleNiveauAdded}
        onDeleted={handleNiveauDeleted}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        danger
        title="Supprimer la classe ?"
        message={
          <>
            La classe <strong className="text-[#0C1E3C]">{deleteTarget?.nom}</strong> et toutes
            ses données (élèves, diagnostics, cycles) seront définitivement supprimées. Cette
            action est irréversible.
          </>
        }
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-medium text-[#475569]">
      {children}
    </span>
  );
}

function Stat({
  value,
  label,
  icon: Icon,
  tone,
}: {
  value: number;
  label: string;
  icon: typeof Users;
  tone: "primary" | "accent";
}) {
  const c = tone === "primary" ? "#2563EB" : "#0EA5E9";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ background: `${c}14`, color: c }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-2xl font-bold leading-none text-[#0C1E3C]">{value}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[#64748B]">
          {label}
        </div>
      </div>
    </div>
  );
}
