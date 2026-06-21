import { get } from "@/lib/server/db";
import { getAuthUser, jsonError, unauthorized } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return unauthorized();

  const row = await get<{ id: number; email: string; created_at: string }>(
    "SELECT id, email, created_at FROM users WHERE id = ?",
    [auth.id],
  );

  if (!row) return jsonError("Utilisateur introuvable", 404);
  return Response.json({
    user: {
      id: row.id,
      email: row.email,
      created_at: row.created_at,
    },
  });
}
