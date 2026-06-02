import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";
import { encryptSecret } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const { apiKey } = (await request.json().catch(() => ({}))) as { apiKey?: string };
  if (!apiKey || !apiKey.trim()) return jsonError("Clé API requise", 400);
  if (!apiKey.startsWith("sk-ant-")) {
    return jsonError("Format de clé Anthropic invalide (doit commencer par « sk-ant- »)", 400);
  }

  try {
    db.prepare("UPDATE users SET anthropic_key_enc = ? WHERE id = ?").run(
      encryptSecret(apiKey.trim()),
      auth.id,
    );
  } catch {
    return jsonError("Chiffrement indisponible (APP_ENCRYPTION_KEY manquante)", 500);
  }
  return Response.json({ ok: true, hasApiKey: true });
}

export async function DELETE(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();
  db.prepare("UPDATE users SET anthropic_key_enc = NULL WHERE id = ?").run(auth.id);
  return Response.json({ ok: true, hasApiKey: false });
}
