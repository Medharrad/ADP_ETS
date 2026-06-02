import "server-only";

import { db } from "./db";

// =============================================================================
// Data-access layer. Every function that reads/writes class-scoped data takes a
// userId and enforces ownership, so route handlers never touch another teacher's
// rows. Returns plain objects ready to serialize.
// =============================================================================

export interface ClassRow {
  id: number;
  user_id: number;
  nom: string;
  niveau: string | null;
  created_at: string;
}

export interface StudentRow {
  id: number;
  prenom: string;
  ordre: number;
}

export interface ScoreRow {
  student_id: number;
  prenom: string;
  obs1: number;
  obs2: number;
  obs3: number;
}

export interface DiagnosticRow {
  id: number;
  class_id: number;
  label: string | null;
  date: string | null;
  created_at: string;
}

export interface CycleRow {
  id: number;
  class_id: number;
  diagnostic_id: number | null;
  axes_json: string;
  n_seances: number;
  plan_json: string;
  edited: number;
  created_at: string;
}

// -- classes ------------------------------------------------------------------

export function listClasses(userId: number) {
  return db
    .prepare(
      `SELECT c.id, c.nom, c.niveau, c.created_at,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS students,
              (SELECT COUNT(*) FROM diagnostics d WHERE d.class_id = c.id) AS diagnostics,
              (SELECT COUNT(*) FROM cycles cy WHERE cy.class_id = c.id) AS cycles,
              (SELECT MAX(d.date) FROM diagnostics d WHERE d.class_id = c.id) AS last_diagnostic
       FROM classes c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
    )
    .all(userId);
}

export function getClassOwned(userId: number, classId: number): ClassRow | undefined {
  return db
    .prepare("SELECT * FROM classes WHERE id = ? AND user_id = ?")
    .get(classId, userId) as ClassRow | undefined;
}

export function createClass(userId: number, nom: string, niveau: string | null) {
  const info = db
    .prepare("INSERT INTO classes (user_id, nom, niveau) VALUES (?, ?, ?)")
    .run(userId, nom, niveau);
  return getClassOwned(userId, Number(info.lastInsertRowid))!;
}

export function updateClass(
  userId: number,
  classId: number,
  nom: string,
  niveau: string | null,
) {
  db.prepare("UPDATE classes SET nom = ?, niveau = ? WHERE id = ? AND user_id = ?").run(
    nom,
    niveau,
    classId,
    userId,
  );
  return getClassOwned(userId, classId);
}

export function deleteClass(userId: number, classId: number) {
  db.prepare("DELETE FROM classes WHERE id = ? AND user_id = ?").run(classId, userId);
}

export function getStudents(classId: number): StudentRow[] {
  return db
    .prepare("SELECT id, prenom, ordre FROM students WHERE class_id = ? ORDER BY ordre, id")
    .all(classId) as StudentRow[];
}

// -- diagnostics --------------------------------------------------------------

export function listDiagnostics(classId: number): DiagnosticRow[] {
  return db
    .prepare("SELECT * FROM diagnostics WHERE class_id = ? ORDER BY date, id")
    .all(classId) as DiagnosticRow[];
}

export function getScores(diagnosticId: number): ScoreRow[] {
  return db
    .prepare(
      `SELECT sc.student_id, st.prenom, sc.obs1, sc.obs2, sc.obs3
       FROM scores sc JOIN students st ON st.id = sc.student_id
       WHERE sc.diagnostic_id = ?
       ORDER BY st.ordre, st.id`,
    )
    .all(diagnosticId) as ScoreRow[];
}

export interface DiagnosticInput {
  prenom: string;
  vs: [number, number, number];
}

/**
 * Create a diagnostic for a class. Students are reused by prénom (created if
 * missing), so a re-evaluation links new scores to the same roster.
 */
export function createDiagnostic(
  classId: number,
  label: string | null,
  date: string | null,
  students: DiagnosticInput[],
): DiagnosticRow {
  const findStudent = db.prepare(
    "SELECT id FROM students WHERE class_id = ? AND prenom = ?",
  );
  const insStudent = db.prepare(
    "INSERT INTO students (class_id, prenom, ordre) VALUES (?, ?, ?)",
  );
  const insScore = db.prepare(
    "INSERT INTO scores (diagnostic_id, student_id, obs1, obs2, obs3) VALUES (?, ?, ?, ?, ?)",
  );

  db.exec("BEGIN");
  try {
    const info = db
      .prepare("INSERT INTO diagnostics (class_id, label, date) VALUES (?, ?, ?)")
      .run(classId, label, date);
    const diagId = Number(info.lastInsertRowid);

    students.forEach((s, i) => {
      const existing = findStudent.get(classId, s.prenom) as { id: number } | undefined;
      const studentId = existing
        ? existing.id
        : Number(insStudent.run(classId, s.prenom, i).lastInsertRowid);
      insScore.run(diagId, studentId, s.vs[0], s.vs[1], s.vs[2]);
    });

    db.exec("COMMIT");
    return db.prepare("SELECT * FROM diagnostics WHERE id = ?").get(diagId) as DiagnosticRow;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Fetch a diagnostic only if it belongs to the user. */
export function getDiagnosticOwned(userId: number, diagId: number): DiagnosticRow | undefined {
  return db
    .prepare(
      `SELECT d.* FROM diagnostics d
       JOIN classes c ON c.id = d.class_id
       WHERE d.id = ? AND c.user_id = ?`,
    )
    .get(diagId, userId) as DiagnosticRow | undefined;
}

// -- cycles -------------------------------------------------------------------

export function createCycle(
  classId: number,
  diagnosticId: number | null,
  axes: number[],
  nSeances: number,
  plan: unknown,
): CycleRow {
  const info = db
    .prepare(
      "INSERT INTO cycles (class_id, diagnostic_id, axes_json, n_seances, plan_json) VALUES (?, ?, ?, ?, ?)",
    )
    .run(classId, diagnosticId, JSON.stringify(axes), nSeances, JSON.stringify(plan));
  return db.prepare("SELECT * FROM cycles WHERE id = ?").get(Number(info.lastInsertRowid)) as CycleRow;
}

export function listCycles(classId: number): CycleRow[] {
  return db
    .prepare("SELECT * FROM cycles WHERE class_id = ? ORDER BY created_at DESC")
    .all(classId) as CycleRow[];
}

export function listRecentCycles(userId: number, limit = 6) {
  return db
    .prepare(
      `SELECT cy.id, cy.class_id, cy.n_seances, cy.edited, cy.created_at, cy.axes_json,
              c.nom AS class_nom, c.niveau AS class_niveau
       FROM cycles cy JOIN classes c ON c.id = cy.class_id
       WHERE c.user_id = ?
       ORDER BY cy.created_at DESC
       LIMIT ?`,
    )
    .all(userId, limit);
}

export function getCycleOwned(userId: number, cycleId: number): CycleRow | undefined {
  return db
    .prepare(
      `SELECT cy.* FROM cycles cy
       JOIN classes c ON c.id = cy.class_id
       WHERE cy.id = ? AND c.user_id = ?`,
    )
    .get(cycleId, userId) as CycleRow | undefined;
}

export function updateCyclePlan(cycleId: number, plan: unknown) {
  db.prepare("UPDATE cycles SET plan_json = ?, edited = 1 WHERE id = ?").run(
    JSON.stringify(plan),
    cycleId,
  );
  return db.prepare("SELECT * FROM cycles WHERE id = ?").get(cycleId) as CycleRow;
}

export function deleteCycle(cycleId: number) {
  db.prepare("DELETE FROM cycles WHERE id = ?").run(cycleId);
}
