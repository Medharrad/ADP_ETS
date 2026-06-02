import { db } from "@/lib/server/db";
import { hashPassword, jsonError, signToken } from "@/lib/server/auth";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !EMAIL_RE.test(email)) {
    return jsonError("Une adresse e-mail valide est requise", 400);
  }
  if (!password || password.length < 6) {
    return jsonError("Le mot de passe doit comporter au moins 6 caractères", 400);
  }

  const normalized = email.toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
  if (existing) {
    return jsonError("Cette adresse e-mail est déjà enregistrée", 409);
  }

  const info = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(normalized, hashPassword(password));

  const user = { id: Number(info.lastInsertRowid), email: normalized };
  return Response.json({ token: signToken(user), user }, { status: 201 });
}
