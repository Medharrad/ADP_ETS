import "server-only";

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// =============================================================================
// SQLite (Node built-in) — single shared connection. Consolidated from the old
// Express backend into the Next.js app. The DB file lives in ./data/app.db
// (gitignored). Schema is created on first run.
// =============================================================================

function createDb(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "app.db"));

  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      anthropic_key_enc TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nom TEXT NOT NULL,
      niveau TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_diagnostics_class ON diagnostics(class_id);
    CREATE INDEX IF NOT EXISTS idx_scores_diag ON scores(diagnostic_id);
    CREATE INDEX IF NOT EXISTS idx_cycles_class ON cycles(class_id);
  `);

  return db;
}

// Lazily open the connection on first query — NOT at import time. During
// `next build`, page-data collection imports these modules across many parallel
// workers; eagerly opening the file there causes "database is locked". The
// connection is cached across dev hot-reloads.
const globalForDb = globalThis as unknown as { __adpDb?: DatabaseSync };

function getDb(): DatabaseSync {
  if (!globalForDb.__adpDb) globalForDb.__adpDb = createDb();
  return globalForDb.__adpDb;
}

// Proxy so existing `db.prepare(...)` / `db.exec(...)` call sites work unchanged
// while deferring the actual open until the first real access.
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});
