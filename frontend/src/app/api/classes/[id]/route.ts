import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import {
  deleteClass,
  getClassOwned,
  getScores,
  getStudents,
  listCycles,
  listDiagnostics,
  updateClass,
} from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  const klass = await getClassOwned(auth.id, classId);
  if (!klass) return jsonError("Classe introuvable", 404);

  const diags = await listDiagnostics(classId);
  const diagnostics = await Promise.all(
    diags.map(async (d) => ({ ...d, scores: await getScores(d.id) })),
  );

  return Response.json({
    class: klass,
    students: await getStudents(classId),
    diagnostics,
    cycles: await listCycles(classId),
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  if (!(await getClassOwned(auth.id, classId))) return jsonError("Classe introuvable", 404);

  const { nom, niveau } = (await request.json().catch(() => ({}))) as {
    nom?: string;
    niveau?: string;
  };
  if (!nom || !nom.trim()) return jsonError("Le nom de la classe est requis", 400);

  const updated = await updateClass(auth.id, classId, nom.trim(), niveau?.trim() || null);
  return Response.json({ class: updated });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  if (!(await getClassOwned(auth.id, classId))) return jsonError("Classe introuvable", 404);
  await deleteClass(auth.id, classId);
  return Response.json({ ok: true });
}
