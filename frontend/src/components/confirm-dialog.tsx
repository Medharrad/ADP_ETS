"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0C1E3C]/40 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => !loading && onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-3.5">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              danger ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#EFF6FF] text-[#2563EB]"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[#0C1E3C]">{title}</h3>
            <div className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{message}</div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] transition hover:bg-[#F1F5F9] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60 ${
              danger
                ? "bg-[#DC2626] shadow-[#DC2626]/25"
                : "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] shadow-[#2563EB]/25"
            }`}
          >
            {loading ? "Veuillez patienter…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
