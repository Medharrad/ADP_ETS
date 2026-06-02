import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { getDiagnosticOwned, getScores } from "@/lib/server/repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  const { id } = await ctx.params;
  const diagId = Number(id);

  const diag = await getDiagnosticOwned(auth.id, diagId);
  if (!diag) return jsonError("Diagnostic introuvable", 404);

  return Response.json({ diagnostic: { ...diag, scores: await getScores(diag.id) } });
}
