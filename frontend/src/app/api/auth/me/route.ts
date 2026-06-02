import { db } from "@/lib/server/db";
import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const row = db
    .prepare("SELECT id, email, created_at, (anthropic_key_enc IS NOT NULL) AS has_key FROM users WHERE id = ?")
    .get(auth.id) as
    | { id: number; email: string; created_at: string; has_key: number }
    | undefined;

  if (!row) return jsonError("Utilisateur introuvable", 404);
  return Response.json({
    user: {
      id: row.id,
      email: row.email,
      created_at: row.created_at,
      hasApiKey: !!row.has_key,
    },
  });
}
