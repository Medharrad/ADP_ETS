"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { GrilleObservation } from "@/components/grille/GrilleObservation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getClass, type ClassDetail } from "@/lib/api";

export default function GrillePage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classId = Number(params.id);

  const [data, setData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    getClass(classId)
      .then(setData)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Classe introuvable");
        router.replace("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [ready, classId, router]);

  if (!ready || loading || !data) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <p className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-[#64748B]">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />
      <div className="no-print mx-auto max-w-[1400px] px-4 pt-4">
        <Link href={`/classes/${classId}`} className="text-xs text-[#64748B] hover:underline">
          ← {data.class.nom}
        </Link>
      </div>
      <GrilleObservation
        classMeta={{ nom: data.class.nom, niveau: data.class.niveau }}
        initialNames={data.students.map((s) => s.prenom)}
      />
    </main>
  );
}
