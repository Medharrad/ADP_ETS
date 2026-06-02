"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { deleteApiKey, getMe, setApiKey } from "@/lib/api";

export default function SettingsPage() {
  const ready = useRequireAuth();
  const [email, setEmail] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getMe()
      .then(({ user }) => {
        setEmail(user.email);
        setHasKey(!!user.hasApiKey);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [ready]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setBusy(true);
    try {
      await setApiKey(keyInput.trim());
      setHasKey(true);
      setKeyInput("");
      toast.success("Clé enregistrée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer votre clé API ?")) return;
    setBusy(true);
    try {
      await deleteApiKey();
      setHasKey(false);
      toast.success("Clé supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[#64748B]">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0C1E3C]">
      <AppHeader />
      <div className="mx-auto max-w-[720px] px-4 py-6">
        <h1 className="font-serif text-2xl">Paramètres</h1>

        <section className="mt-5 rounded-xl border border-[#2563EB]/20 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg">Compte</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Connecté en tant que <span className="font-medium text-[#0C1E3C]">{email}</span>
          </p>
        </section>

        <section className="mt-5 rounded-xl border border-[#2563EB]/20 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg">Assistance IA (Anthropic)</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Les fonctions d&rsquo;assistance IA (résumé, justification, enrichissement) utilisent
            <strong> votre propre clé API Anthropic</strong>. Elle est chiffrée au repos et n&rsquo;est
            jamais renvoyée au navigateur. Obtenez une clé sur{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[#2563EB] hover:underline"
            >
              console.anthropic.com
            </a>
            .
          </p>

          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                hasKey
                  ? "bg-[#E8F5EC] text-[#124A1E]"
                  : "bg-[#FEF3E0] text-[#6B3A00]"
              }`}
            >
              {hasKey ? "✓ Clé configurée" : "Aucune clé configurée"}
            </span>
          </div>

          <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[240px]">
              <label className="mb-1 block text-xs font-bold text-[#64748B]">
                {hasKey ? "Remplacer la clé" : "Clé API"}
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
                className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !keyInput.trim()}
              className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              Enregistrer
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-xl border border-[#FECACA] px-4 py-2 text-sm font-bold text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:opacity-40"
              >
                Supprimer
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
