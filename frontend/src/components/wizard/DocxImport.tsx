"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  X,
} from "lucide-react";

import { buildGrilleBlob, parseStudentsDocx, type ParseResult } from "@/lib/docx";

export interface DocxImportProps {
  /** Receives the parsed roster (scores as strings; "" when missing). */
  onImport: (students: { prenom: string; vs: [string, string, string] }[]) => void;
  /** Current class roster (names) — the model download is built from this. */
  roster: { prenom: string }[];
}

const OBS = ["Force", "Souplesse", "Équilibre"] as const;

export function DocxImport({ onImport, roster = [] }: DocxImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const hasRoster = roster.length > 0;

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Veuillez sélectionner un fichier Word (.docx)");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (buf instanceof ArrayBuffer) {
        setResult(await parseStudentsDocx(buf));
      }
      setLoading(false);
    };
    reader.onerror = () => {
      toast.error("Lecture du fichier impossible");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }

  async function downloadModel() {
    if (!hasRoster) {
      toast.error("Ajoutez d'abord la liste des élèves de la classe");
      return;
    }
    setBuilding(true);
    try {
      const blob = await buildGrilleBlob(roster.map((r) => ({ prenom: r.prenom })));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Grille_classe.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Génération du modèle impossible");
    } finally {
      setBuilding(false);
    }
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
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const complete = result?.students.filter((s) => s.complete).length ?? 0;

  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--c-muted2)]">
          <FileText className="h-4 w-4 text-[var(--c-primary)]" />
          Importer la grille d&rsquo;élèves (Word)
        </h3>
        <button
          type="button"
          onClick={downloadModel}
          disabled={building}
          aria-disabled={!hasRoster}
          title={
            hasRoster
              ? "Télécharger la grille pré-remplie avec les élèves de la classe"
              : "Ajoutez d'abord la liste des élèves de la classe"
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border bg-[var(--c-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--c-primary)] transition ${
            hasRoster
              ? "border-[var(--c-border)] hover:border-[var(--c-primary)] hover:bg-[var(--c-soft)]"
              : "cursor-not-allowed border-[var(--c-border)] opacity-50"
          }`}
        >
          <Download className="h-3.5 w-3.5" /> {building ? "Génération…" : "Modèle classe"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) readFile(e.target.files[0]);
        }}
      />

      {/* ---------- Dropzone (no file yet) ---------- */}
      {!result && !loading && (
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
              ? "border-[var(--c-primary)] bg-[var(--c-soft)]"
              : "border-[var(--c-border3)] bg-[var(--c-surface)] hover:border-[var(--c-primary)] hover:bg-[var(--c-soft)]/50"
          }`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--c-soft)] text-[var(--c-primary)]">
            <Upload className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-[var(--c-ink)]">
            Glisser-déposer la grille <strong>.docx</strong> remplie, ou{" "}
            <span className="text-[var(--c-primary)] underline-offset-2 hover:underline">parcourir</span>
          </p>
          <p className="mt-1 text-xs text-[var(--c-muted)]">
            Colonnes lues : <strong>NOM PRÉNOM · Force · Souplesse · Équilibre</strong> — notes 0
            à 10 saisies dans chaque case
          </p>
        </div>
      )}

      {/* ---------- Loading ---------- */}
      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-3 text-sm text-[var(--c-muted2)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-border3)] border-t-[var(--c-primary)]" />
          Lecture de {fileName || "la grille"}…
        </div>
      )}

      {/* ---------- Parse error ---------- */}
      {result?.error && (
        <div className="mt-1">
          <div className="flex items-start gap-2 rounded-xl border border-[var(--c-danger-border)] bg-[var(--c-danger-bg)] px-3 py-2.5 text-sm text-[var(--c-danger-ink)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{result.error}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs font-semibold text-[var(--c-primary)] hover:underline"
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
            <span className="truncate rounded-lg bg-[var(--c-surface)] px-2.5 py-1 text-xs font-medium text-[var(--c-muted2)] ring-1 ring-[var(--c-border)]">
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
            <div className="flex items-center gap-2 rounded-xl border border-[var(--c-warn-border)] bg-[var(--c-warn-bg)] px-3 py-2.5 text-sm text-[var(--c-warn-deep)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Aucun élève valide trouvé dans le document.
            </div>
          ) : (
            <div className="max-h-64 overflow-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)]">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-[var(--c-border2)] text-xs text-[var(--c-muted2)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Nom / Prénom</th>
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
                    <tr key={i} className="border-t border-[var(--c-border2)]">
                      <td className="px-3 py-1.5 font-medium text-[var(--c-ink)]">{s.prenom}</td>
                      {s.vs.map((v, k) => (
                        <td
                          key={k}
                          className={`px-2 py-1.5 text-center tabular-nums ${
                            v === null ? "text-[var(--c-warn)]" : "text-[var(--c-ink)]"
                          }`}
                        >
                          {v === null ? "—" : v}
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        {s.complete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--c-success)]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complet
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--c-warn-ink)]"
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[var(--c-primary)]/25 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              <Upload className="h-4 w-4" />
              Importer {result.students.length > 0 ? result.students.length : ""} élève
              {result.students.length > 1 ? "s" : ""}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm font-semibold text-[var(--c-muted)] transition hover:bg-[var(--c-border2)]"
            >
              <X className="h-4 w-4" /> Annuler
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--c-muted)]">
            Les élèves sont ajoutés à la liste ci-dessus. Les notes manquantes pourront être
            complétées à la main avant l&rsquo;analyse.
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
    primary: "bg-[var(--c-soft)] text-[var(--c-primary)] ring-[var(--c-primary)]/20",
    green: "bg-[var(--c-success-bg)] text-[var(--c-success)] ring-[var(--c-success)]/20",
    amber: "bg-[var(--c-warn-bg)] text-[var(--c-warn-ink)] ring-[var(--c-warn)]/25",
    muted: "bg-[var(--c-border2)] text-[var(--c-muted)] ring-[var(--c-border)]",
  };
  return (
    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${styles[tone]}`}>
      {children}
    </span>
  );
}
