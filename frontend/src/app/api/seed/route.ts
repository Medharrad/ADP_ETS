import { getAuthUser, unauthorized } from "@/lib/server/auth";
import {
  createClass,
  createCycle,
  createDiagnostic,
  listClasses,
} from "@/lib/server/repo";
import { analyser, genPlan, rankAxes } from "@/lib/calc";

export const runtime = "nodejs";

// Creates one realistic demo class (roster + two timestamped diagnostics showing
// progress + a generated cycle) for the current teacher. Idempotent-ish: skips
// if the teacher already has classes.

const ROSTER_S1: Array<[string, number, number, number]> = [
  ["Sara", 9, 8, 7],
  ["Imane", 6, 5, 6],
  ["Yacine", 3, 2, 4],
  ["Nour", 2, 3, 2],
  ["Mehdi", 5, 4, 5],
  ["Salma", 7, 6, 8],
  ["Adam", 4, 3, 3],
  ["Lina", 8, 7, 6],
];

// S3: same roster, generally improved.
const ROSTER_S3: Array<[string, number, number, number]> = [
  ["Sara", 9, 9, 8],
  ["Imane", 7, 6, 7],
  ["Yacine", 5, 4, 5],
  ["Nour", 4, 4, 3],
  ["Mehdi", 6, 6, 6],
  ["Salma", 8, 7, 9],
  ["Adam", 5, 5, 4],
  ["Lina", 9, 8, 7],
];

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  if (((await listClasses(auth.id)) as unknown[]).length > 0) {
    return Response.json({ created: false, reason: "Vous avez déjà des classes." });
  }

  const klass = await createClass(auth.id, "Tronc commun — Démo RM & Souplesse", "Tronc commun");

  const toStudents = (rows: typeof ROSTER_S1) =>
    rows.map(([prenom, a, b, c]) => ({ prenom, vs: [a, b, c] as [number, number, number] }));

  await createDiagnostic(klass.id, "S1", "2026-03-10", toStudents(ROSTER_S1));
  const diagS3 = await createDiagnostic(klass.id, "S3", "2026-04-21", toStudents(ROSTER_S3));

  // Build a real cycle from the latest diagnostic.
  const analysis = analyser(toStudents(ROSTER_S3));
  const topAxes = rankAxes(analysis.results)
    .slice(0, 3)
    .map((s) => s.axe.id);
  const plan = genPlan(topAxes, 8, analysis);
  await createCycle(klass.id, diagS3.id, topAxes, 8, plan);

  return Response.json({ created: true, classId: klass.id });
}
