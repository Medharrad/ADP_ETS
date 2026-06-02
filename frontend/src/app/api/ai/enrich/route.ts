import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { AiError, getUserApiKey, runEnrich, type EnrichInput } from "@/lib/server/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const key = await getUserApiKey(auth.id);
  if (!key) return jsonError("Ajoutez votre clé API Anthropic dans les paramètres.", 400);

  const body = (await request.json().catch(() => null)) as EnrichInput | null;
  if (!body || !body.axeTitre || !body.niveau) return jsonError("Données manquantes", 400);

  try {
    const text = await runEnrich(key, body);
    return Response.json({ text });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.message, e.status);
    return jsonError("Échec de la génération", 502);
  }
}
