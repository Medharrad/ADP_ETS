"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown, Plus, Save, Trash2 } from "lucide-react";

import { saveRoster, type Genre, type Student } from "@/lib/api";
import { generateGrilleDocx } from "@/lib/docx";

interface Row {
  key: number;
  id?: number;
  prenom: string;
  genre: Genre;
}

export interface RosterManagerProps {
  classId: number;
  className: string;
  students: Student[];
  /** called after a successful save so the parent can refresh */
  onSaved?: () => void;
}

export function RosterManager({ classId, className, students, onSaved }: RosterManagerProps) {
  // Stable row keys: assigned by index at seed time, and from a counter
  // (mutated only in handlers) for rows added afterwards.
  const seed = (list: Student[]): Row[] =>
    (list.length ? list : [{ id: undefined, prenom: "", genre: null } as Partial<Student>]).map(
      (s, i) => ({ key: i, id: s.id, prenom: s.prenom ?? "", genre: (s.genre as Genre) ?? null }),
    );

  const keyRef = useRef(Math.max(students.length, 1));
  // Seeded once from the initial (already-loaded) roster; local state is the
  // source of truth while editing. save() re-seeds with server-assigned ids.
  const [rows, setRows] = useState<Row[]>(() => seed(students));
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  function patch(key: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  }
  function addRow() {
    const key = keyRef.current++;
    setRows((rs) => [...rs, { key, id: undefined, prenom: "", genre: null }]);
  }
  function removeRow(key: number) {
    const fallbackKey = keyRef.current++;
    setRows((rs) => {
      const next = rs.filter((r) => r.key !== key);
      return next.length
        ? next
        : [{ key: fallbackKey, id: undefined, prenom: "", genre: null }];
    });
  }

  const filled = rows.filter((r) => r.prenom.trim());
  const nbG = filled.filter((r) => r.genre === "G").length;
  const nbF = filled.filter((r) => r.genre === "F").length;

  async function save() {
    setSaving(true);
    try {
      const res = await saveRoster(
        classId,
        filled.map((r) => ({ id: r.id, prenom: r.prenom.trim(), genre: r.genre })),
      );
      // Re-seed with server-assigned ids so a follow-up save updates (not
      // duplicates) the newly-created students.
      keyRef.current = Math.max(res.students.length, 1);
      setRows(seed(res.students));
      toast.success(`Liste enregistrée — ${filled.length} élève(s)`);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function generate() {
    if (filled.length === 0) {
      toast.error("Ajoutez au moins un élève à la liste");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/Default_Grille.docx");
      if (!res.ok) throw new Error("Modèle introuvable");
      const buf = await res.arrayBuffer();
      const blob = await generateGrilleDocx(
        buf,
        filled.map((r) => ({ prenom: r.prenom.trim() })),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Grille_${className.replace(/[^\p{L}\p{N}_-]+/gu, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Grille générée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-lg">Liste de classe</h2>
        <span className="text-xs text-[#64748B]">
          {filled.length} élève(s) · {nbG} G · {nbF} F
        </span>
      </div>

      <div className="max-h-[420px] space-y-1.5 overflow-auto pr-1">
        {rows.map((r, i) => (
          <div key={r.key} className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right text-xs text-[#94A3B8]">{i + 1}.</span>
            <input
              value={r.prenom}
              onChange={(e) => patch(r.key, { prenom: e.target.value })}
              placeholder="Nom Prénom"
              className="min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[#2563EB]"
            />
            <select
              value={r.genre ?? ""}
              onChange={(e) => patch(r.key, { genre: (e.target.value || null) as Genre })}
              className="shrink-0 rounded-lg border border-[#E2E8F0] bg-white px-1.5 py-1.5 text-sm outline-none focus:border-[#2563EB]"
              title="Sexe"
            >
              <option value="">—</option>
              <option value="G">G</option>
              <option value="F">F</option>
            </select>
            <button
              type="button"
              onClick={() => removeRow(r.key)}
              className="shrink-0 rounded-lg p-1.5 text-[#94A3B8] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] px-2.5 py-1.5 text-xs font-semibold text-[#475569] transition hover:border-[#2563EB] hover:text-[#2563EB]"
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un élève
      </button>

      <div className="mt-3 flex flex-col gap-2 border-t border-[#F1F5F9] pt-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer la liste"}
        </button>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          aria-disabled={filled.length === 0}
          title={filled.length === 0 ? "Ajoutez d'abord des élèves à la liste" : undefined}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#2563EB]/30 bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2563EB] transition disabled:opacity-50 ${
            filled.length === 0
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-[#DBEAFE]"
          }`}
        >
          <FileDown className="h-4 w-4" />
          {generating ? "Génération…" : "Générer la grille (.docx)"}
        </button>
        <p className="text-xs text-[#64748B]">
          La grille Word reprend les noms de la classe — à imprimer, noter à la main, puis
          réimporter dans l&rsquo;évaluation.
        </p>
      </div>
    </div>
  );
}
