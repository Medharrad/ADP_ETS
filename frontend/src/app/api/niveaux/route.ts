import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { createNiveau, listNiveaux } from "@/lib/server/repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  return Response.json({ niveaux: await listNiveaux(auth.id) });
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const { label } = (await request.json().catch(() => ({}))) as { label?: string };
  if (!label || !label.trim()) return jsonError("Le niveau est requis", 400);

  const niveau = await createNiveau(auth.id, label.trim());
  return Response.json({ niveau }, { status: 201 });
}
