import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { getClassOwned, setRoster, type RosterInput } from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const classId = Number(id);

  if (!(await getClassOwned(auth.id, classId))) return jsonError("Classe introuvable", 404);

  const body = (await request.json().catch(() => ({}))) as { students?: RosterInput[] };
  if (!Array.isArray(body.students)) return jsonError("Liste d'élèves invalide", 400);

  const students = await setRoster(classId, body.students);
  return Response.json({ students });
}
