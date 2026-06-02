import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { createClass, listClasses } from "@/lib/server/repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  return Response.json({ classes: await listClasses(auth.id) });
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const { nom, niveau } = (await request.json().catch(() => ({}))) as {
    nom?: string;
    niveau?: string;
  };
  if (!nom || !nom.trim()) return jsonError("Le nom de la classe est requis", 400);

  const created = await createClass(auth.id, nom.trim(), niveau?.trim() || null);
  return Response.json({ class: created }, { status: 201 });
}
