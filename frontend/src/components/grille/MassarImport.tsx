"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileSpreadsheet, Upload, X } from "lucide-react";

import { parseMassarFile, type MassarResult } from "@/lib/massar";

export interface MassarImportProps {
  /** Reçoit les noms d'élèves extraits du fichier Massar. */
  onImport: (names: string[]) => void;
}

/**
 * Bouton « Importer Excel » : lit un export Massar (.xlsx/.xls/.csv),
 * extrait la liste des élèves et la transmet à la grille d'observation.
 */
export function MassarImport({ onImport }: MassarImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MassarResult | null>(null);

  async function readFile(file: File) {
    setFileName(file.name);
    setBusy(true);
    setResult(null);
    try {
      setResult(await parseMassarFile(file));
    } catch {
      toast.error("Lecture du fichier impossible");
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!result || result.names.length === 0) return;
    onImport(result.names);
    toast.success(
      `${result.names.length} élève${result.names.length > 1 ? "s" : ""} importé${
        result.names.length > 1 ? "s" : ""
      } depuis Massar`,
    );
    reset();
    setOpen(false);
  }

  function reset() {
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0D9488]/25 transition hover:brightness-105"
      >
        <FileSpreadsheet className="h-4 w-4" /> Importer Excel
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#475569]">
              <FileSpreadsheet className="h-4 w-4 text-[#0D9488]" />
              Importer la liste des élèves (Massar)
            </h3>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="rounded-lg p-1 text-[#64748B] transition hover:bg-[#F1F5F9]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) readFile(e.target.files[0]);
            }}
          />

          {!result && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
              }}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
                dragOver
                  ? "border-[#0D9488] bg-[#F0FDFA]"
                  : "border-[#CBD5E1] bg-white hover:border-[#0D9488] hover:bg-[#F0FDFA]/60"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F0FDFA] text-[#0D9488]">
                <Upload className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-[#0C1E3C]">
                {busy ? (
                  "Lecture du fichier…"
                ) : (
                  <>
                    Glisser-déposer le fichier Massar, ou{" "}
                    <span className="text-[#0D9488] underline-offset-2 hover:underline">
                      parcourir
                    </span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) ou <strong>CSV</strong> exporté
                depuis Massar — colonne « Nom » / « النسب » détectée automatiquement
              </p>
            </div>
          )}

          {result?.error && (
            <div className="mt-1">
              <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#B91C1C]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{result.error}</span>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-xs font-semibold text-[#0D9488] hover:underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {result && !result.error && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="truncate rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#475569] ring-1 ring-[#E2E8F0]">
                  📄 {fileName}
                </span>
                <span className="rounded-lg bg-[#F0FDFA] px-2.5 py-1 text-xs font-semibold text-[#0D9488] ring-1 ring-[#0D9488]/20">
                  {result.names.length} élève(s)
                </span>
                {result.colonnes.length > 0 && (
                  <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B] ring-1 ring-[#E2E8F0]">
                    colonne : {result.colonnes.join(" + ")}
                  </span>
                )}
                {result.ignored > 0 && (
                  <span className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#64748B] ring-1 ring-[#E2E8F0]">
                    {result.ignored} ignorée(s)
                  </span>
                )}
              </div>

              <div className="max-h-56 overflow-auto rounded-xl border border-[#E2E8F0] bg-white">
                <ol className="divide-y divide-[#F1F5F9] text-sm">
                  {result.names.map((n, i) => (
                    <li key={i} className="flex gap-2 px-3 py-1.5">
                      <span className="w-6 text-right text-[#94A3B8]">{i + 1}.</span>
                      <span className="font-medium text-[#0C1E3C]">{n}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={apply}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0D9488]/25 transition hover:brightness-105"
                >
                  <Upload className="h-4 w-4" />
                  Remplir la grille ({result.names.length})
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-[#F1F5F9]"
                >
                  <X className="h-4 w-4" /> Annuler
                </button>
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Les noms remplacent la liste actuelle. Les résultats des 6 tests se saisissent
                ensuite directement dans la grille.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
