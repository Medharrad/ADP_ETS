import { get } from "@/lib/server/db";
import { jsonError, signToken, verifyPassword } from "@/lib/server/auth";

export const runtime = "nodejs";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
}

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return jsonError("E-mail et mot de passe requis", 400);
  }

  const row = await get<UserRow>(
    "SELECT id, email, password_hash FROM users WHERE email = ?",
    [email.toLowerCase()],
  );

  if (!row || !verifyPassword(password, row.password_hash)) {
    return jsonError("E-mail ou mot de passe invalide", 401);
  }

  const user = { id: row.id, email: row.email };
  return Response.json({ token: signToken(user), user });
}
