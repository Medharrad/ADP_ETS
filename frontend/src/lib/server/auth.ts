import "server-only";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Auth helpers, ported from the Express backend. JWT is carried in the
// Authorization: Bearer <token> header (token stored in localStorage client-side).

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_TTL = "7d";

export interface AuthUser {
  id: number;
  email: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/** Extract and verify the bearer token from a request. Returns null if invalid. */
export function getAuthUser(request: Request): AuthUser | null {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as {
      sub: number;
      email: string;
    };
    return { id: Number(payload.sub), email: payload.email };
  } catch {
    return null;
  }
}

/** Standard JSON error response. */
export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Standard 401 for missing/invalid auth. */
export const unauthorized = () => jsonError("Authentification requise", 401);
