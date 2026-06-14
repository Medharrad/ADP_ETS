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
      <main className="min-h-screen bg-[var(--c-bg)]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[var(--c-muted)]">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-ink)]">
      <AppHeader />
      <div className="mx-auto max-w-[720px] px-4 py-6">
        <h1 className="font-serif text-2xl">Paramètres</h1>

        <section className="mt-5 rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-surface)] p-5 shadow-sm">
          <h2 className="font-serif text-lg">Compte</h2>
          <p className="mt-1 text-sm text-[var(--c-muted)]">
            Connecté en tant que <span className="font-medium text-[var(--c-ink)]">{email}</span>
          </p>
        </section>

        <section className="mt-5 rounded-xl border border-[var(--c-primary)]/20 bg-[var(--c-surface)] p-5 shadow-sm">
          <h2 className="font-serif text-lg">Assistance IA (Anthropic)</h2>
          <p className="mt-1 text-sm text-[var(--c-muted)]">
            Les fonctions d&rsquo;assistance IA (résumé, justification, enrichissement) utilisent
            <strong> votre propre clé API Anthropic</strong>. Elle est chiffrée au repos et n&rsquo;est
            jamais renvoyée au navigateur. Obtenez une clé sur{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--c-primary)] hover:underline"
            >
              console.anthropic.com
            </a>
            .
          </p>

          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                hasKey
                  ? "bg-[var(--c-success-bg)] text-[var(--c-success-ink)]"
                  : "bg-[var(--c-warn-bg)] text-[var(--c-warn-deep)]"
              }`}
            >
              {hasKey ? "✓ Clé configurée" : "Aucune clé configurée"}
            </span>
          </div>

          <form onSubmit={save} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[240px]">
              <label className="mb-1 block text-xs font-bold text-[var(--c-muted)]">
                {hasKey ? "Remplacer la clé" : "Clé API"}
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-…"
                autoComplete="off"
                className="w-full rounded-md border border-[var(--c-border)] px-3 py-2 text-sm outline-none focus:border-[var(--c-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !keyInput.trim()}
              className="rounded-xl bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[var(--c-primary)]/25 transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              Enregistrer
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-xl border border-[var(--c-danger-border)] px-4 py-2 text-sm font-bold text-[var(--c-danger)] transition hover:bg-[var(--c-danger-bg)] disabled:opacity-40"
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
