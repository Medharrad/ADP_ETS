import { getToken } from "./auth";

// API now lives in the same Next.js app (route handlers under /api), so the
// base is same-origin by default. An override is still honoured for flexibility.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export interface User {
  id: number;
  email: string;
  created_at?: string;
  hasApiKey?: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Échec de la requête (${res.status})`);
  }
  return data as T;
}

// -- auth ---------------------------------------------------------------------

export function register(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return apiFetch<{ user: User }>("/api/auth/me");
}

// -- classes ------------------------------------------------------------------

export interface ClassSummary {
  id: number;
  nom: string;
  niveau: string | null;
  created_at: string;
  students: number;
  diagnostics: number;
  cycles: number;
  last_diagnostic: string | null;
}

export interface Student {
  id: number;
  prenom: string;
  ordre: number;
}

export interface Score {
  student_id: number;
  prenom: string;
  obs1: number;
  obs2: number;
  obs3: number;
}

export interface Diagnostic {
  id: number;
  class_id: number;
  label: string | null;
  date: string | null;
  created_at: string;
  scores: Score[];
}

export interface Cycle {
  id: number;
  class_id: number;
  diagnostic_id: number | null;
  axes_json: string;
  n_seances: number;
  plan_json: string;
  edited: number;
  created_at: string;
}

export interface ClassDetail {
  class: ClassSummary;
  students: Student[];
  diagnostics: Diagnostic[];
  cycles: Cycle[];
}

export function listClasses() {
  return apiFetch<{ classes: ClassSummary[] }>("/api/classes");
}

export function createClass(nom: string, niveau?: string) {
  return apiFetch<{ class: ClassSummary }>("/api/classes", {
    method: "POST",
    body: JSON.stringify({ nom, niveau }),
  });
}

export function getClass(id: number) {
  return apiFetch<ClassDetail>(`/api/classes/${id}`);
}

export function updateClass(id: number, nom: string, niveau?: string) {
  return apiFetch<{ class: ClassSummary }>(`/api/classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ nom, niveau }),
  });
}

export function deleteClass(id: number) {
  return apiFetch<{ ok: true }>(`/api/classes/${id}`, { method: "DELETE" });
}

// -- niveaux (custom grade levels) --------------------------------------------

export interface Niveau {
  id: number;
  label: string;
  ordre: number;
}

export function listNiveaux() {
  return apiFetch<{ niveaux: Niveau[] }>("/api/niveaux");
}

export function createNiveau(label: string) {
  return apiFetch<{ niveau: Niveau }>("/api/niveaux", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export function deleteNiveau(id: number) {
  return apiFetch<{ ok: true }>(`/api/niveaux/${id}`, { method: "DELETE" });
}

// -- diagnostics --------------------------------------------------------------

export interface DiagnosticInput {
  prenom: string;
  vs: [number, number, number];
}

export function createDiagnostic(
  classId: number,
  payload: { label?: string; date?: string; students: DiagnosticInput[] },
) {
  return apiFetch<{ diagnostic: Diagnostic }>(`/api/classes/${classId}/diagnostics`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDiagnostic(id: number) {
  return apiFetch<{ diagnostic: Diagnostic }>(`/api/diagnostics/${id}`);
}

// -- cycles -------------------------------------------------------------------

export interface RecentCycle {
  id: number;
  class_id: number;
  n_seances: number;
  edited: number;
  created_at: string;
  axes_json: string;
  class_nom: string;
  class_niveau: string | null;
}

export function listRecentCycles() {
  return apiFetch<{ cycles: RecentCycle[] }>("/api/cycles");
}

export function createCycle(payload: {
  class_id: number;
  diagnostic_id?: number | null;
  axes: number[];
  n_seances: number;
  plan: unknown;
}) {
  return apiFetch<{ cycle: Cycle }>("/api/cycles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCycle(id: number) {
  return apiFetch<{ cycle: Cycle }>(`/api/cycles/${id}`);
}

export function updateCyclePlan(id: number, plan: unknown) {
  return apiFetch<{ cycle: Cycle }>(`/api/cycles/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}

export function deleteCycle(id: number) {
  return apiFetch<{ ok: true }>(`/api/cycles/${id}`, { method: "DELETE" });
}

// -- demo data ----------------------------------------------------------------

export function seedDemo() {
  return apiFetch<{ created: boolean; classId?: number; reason?: string }>("/api/seed", {
    method: "POST",
  });
}

// -- settings (Anthropic API key) ---------------------------------------------

export function setApiKey(apiKey: string) {
  return apiFetch<{ ok: true; hasApiKey: boolean }>("/api/settings/key", {
    method: "POST",
    body: JSON.stringify({ apiKey }),
  });
}

export function deleteApiKey() {
  return apiFetch<{ ok: true; hasApiKey: boolean }>("/api/settings/key", {
    method: "DELETE",
  });
}

// -- AI assist ----------------------------------------------------------------

export function aiSummary(payload: {
  classe?: string;
  niveau?: string | null;
  total: number;
  counts: { A: number; B: number; C: number };
  moyClasse: number;
  moyObservables: [number, number, number];
  decision: string;
}) {
  return apiFetch<{ text: string }>("/api/ai/summary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function aiJustify(payload: {
  axes: { id: number; titre: string; pertinence: number }[];
  counts: { A: number; B: number; C: number };
  total: number;
}) {
  return apiFetch<{ text: string }>("/api/ai/justify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function aiEnrich(payload: {
  axeTitre: string;
  niveau: "A" | "B" | "C";
  consigne: string;
  critere: string;
}) {
  return apiFetch<{ text: string }>("/api/ai/enrich", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
