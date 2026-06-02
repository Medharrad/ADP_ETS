const { DatabaseSync } = require("node:sqlite");
const path = require("path");

// File-based SQLite using Node's built-in module — no server, no native build.
// The file is created on first run.
const db = new DatabaseSync(path.join(__dirname, "app.db"));

db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
