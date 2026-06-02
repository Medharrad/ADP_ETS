"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { OutilWizard } from "@/components/wizard/OutilWizard";
import { AppHeader } from "@/components/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import {
  createCycle,
  createDiagnostic,
  getClass,
  getMe,
  type ClassDetail,
  type DiagnosticInput,
} from "@/lib/api";

export default function EvaluatePage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classId = Number(params.id);

  const [data, setData] = useState<ClassDetail | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastDiagId = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    getMe()
      .then(({ user }) => setAiEnabled(!!user.hasApiKey))
      .catch(() => setAiEnabled(false));
    getClass(classId)
      .then(setData)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Classe introuvable");
        router.replace("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [ready, classId, router]);

  if (!ready || loading || !data) return null;

  const today = new Date().toISOString().split("T")[0];
  const nextLabel = `S${data.diagnostics.length + 1}`;

  async function handleSaveDiagnostic(students: DiagnosticInput[]) {
    const { diagnostic } = await createDiagnostic(classId, {
      label: nextLabel,
      date: today,
      students,
    });
    lastDiagId.current = diagnostic.id;
  }

  async function handleSaveCycle(payload: {
    axes: number[];
    nseances: number;
    plan: unknown;
  }) {
    const { cycle } = await createCycle({
      class_id: classId,
      diagnostic_id: lastDiagId.current,
      axes: payload.axes,
      n_seances: payload.nseances,
      plan: payload.plan,
    });
    toast.success("Cycle enregistré");
    router.push(`/classes/${classId}/cycle/${cycle.id}`);
  }

  return (
    <>
      <AppHeader />
      <OutilWizard
        classMeta={{ nom: data.class.nom, niveau: data.class.niveau }}
        initialRoster={data.students.map((s) => ({ prenom: s.prenom }))}
        onSaveDiagnostic={handleSaveDiagnostic}
        onSaveCycle={handleSaveCycle}
        enableAi={aiEnabled}
      />
    </>
  );
}
