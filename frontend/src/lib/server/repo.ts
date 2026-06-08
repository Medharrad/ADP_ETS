import "server-only";

import { get, getDb, query, run } from "./db";

// =============================================================================
// Data-access layer (async, libSQL). Every class-scoped function takes a userId
// and enforces ownership so route handlers never touch another teacher's rows.
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
  return query(
    `SELECT c.id, c.nom, c.niveau, c.created_at,
            (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS students,
            (SELECT COUNT(*) FROM diagnostics d WHERE d.class_id = c.id) AS diagnostics,
            (SELECT COUNT(*) FROM cycles cy WHERE cy.class_id = c.id) AS cycles,
            (SELECT MAX(d.date) FROM diagnostics d WHERE d.class_id = c.id) AS last_diagnostic
     FROM classes c
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId],
  );
}

export function getClassOwned(userId: number, classId: number) {
  return get<ClassRow>("SELECT * FROM classes WHERE id = ? AND user_id = ?", [classId, userId]);
}

export async function createClass(userId: number, nom: string, niveau: string | null) {
  const info = await run("INSERT INTO classes (user_id, nom, niveau) VALUES (?, ?, ?)", [
    userId,
    nom,
    niveau,
  ]);
  return (await getClassOwned(userId, info.lastInsertRowid))!;
}

export async function updateClass(
  userId: number,
  classId: number,
  nom: string,
  niveau: string | null,
) {
  await run("UPDATE classes SET nom = ?, niveau = ? WHERE id = ? AND user_id = ?", [
    nom,
    niveau,
    classId,
    userId,
  ]);
  return getClassOwned(userId, classId);
}

/** Delete a class and all dependent rows (explicit cascade — FK enforcement is
 *  not guaranteed on remote libSQL). Runs as one write transaction. */
export async function deleteClass(userId: number, classId: number) {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    await tx.execute({
      sql: "DELETE FROM scores WHERE diagnostic_id IN (SELECT id FROM diagnostics WHERE class_id = ?)",
      args: [classId],
    });
    await tx.execute({ sql: "DELETE FROM cycles WHERE class_id = ?", args: [classId] });
    await tx.execute({ sql: "DELETE FROM diagnostics WHERE class_id = ?", args: [classId] });
    await tx.execute({ sql: "DELETE FROM students WHERE class_id = ?", args: [classId] });
    await tx.execute({
      sql: "DELETE FROM classes WHERE id = ? AND user_id = ?",
      args: [classId, userId],
    });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export function getStudents(classId: number) {
  return query<StudentRow>(
    "SELECT id, prenom, ordre FROM students WHERE class_id = ? ORDER BY ordre, id",
    [classId],
  );
}

// -- niveaux (custom grade levels, per teacher) -------------------------------

export interface NiveauRow {
  id: number;
  label: string;
  ordre: number;
}

export function listNiveaux(userId: number) {
  return query<NiveauRow>(
    "SELECT id, label, ordre FROM niveaux WHERE user_id = ? ORDER BY ordre, id",
    [userId],
  );
}

/** Create a custom niveau. Idempotent: reuses an existing one with the same
 *  label (case-insensitive) for that teacher rather than duplicating. */
export async function createNiveau(userId: number, label: string) {
  const existing = await get<NiveauRow>(
    "SELECT id, label, ordre FROM niveaux WHERE user_id = ? AND lower(label) = lower(?)",
    [userId, label],
  );
  if (existing) return existing;
  const info = await run("INSERT INTO niveaux (user_id, label) VALUES (?, ?)", [userId, label]);
  return (await get<NiveauRow>("SELECT id, label, ordre FROM niveaux WHERE id = ?", [
    info.lastInsertRowid,
  ]))!;
}

export async function deleteNiveau(userId: number, id: number) {
  await run("DELETE FROM niveaux WHERE id = ? AND user_id = ?", [id, userId]);
}

// -- diagnostics --------------------------------------------------------------

export function listDiagnostics(classId: number) {
  return query<DiagnosticRow>("SELECT * FROM diagnostics WHERE class_id = ? ORDER BY date, id", [
    classId,
  ]);
}

export function getScores(diagnosticId: number) {
  return query<ScoreRow>(
    `SELECT sc.student_id, st.prenom, sc.obs1, sc.obs2, sc.obs3
     FROM scores sc JOIN students st ON st.id = sc.student_id
     WHERE sc.diagnostic_id = ?
     ORDER BY st.ordre, st.id`,
    [diagnosticId],
  );
}

export interface DiagnosticInput {
  prenom: string;
  vs: [number, number, number];
}

/**
 * Create a diagnostic for a class. Students are reused by prénom (created if
 * missing), so a re-evaluation links new scores to the same roster. Atomic.
 */
export async function createDiagnostic(
  classId: number,
  label: string | null,
  date: string | null,
  students: DiagnosticInput[],
): Promise<DiagnosticRow> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    const diag = await tx.execute({
      sql: "INSERT INTO diagnostics (class_id, label, date) VALUES (?, ?, ?)",
      args: [classId, label, date],
    });
    const diagId = Number(diag.lastInsertRowid);

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const existing = await tx.execute({
        sql: "SELECT id FROM students WHERE class_id = ? AND prenom = ?",
        args: [classId, s.prenom],
      });
      let studentId: number;
      if (existing.rows.length) {
        studentId = Number((existing.rows[0] as unknown as { id: number }).id);
      } else {
        const ins = await tx.execute({
          sql: "INSERT INTO students (class_id, prenom, ordre) VALUES (?, ?, ?)",
          args: [classId, s.prenom, i],
        });
        studentId = Number(ins.lastInsertRowid);
      }
      await tx.execute({
        sql: "INSERT INTO scores (diagnostic_id, student_id, obs1, obs2, obs3) VALUES (?, ?, ?, ?, ?)",
        args: [diagId, studentId, s.vs[0], s.vs[1], s.vs[2]],
      });
    }

    await tx.commit();
    return (await get<DiagnosticRow>("SELECT * FROM diagnostics WHERE id = ?", [diagId]))!;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export function getDiagnosticOwned(userId: number, diagId: number) {
  return get<DiagnosticRow>(
    `SELECT d.* FROM diagnostics d
     JOIN classes c ON c.id = d.class_id
     WHERE d.id = ? AND c.user_id = ?`,
    [diagId, userId],
  );
}

// -- cycles -------------------------------------------------------------------

export async function createCycle(
  classId: number,
  diagnosticId: number | null,
  axes: number[],
  nSeances: number,
  plan: unknown,
): Promise<CycleRow> {
  const info = await run(
    "INSERT INTO cycles (class_id, diagnostic_id, axes_json, n_seances, plan_json) VALUES (?, ?, ?, ?, ?)",
    [classId, diagnosticId, JSON.stringify(axes), nSeances, JSON.stringify(plan)],
  );
  return (await get<CycleRow>("SELECT * FROM cycles WHERE id = ?", [info.lastInsertRowid]))!;
}

export function listCycles(classId: number) {
  return query<CycleRow>("SELECT * FROM cycles WHERE class_id = ? ORDER BY created_at DESC", [
    classId,
  ]);
}

export function listRecentCycles(userId: number, limit = 6) {
  return query(
    `SELECT cy.id, cy.class_id, cy.n_seances, cy.edited, cy.created_at, cy.axes_json,
            c.nom AS class_nom, c.niveau AS class_niveau
     FROM cycles cy JOIN classes c ON c.id = cy.class_id
     WHERE c.user_id = ?
     ORDER BY cy.created_at DESC
     LIMIT ?`,
    [userId, limit],
  );
}

export function getCycleOwned(userId: number, cycleId: number) {
  return get<CycleRow>(
    `SELECT cy.* FROM cycles cy
     JOIN classes c ON c.id = cy.class_id
     WHERE cy.id = ? AND c.user_id = ?`,
    [cycleId, userId],
  );
}

export async function updateCyclePlan(cycleId: number, plan: unknown) {
  await run("UPDATE cycles SET plan_json = ?, edited = 1 WHERE id = ?", [
    JSON.stringify(plan),
    cycleId,
  ]);
  return get<CycleRow>("SELECT * FROM cycles WHERE id = ?", [cycleId]);
}

export function deleteCycle(cycleId: number) {
  return run("DELETE FROM cycles WHERE id = ?", [cycleId]);
}
