"use client";

// =============================================================================
// GrilleObservation — fiche d'observation principale (6 tests physiques).
// Reproduit la grille fournie : en-tête (Classe/Date/Séance/Enseignant),
// 6 tests avec saisie du résultat brut + conversion automatique en note /10,
// Total /60, Note /20, BILAN CLASSE, guide de notation, import Massar, impression.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Download, BookOpen, Trash2 } from "lucide-react";

import {
  TESTS,
  TOTAL_MAX,
  bilanClasse,
  parseRaw,
  type Test6,
} from "@/lib/grille6";
import { MassarImport } from "./MassarImport";

interface Row {
  id: number;
  nom: string;
  /** résultat brut saisi par test (texte), index 0..5. */
  raws: string[];
}

export interface GrilleObservationProps {
  classMeta?: { nom: string; niveau?: string | null };
  enseignant?: string;
  /** Noms pré-remplis (roster de la classe). */
  initialNames?: string[];
}

let _id = 0;
const nextId = () => ++_id;

function makeRow(nom = ""): Row {
  return { id: nextId(), nom, raws: ["", "", "", "", "", ""] };
}

function noteColor(note: number | null): string {
  if (note === null) return "text-[#94A3B8]";
  if (note >= 8) return "text-[#15803D]";
  if (note >= 5) return "text-[#B45309]";
  return "text-[#B91C1C]";
}

export function GrilleObservation({
  classMeta,
  enseignant = "",
  initialNames = [],
}: GrilleObservationProps) {
  const [classe, setClasse] = useState(classMeta?.nom ?? "");
  const [date, setDate] = useState("");
  const [seance, setSeance] = useState("");
  const [seanceTotal, setSeanceTotal] = useState("");
  const [prof, setProf] = useState(enseignant);
  const [showGuide, setShowGuide] = useState(false);

  const [rows, setRows] = useState<Row[]>(() => {
    if (initialNames.length) return initialNames.map((n) => makeRow(n));
    return Array.from({ length: 5 }, () => makeRow());
  });

  // Date du jour côté client (évite un écart d'hydratation SSR/CSR).
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  // -- édition des lignes -----------------------------------------------------
  const addRows = (n: number) =>
    setRows((rs) => [...rs, ...Array.from({ length: n }, () => makeRow())]);
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const setNom = (id: number, v: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, nom: v } : r)));
  const setRaw = (id: number, i: number, v: string) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const raws = [...r.raws];
        raws[i] = v;
        return { ...r, raws };
      }),
    );

  function importMassar(names: string[]) {
    setRows(names.length ? names.map((n) => makeRow(n)) : [makeRow()]);
  }

  // -- calculs ----------------------------------------------------------------
  const bilan = useMemo(
    () => bilanClasse(rows.map((r) => r.raws.map(parseRaw))),
    [rows],
  );
  const results = bilan.lignes;

  // -- export CSV -------------------------------------------------------------
  function exportCsv() {
    const bom = "﻿";
    const head = [
      "N°",
      "Nom Prénom",
      ...TESTS.flatMap((t) => [`${t.code} brut`, `${t.code} /10`]),
      "Total /60",
      "Note /20",
    ].join(";");
    const body = rows
      .map((r, i) => {
        const res = results[i];
        const cells = TESTS.flatMap((t, k) => [r.raws[k] ?? "", res.notes[k] ?? ""]);
        return [
          i + 1,
          r.nom,
          ...cells,
          res.total,
          res.note20.toFixed(2),
        ].join(";");
      })
      .join("\n");
    const moy = [
      "",
      "BILAN CLASSE",
      ...bilan.moyTests.flatMap((m) => ["", m.toFixed(1)]),
      bilan.moyTotal.toFixed(1),
      bilan.moyNote20.toFixed(2),
    ].join(";");
    const blob = new Blob([bom + head + "\n" + body + "\n" + moy], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grille_6Tests_${classe || "classe"}_${date || ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===========================================================================
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 text-[#0C1E3C]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .grille-print { box-shadow: none !important; border: none !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}</style>

      {/* En-tête */}
      <div className="grille-print rounded-2xl border border-[#0D2B5E]/15 bg-white p-5 shadow-sm">
        <div className="rounded-xl bg-[#0D2B5E] px-5 py-3 text-center text-white">
          <h1 className="font-serif text-xl font-bold tracking-wide">
            GRILLE D&rsquo;OBSERVATION — 6 TESTS PHYSIQUES
          </h1>
          <p className="mt-1 text-xs text-white/80">
            Écrire le résultat brut (sec / reps), la note /10 est calculée automatiquement · Total
            /60 · Note /20 = Total ÷ 60 × 20
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Classe">
            <input
              value={classe}
              onChange={(e) => setClasse(e.target.value)}
              placeholder="Ex : 3ème B"
              className="input-grille"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-grille"
            />
          </Field>
          <Field label="Séance">
            <div className="flex items-center gap-1">
              <input
                value={seance}
                onChange={(e) => setSeance(e.target.value)}
                placeholder="—"
                className="input-grille w-14 text-center"
              />
              <span className="text-[#64748B]">/</span>
              <input
                value={seanceTotal}
                onChange={(e) => setSeanceTotal(e.target.value)}
                placeholder="—"
                className="input-grille w-14 text-center"
              />
            </div>
          </Field>
          <Field label="Enseignant">
            <input
              value={prof}
              onChange={(e) => setProf(e.target.value)}
              placeholder="Nom de l'enseignant"
              className="input-grille"
            />
          </Field>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="no-print mt-4 flex flex-wrap items-center gap-2">
        <MassarImport onImport={importMassar} />
        <button
          type="button"
          onClick={() => addRows(1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#0C1E3C] transition hover:border-[#0D2B5E]"
        >
          <Plus className="h-4 w-4" /> Élève
        </button>
        <button
          type="button"
          onClick={() => addRows(5)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#0C1E3C] transition hover:border-[#0D2B5E]"
        >
          + 5
        </button>
        <div className="grow" />
        <button
          type="button"
          onClick={() => setShowGuide((g) => !g)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#0C1E3C] transition hover:border-[#0D2B5E]"
        >
          <BookOpen className="h-4 w-4" /> Guide de notation
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#0C1E3C] transition hover:border-[#0D2B5E]"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0D2B5E] to-[#173E7C] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0D2B5E]/25 transition hover:brightness-105"
        >
          <Printer className="h-4 w-4" /> Imprimer
        </button>
      </div>

      {/* Grille */}
      <div className="grille-print mt-4 overflow-x-auto rounded-2xl border border-[#0D2B5E]/15 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0D2B5E] text-white">
              <th className="w-10 border border-[#1E3A6E] px-1 py-2 text-center text-xs">N°</th>
              <th className="min-w-[170px] border border-[#1E3A6E] px-2 py-2 text-left text-xs">
                NOM PRÉNOM
              </th>
              {TESTS.map((t) => (
                <th
                  key={t.code}
                  className="min-w-[88px] border border-[#1E3A6E] px-1 py-2 text-center text-[11px] leading-tight"
                >
                  <div className="font-bold">{t.code}</div>
                  <div className="font-semibold">{shortName(t)}</div>
                  <div className="font-normal text-white/70">({t.unite})</div>
                </th>
              ))}
              <th className="w-16 border border-[#1E3A6E] px-1 py-2 text-center text-[11px]">
                TOTAL
                <br />/60
              </th>
              <th className="w-16 border border-[#1E3A6E] px-1 py-2 text-center text-[11px]">
                NOTE
                <br />/20
              </th>
              <th className="no-print w-8 border border-[#1E3A6E]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const res = results[idx];
              return (
                <tr key={r.id} className="even:bg-[#F8FAFC]">
                  <td className="border border-[#E2E8F0] px-1 py-1 text-center text-[#64748B]">
                    {idx + 1}
                  </td>
                  <td className="border border-[#E2E8F0] px-1 py-1">
                    <input
                      value={r.nom}
                      onChange={(e) => setNom(r.id, e.target.value)}
                      placeholder="Nom Prénom"
                      className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium outline-none focus:border-[#0D2B5E] focus:bg-white"
                    />
                  </td>
                  {TESTS.map((t, k) => (
                    <td key={t.code} className="border border-[#E2E8F0] px-1 py-1 text-center">
                      <input
                        inputMode="decimal"
                        value={r.raws[k]}
                        onChange={(e) => setRaw(r.id, k, e.target.value)}
                        placeholder={t.direct ? "/10" : "brut"}
                        className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-center text-sm outline-none focus:border-[#0D2B5E] focus:bg-white"
                      />
                      <div className={`text-[10px] font-bold ${noteColor(res.notes[k])}`}>
                        {res.notes[k] === null ? "—" : `${res.notes[k]}/10`}
                      </div>
                    </td>
                  ))}
                  <td className="border border-[#E2E8F0] px-1 py-1 text-center font-bold">
                    {res.notes.some((n) => n !== null) ? res.total : "—"}
                  </td>
                  <td className="border border-[#E2E8F0] px-1 py-1 text-center font-bold text-[#0D2B5E]">
                    {res.notes.some((n) => n !== null) ? res.note20.toFixed(1) : "—"}
                  </td>
                  <td className="no-print border border-[#E2E8F0] text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="rounded p-1 text-[#94A3B8] transition hover:text-[#B91C1C]"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* BILAN CLASSE */}
            <tr className="bg-[#EFF4FB] font-bold">
              <td className="border border-[#CBD5E1]" />
              <td className="border border-[#CBD5E1] px-2 py-2 text-[#0D2B5E]">BILAN CLASSE</td>
              {bilan.moyTests.map((m, k) => (
                <td key={k} className="border border-[#CBD5E1] px-1 py-2 text-center text-[#0D2B5E]">
                  {bilan.nbActifs ? m.toFixed(1) : "—"}
                </td>
              ))}
              <td className="border border-[#CBD5E1] px-1 py-2 text-center text-[#0D2B5E]">
                {bilan.nbActifs ? bilan.moyTotal.toFixed(1) : "—"}
              </td>
              <td className="border border-[#CBD5E1] px-1 py-2 text-center text-[#0D2B5E]">
                {bilan.nbActifs ? bilan.moyNote20.toFixed(1) : "—"}
              </td>
              <td className="no-print border border-[#CBD5E1]" />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-[#64748B]">
        {rows.length} élève(s) · {bilan.nbActifs} évalué(s) · Total /60 et Note /20 calculés
        automatiquement à partir du résultat brut.
      </p>

      {showGuide && <GuideNotation />}

      <style jsx global>{`
        .input-grille {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 0.45rem 0.6rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-grille:focus {
          border-color: #0d2b5e;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Nom court du test pour la tête de colonne. */
function shortName(t: Test6): string {
  const map: Record<string, string> = {
    T1: "GAINAGE",
    T2: "MAINTIEN ATR",
    T3: "FERMETURE CARPÉE",
    T4: "MONTER / DESCENDRE",
    T5: "POMPES",
    T6: "SOUPLESSE FERM.",
  };
  return map[t.code] ?? t.nom;
}

// -- Guide de notation (page 2 de la grille) ----------------------------------
function GuideNotation() {
  return (
    <div className="grille-print mt-6 rounded-2xl border border-[#0D2B5E]/15 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-[#0D2B5E]">
        Guide de notation — description des 6 tests
      </h2>
      <p className="mb-4 text-xs text-[#64748B]">
        Lire avant la séance · ligne du haut = note /10 · ligne du bas = résultat brut correspondant.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {TESTS.map((t) => (
          <div key={t.code} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <h3 className="font-bold text-[#0D2B5E]">
              {t.code} — {t.nom} <span className="font-normal text-[#64748B]">({t.unite})</span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#475569]">{t.description}</p>

            {t.direct ? (
              <table className="mt-3 w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D2B5E] text-white">
                    <th className="border border-[#1E3A6E] px-2 py-1 text-left">Critère</th>
                    <th className="border border-[#1E3A6E] px-2 py-1 text-center">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {t.criteres?.map((c) => (
                    <tr key={c.libelle}>
                      <td className="border border-[#E2E8F0] px-2 py-1">{c.libelle}</td>
                      <td className="border border-[#E2E8F0] px-2 py-1 text-center font-semibold">
                        {c.points} pts
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="border border-[#E2E8F0] px-2 py-1">TOTAL (critères atteints)</td>
                    <td className="border border-[#E2E8F0] px-2 py-1 text-center">___ / 10</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-center text-xs">
                  <tbody>
                    <tr className="bg-[#EFF4FB] font-bold text-[#0D2B5E]">
                      {Array.from({ length: 11 }, (_, n) => (
                        <td key={n} className="border border-[#CBD5E1] px-1 py-1">
                          {n}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {t.seuils.map((s, n) => (
                        <td key={n} className="border border-[#E2E8F0] px-1 py-1">
                          {s === null ? "—" : n === 10 ? `≥${s}` : s}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-[#0D2B5E] px-4 py-3 text-sm text-white">
        <strong>Calcul de la note finale :</strong> somme des 6 notes /10 (T1+T2+T3+T4+T5+T6) ={" "}
        Total /{TOTAL_MAX} · Note /20 = Total ÷ {TOTAL_MAX} × 20.
      </div>
    </div>
  );
}
