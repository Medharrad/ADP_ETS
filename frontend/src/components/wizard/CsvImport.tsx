"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import { buildTemplateCsv, parseStudentsCsv, type ParseResult } from "@/lib/csv";

export interface CsvImportProps {
  /** Receives the parsed roster (scores as strings; "" when missing). */
  onImport: (students: { prenom: string; vs: [string, string, string] }[]) => void;
}

const OBS = ["Force", "Souplesse", "Équilibre"] as const;

export function CsvImport({ onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);

  function readFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setResult(parseStudentsCsv(String(e.target?.result ?? "")));
    reader.onerror = () => toast.error("Lecture du fichier impossible");
    reader.readAsText(file, "UTF-8");
  }

  function downloadTemplate() {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_eleves_ADP-RM.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function apply() {
    if (!result) return;
    const students = result.students.map((s) => ({
      prenom: s.prenom,
      vs: s.vs.map((v) => (v === null ? "" : String(v))) as [string, string, string],
    }));
    onImport(students);
    toast.success(
      `${students.length} élève${students.length > 1 ? "s" : ""} importé${
        students.length > 1 ? "s" : ""
      }`,
    );
    reset();
  }

  function reset() {
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const complete = result?.students.filter((s) => s.complete).length ?? 0;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#475569]">
          <FileSpreadsheet className="h-4 w-4 text-[#2563EB]" />
          Importer une liste d&rsquo;élèves (CSV)
        </h3>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:border-[#2563EB] hover:bg-[#EFF6FF]"
        >
          <Download className="h-3.5 w-3.5" /> Modèle
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) readFile(e.target.files[0]);
        }}
      />

      {/* ---------- Dropzone (no file yet) ---------- */}
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
              ? "border-[#2563EB] bg-[#EFF6FF]"
              : "border-[#CBD5E1] bg-white hover:border-[#2563EB] hover:bg-[#EFF6FF]/50"
          }`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
            <Upload className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-[#0C1E3C]">
            Glisser-déposer un fichier CSV, ou{" "}
            <span className="text-[#2563EB] underline-offset-2 hover:underline">parcourir</span>
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Colonnes : <strong>Prénom · Force · Souplesse · Équilibre</strong> — scores 0–10 ou
            codes métier (FO~ · SO− · EQ+)
          </p>
        </div>
      )}

      {/* ---------- Parse error ---------- */}
      {result?.error && (
        <div className="mt-1">
          <div className="flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#B91C1C]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.error}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ---------- Preview ---------- */}
      {result && !result.error && (
        <div>
          {/* summary */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="truncate rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#475569] ring-1 ring-[#E2E8F0]">
              📄 {fileName}
            </span>
            <Chip tone="primary">{result.students.length} élève(s)</Chip>
            <Chip tone="green">{complete} complet(s)</Chip>
            {result.students.length - complete > 0 && (
              <Chip tone="amber">{result.students.length - complete} partiel(s)</Chip>
            )}
            {result.ignored > 0 && <Chip tone="muted">{result.ignored} ignorée(s)</Chip>}
          </div>

          {result.students.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-sm text-[#92400E]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Aucun élève valide trouvé dans le fichier.
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-xl border border-[#E2E8F0] bg-white">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-[#F1F5F9] text-xs text-[#475569]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Prénom</th>
                    {OBS.map((o) => (
                      <th key={o} className="px-2 py-2 text-center font-semibold">
                        {o}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {result.students.map((s, i) => (
                    <tr key={i} className="border-t border-[#F1F5F9]">
                      <td className="px-3 py-1.5 font-medium text-[#0C1E3C]">{s.prenom}</td>
                      {s.vs.map((v, k) => (
                        <td
                          key={k}
                          className={`px-2 py-1.5 text-center tabular-nums ${
                            v === null ? "text-[#F59E0B]" : "text-[#0C1E3C]"
                          }`}
                        >
                          {v === null ? "—" : v}
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        {s.complete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complet
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#B45309]"
                            title={s.issues.join(", ")}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" /> Partiel
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={result.students.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              Importer {result.students.length > 0 ? result.students.length : ""} élève
              {result.students.length > 1 ? "s" : ""}
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
            Les élèves sont ajoutés à la liste ci-dessus. Les scores manquants pourront être
            complétés à la main avant l&rsquo;analyse.
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "primary" | "green" | "amber" | "muted";
}) {
  const styles: Record<typeof tone, string> = {
    primary: "bg-[#EFF6FF] text-[#2563EB] ring-[#2563EB]/20",
    green: "bg-[#ECFDF5] text-[#16A34A] ring-[#16A34A]/20",
    amber: "bg-[#FFFBEB] text-[#B45309] ring-[#F59E0B]/25",
    muted: "bg-[#F1F5F9] text-[#64748B] ring-[#E2E8F0]",
  };
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
