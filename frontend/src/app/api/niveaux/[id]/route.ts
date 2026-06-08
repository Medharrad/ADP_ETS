import { getAuthUser, unauthorized } from "@/lib/server/auth";
import { deleteNiveau } from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;

  await deleteNiveau(auth.id, Number(id));
  return Response.json({ ok: true });
}
