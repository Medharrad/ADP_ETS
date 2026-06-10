"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createNiveau, deleteNiveau, type Niveau } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export interface NiveauManagerProps {
  open: boolean;
  /** The teacher's own levels (from /api/niveaux). */
  niveaux: Niveau[];
  onClose: () => void;
  /** A level was created — parent merges it into its list (and may select it). */
  onAdded: (niveau: Niveau) => void;
  /** A level was removed — parent drops it from its list. */
  onDeleted: (niveau: Niveau) => void;
}

/**
 * Focused manager for a teacher's grade levels. There are no built-in defaults —
 * every level is created by the teacher and can be added or removed here.
 * Add/delete are persisted via the API, and the parent is notified through
 * callbacks so the surrounding form stays in sync. Mirrors the ConfirmDialog
 * visual language (overlay, Escape-to-close, body-scroll lock).
 */
export function NiveauManager({ open, niveaux, onClose, onAdded, onDeleted }: NiveauManagerProps) {
  const { t } = useI18n();
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape, lock body scroll, and focus the input when opening.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Existing labels, case-insensitive — used to block duplicates.
  const taken = new Set(niveaux.map((n) => n.label.toLowerCase()));

  async function handleAdd() {
    const value = label.trim();
    if (!value || adding) return;
    if (taken.has(value.toLowerCase())) {
      toast.error(t("niveau.exists"));
      return;
    }
    setAdding(true);
    try {
      const { niveau } = await createNiveau(value);
      onAdded(niveau);
      setLabel("");
      inputRef.current?.focus();
      toast.success(t("niveau.added"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("niveau.addFail"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(niveau: Niveau) {
    if (deletingId !== null) return;
    setDeletingId(niveau.id);
    try {
      await deleteNiveau(niveau.id);
      onDeleted(niveau);
      toast.success(t("niveau.deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("niveau.deleteFail"));
    } finally {
      setDeletingId(null);
    }
  }

  const canAdd = !!label.trim() && !taken.has(label.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0C1E3C]/40 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="niveau-manager-title"
        className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("niveau.close")}
          className="absolute end-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pe-8">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 id="niveau-manager-title" className="text-lg font-semibold text-[#0C1E3C]">
              {t("niveau.title")}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#64748B]">{t("niveau.subtitle")}</p>
          </div>
        </div>

        {/* Add a custom level */}
        <div className="mt-5 flex gap-2">
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            maxLength={40}
            placeholder={t("niveau.addPlaceholder")}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/12"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !canAdd}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {adding ? t("niveau.adding") : t("niveau.add")}
          </button>
        </div>

        <div className="mt-5 max-h-72 overflow-y-auto pe-0.5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            {t("niveau.mine")}
          </h4>
          {niveaux.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E2E8F0] px-3 py-6 text-center text-xs text-[#94A3B8]">
              {t("niveau.empty")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {niveaux.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5"
                >
                  <span className="truncate text-sm font-medium text-[#0C1E3C]">{n.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(n)}
                    disabled={deletingId !== null}
                    aria-label={`${t("niveau.deleted")} — ${n.label}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#94A3B8] transition hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
                  >
                    {deletingId === n.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0C1E3C] px-4 py-2 text-sm font-bold text-white transition hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-[#0C1E3C]/30"
          >
            {t("niveau.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
