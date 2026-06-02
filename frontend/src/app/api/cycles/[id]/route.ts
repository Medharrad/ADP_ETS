import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { deleteCycle, getCycleOwned, updateCyclePlan } from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const cycle = await getCycleOwned(auth.id, Number(id));
  if (!cycle) return jsonError("Cycle introuvable", 404);
  return Response.json({ cycle });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const cycle = await getCycleOwned(auth.id, Number(id));
  if (!cycle) return jsonError("Cycle introuvable", 404);

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: unknown };
  if (!plan) return jsonError("Plan requis", 400);

  return Response.json({ cycle: await updateCyclePlan(cycle.id, plan) });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  const cycle = await getCycleOwned(auth.id, Number(id));
  if (!cycle) return jsonError("Cycle introuvable", 404);
  await deleteCycle(cycle.id);
  return Response.json({ ok: true });
}
