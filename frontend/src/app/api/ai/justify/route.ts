import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { AiError, getUserApiKey, runJustify, type JustifyInput } from "@/lib/server/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const key = await getUserApiKey(auth.id);
  if (!key) return jsonError("Ajoutez votre clé API Anthropic dans les paramètres.", 400);

  const body = (await request.json().catch(() => null)) as JustifyInput | null;
  if (!body || !Array.isArray(body.axes)) return jsonError("Données manquantes", 400);

  try {
    const text = await runJustify(key, body);
    return Response.json({ text });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.message, e.status);
    return jsonError("Échec de la génération", 502);
  }
}
