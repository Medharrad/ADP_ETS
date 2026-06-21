"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getMe } from "@/lib/api";

export default function SettingsPage() {
  const ready = useRequireAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    getMe()
      .then(({ user }) => setEmail(user.email))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [ready]);

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
      </div>
    </main>
  );
}
