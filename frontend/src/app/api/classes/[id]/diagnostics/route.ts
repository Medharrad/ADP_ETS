import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import {
  createDiagnostic,
  getClassOwned,
  getScores,
  listDiagnostics,
  type DiagnosticInput,
} from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  if (!(await getClassOwned(auth.id, classId))) return jsonError("Classe introuvable", 404);

  const diags = await listDiagnostics(classId);
  const diagnostics = await Promise.all(
    diags.map(async (d) => ({ ...d, scores: await getScores(d.id) })),
  );
  return Response.json({ diagnostics });
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  if (!(await getClassOwned(auth.id, classId))) return jsonError("Classe introuvable", 404);

  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
    date?: string;
    students?: Array<{ prenom?: string; vs?: number[] }>;
  };

  const students: DiagnosticInput[] = [];
  for (const s of body.students ?? []) {
    const prenom = (s.prenom ?? "").trim();
    const vs = s.vs ?? [];
    if (!prenom || vs.length !== 3) continue;
    const nums = vs.map(Number);
    if (nums.some((n) => isNaN(n) || n < 0 || n > 10)) {
      return jsonError(`Scores invalides pour « ${prenom} » (0–10 requis)`, 400);
    }
    students.push({ prenom, vs: [nums[0], nums[1], nums[2]] });
  }
  if (students.length === 0) return jsonError("Aucun élève valide à enregistrer", 400);

  const diag = await createDiagnostic(
    classId,
    body.label?.trim() || null,
    body.date?.trim() || null,
    students,
  );
  return Response.json(
    { diagnostic: { ...diag, scores: await getScores(diag.id) } },
    { status: 201 },
  );
}
