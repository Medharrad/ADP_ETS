import "server-only";

import fs from "node:fs";
import path from "node:path";
import { createClient, type Client, type InArgs, type Row } from "@libsql/client";

// =============================================================================
// libSQL (Turso) data layer.
//   • Local dev  → file:./data/app.db   (no env needed)
//   • Production → set TURSO_DATABASE_URL (libsql://…) + TURSO_AUTH_TOKEN
// Async API: every query returns a Promise. Schema is created lazily once.
// =============================================================================

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  niveau TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS niveaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  ordre INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  label TEXT,
  date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnostic_id INTEGER NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  obs1 REAL NOT NULL,
  obs2 REAL NOT NULL,
  obs3 REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  diagnostic_id INTEGER REFERENCES diagnostics(id) ON DELETE SET NULL,
  axes_json TEXT NOT NULL,
  n_seances INTEGER NOT NULL,
  plan_json TEXT NOT NULL,
  edited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_classes_user ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_niveaux_user ON niveaux(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_class ON diagnostics(class_id);
CREATE INDEX IF NOT EXISTS idx_scores_diag ON scores(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_cycles_class ON cycles(class_id);
`;

const g = globalThis as unknown as { __adpClient?: Client; __adpInit?: Promise<void> };

function rawClient(): Client {
  if (g.__adpClient) return g.__adpClient;
  const url = process.env.TURSO_DATABASE_URL ?? "file:data/app.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url.startsWith("file:")) {
    // local dev — ensure the directory exists for the SQLite file
    const file = url.slice("file:".length);
    fs.mkdirSync(path.dirname(file) || ".", { recursive: true });
  }
  g.__adpClient = createClient(
    authToken ? { url, authToken, intMode: "number" } : { url, intMode: "number" },
  );
  return g.__adpClient;
}

/** Returns the libSQL client, ensuring the schema exists (runs once per
 *  process). The SCHEMA is idempotent (every statement is IF NOT EXISTS), so a
 *  failed init clears the cached promise and retries on the next call rather
 *  than poisoning every subsequent query with a stale rejection. */
export async function getDb(): Promise<Client> {
  const c = rawClient();
  if (!g.__adpInit) {
    g.__adpInit = c.executeMultiple(SCHEMA).catch((e) => {
      g.__adpInit = undefined;
      throw e;
    });
  }
  await g.__adpInit;
  return c;
}

// -- thin query helpers -------------------------------------------------------

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InArgs = [],
): Promise<T[]> {
  const db = await getDb();
  const res = await db.execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function get<T = Record<string, unknown>>(
  sql: string,
  args: InArgs = [],
): Promise<T | undefined> {
  return (await query<T>(sql, args))[0];
}

export async function run(
  sql: string,
  args: InArgs = [],
): Promise<{ lastInsertRowid: number; rowsAffected: number }> {
  const db = await getDb();
  const res = await db.execute({ sql, args });
  return {
    lastInsertRowid: res.lastInsertRowid != null ? Number(res.lastInsertRowid) : 0,
    rowsAffected: res.rowsAffected,
  };
}

export type { Row };
