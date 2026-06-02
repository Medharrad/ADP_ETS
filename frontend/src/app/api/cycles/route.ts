import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { createCycle, getClassOwned, listRecentCycles } from "@/lib/server/repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  return Response.json({ cycles: await listRecentCycles(auth.id) });
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    class_id?: number;
    diagnostic_id?: number | null;
    axes?: number[];
    n_seances?: number;
    plan?: unknown;
  };

  const classId = Number(body.class_id);
  if (!classId || !(await getClassOwned(auth.id, classId))) {
    return jsonError("Classe introuvable", 404);
  }
  if (!Array.isArray(body.axes) || body.axes.length === 0) {
    return jsonError("Axes requis", 400);
  }
  if (!body.n_seances || !body.plan) {
    return jsonError("Paramètres du cycle incomplets", 400);
  }

  const cycle = await createCycle(
    classId,
    body.diagnostic_id ?? null,
    body.axes.map(Number),
    Number(body.n_seances),
    body.plan,
  );
  return Response.json({ cycle }, { status: 201 });
}
