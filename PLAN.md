# ADP-GYM — Master Plan

> Turning the standalone `outil_v0_GYM-ART_DI-GYM (2).html` decision-support tool into a
> full-stack, multi-teacher web application: **Next.js 16 + SQLite**, French/Arabic,
> with optional per-teacher AI assistance.

---

## 1. Vision

A web app for PE teachers (Éducation Physique et Sportive) that digitises the **ADP 2026
Artistic Gymnastics** pedagogical decision workflow. A teacher logs in, creates a class,
runs a 4-step diagnostic-to-planning wizard, saves it, re-evaluates the class over time to
track progress, and exports PDF/CSV reports. The tool is **deliberately note-free** — it
informs the teacher's decision, it never grades.

The valuable core is the hard-coded **référentiel** (observables, axes, situations
d'apprentissage, session-distribution tables) lifted verbatim from the HTML tool into
typed, tested code.

---

## 2. Decisions Log (all confirmed)

| Area | Decision |
|---|---|
| Product scope | **Artistic Gymnastics only** (no multi-activity abstraction yet) |
| Deployment | **Online web app**, assume connectivity (no offline/PWA) |
| Language | **French + Arabic, with RTL** support |
| AI | **Rule-based core + optional AI assist** (enrich sessions, justify decisions, summarise diagnostic) |
| AI key | **Each teacher enters their own Anthropic API key** in Settings (stored encrypted, used server-side) |
| Accounts | **Open self-registration, solo teachers** (each sees only their own data) |
| Data lifecycle | **Multiple diagnostics per class over time** (timestamped, progress tracking) |
| Plan editability | **Editable after generation, saved as edited** |
| Backend | **Consolidate into Next.js route handlers** — drop the separate Express server |
| Auth | **localStorage JWT, no password reset** (port existing approach) |
| Student privacy | **First names only**, teacher-owned, fully deletable |
| Dashboard | Classes list + recent cycles + progress trends + cross-class stats |
| Device | **Fully responsive** (phone/tablet/desktop equal priority) |
| Référentiel | **Fixed global**, same for everyone |
| Outputs | **PDF export + CSV import/export** |
| Branding | **ADP-GYM** / "Outil ADP 2026" (replaces the "Sporty" placeholder); gold #B8843A + navy #0D1E35 theme |
| Persistence | **Full DB persistence** |
| Référentiel impl | **Typed TS constants** in shared code |
| Build approach | **Staged, reviewable milestones** |
| Quality | Seed/demo data + minimal tests (skip heavy test suite for speed) |

---

## 3. Architecture

```
┌─ Next.js 16 App (single deployable) ───────────────────────────────┐
│  CLIENT (App Router, React 19, Tailwind v4, shadcn/base-ui)        │
│   /login /register            re-skinned auth                       │
│   /dashboard                  classes + recent cycles + stats       │
│   /classes/[id]               class detail, diagnostics history     │
│   /classes/[id]/evaluate      the 4-step wizard                     │
│   /classes/[id]/cycle/[cid]   saved/editable cycle plan             │
│   /settings                   profile + Anthropic API key           │
│                                                                     │
│  lib/referentiel.ts   OBS · AX · SA · DI · SH · DS  (typed)         │
│  lib/calc.ts          pure logic: profil, lacunes, axePrio, genPlan │
│  lib/i18n/            fr + ar dictionaries, RTL direction            │
│                                                                     │
│  SERVER (route handlers under /app/api/*)                           │
│   /api/auth/*         register, login, me  (ported from Express)     │
│   /api/settings/key   store/clear encrypted Anthropic key           │
│   /api/classes        CRUD classes + roster                          │
│   /api/diagnostics    create/list timestamped diagnostics           │
│   /api/cycles         create/edit/list generated cycle plans         │
│   /api/ai/*           enrich · justify · summarise (uses teacher key) │
│   /api/export/*       PDF / CSV generation                           │
│                                                                     │
│  node:sqlite (app.db)  — same engine as today                       │
└─────────────────────────────────────────────────────────────────────┘
```

> ⚠️ This is a **modified Next.js 16** (`frontend/AGENTS.md`): APIs may differ from
> training data. Implementation must read `node_modules/next/dist/docs/` before writing
> Next-specific code (route handlers, metadata, fonts, etc.).

---

## 4. Tech Stack

- **Framework:** Next.js 16.2.7 (App Router, React 19) — one app, no separate Express.
- **Styling:** Tailwind v4 (`@theme` tokens) + shadcn / base-ui components + sonner toasts.
- **DB:** Node built-in `node:sqlite` (file `app.db`, WAL) — carried over from current backend.
- **Auth:** JWT (bcryptjs hash, jsonwebtoken), token in localStorage via `lib/auth.ts`.
- **AI:** Anthropic SDK, server-side only, key supplied per-teacher (see §10).
- **PDF:** Browser print-to-PDF using a dedicated print stylesheet (primary); optional
  server-side renderer later if needed.
- **i18n:** lightweight dictionary + `dir`/`lang` switching (FR default, AR/RTL).

---

## 5. Domain Model (the référentiel — ported verbatim)

From the HTML tool, into `lib/referentiel.ts` (typed) + `lib/calc.ts` (pure functions):

- **OBS** — 3 observables (OBS-01 posture/tonicité, OBS-02 renversement ATR/roulade,
  OBS-03 composition/liaisons); each with codes A/B/C, conduites, formulation motrice.
- **Thresholds** `SH = {C: 7.5, B: 4.5}` → profile A/B/C; `DS = {A:3, B:6, C:9}` (CSV code → score).
- **SA** — situations d'apprentissage (SA-A1/B1/C1).
- **AX** — 6 priority axes, each with prérequis, impact, indicateur, and A/B/C consignes + critères.
- **DI** — session-distribution lookup: `DI[nbAxes][nbSeances] → [seances per axis]`.
- **Pure functions:** `prof(v)`, `lacunes(vs)`, `axePrio(lacunes)`, `getSA(lacunes)`,
  `analyser(roster)`, `rankAxes(results)`, `distribute(...)`, `genPlan(axes, nSeances, analysis)`.

These pure functions are the deterministic heart of the app (verified by a manual
sanity run rather than a formal test suite, per the skip-tests-for-speed choice).

---

## 6. Data Model (SQLite)

```sql
users(id, email UNIQUE, password_hash, anthropic_key_enc, created_at)   -- key encrypted at rest
classes(id, user_id→users, nom, niveau, created_at)                      -- niveau: "4ème"/"3ème"
students(id, class_id→classes, prenom, ordre)                            -- roster, first name only
diagnostics(id, class_id→classes, label, date, created_at)               -- e.g. "S1", re-evaluations
scores(id, diagnostic_id→diagnostics, student_id→students, obs1, obs2, obs3)
cycles(id, class_id→classes, diagnostic_id→diagnostics,
       axes_json, n_seances, plan_json, edited INTEGER, created_at)       -- plan_json editable & saved
```

- Re-evaluation = new `diagnostics` row reusing the same `students`; enables progress trends.
- `plan_json` stores the generated (and teacher-edited) cycle so it reloads exactly.
- Cascade delete: removing a class removes its students/diagnostics/scores/cycles.

---

## 7. Feature Areas (detailed scope)

### 7.1 Auth & accounts
Port `register`/`login`/`me` into Next route handlers; JWT in localStorage; solo-teacher
ownership enforced on every query (`WHERE user_id = ?`). No reset flow (deferred).

### 7.2 Settings — per-teacher Anthropic key
`/settings` page: teacher pastes their Anthropic API key. Stored **encrypted at rest**
(AES-GCM with a server `APP_ENCRYPTION_KEY`), decrypted only server-side at call time,
**never returned to the client** (show only "key set ✓ / remove"). AI features are
disabled in the UI when no key is set.

### 7.3 Class & roster management
Create/edit/delete classes (nom + niveau). Manage roster (add/remove/reorder students).
CSV import (ADP-2026 field format, metier codes PT/GM/CL + 0–10) populates a roster +
its first diagnostic. Roster is reused across future diagnostics.

### 7.4 Diagnostic-to-planning wizard (the core)
Ported from the HTML 4-step flow into stateful React (step machine via reducer/context):
1. **Diagnostic** — roster + 3 scores/student (manual or CSV) → per-student table
   (profil A/B/C, lacunes, axe prioritaire, SA) + class bilan (counts, per-observable bars,
   dominant decision).
2. **Axes** — pick 3–4 of 6 axes, auto-ranked by % of students concerned.
3. **Paramétrage** — slider 6–10 séances; live preview of distribution across axes.
4. **Planification** — differentiated cycle table (per-séance objectives + group A/B/C
   activities & critères), editable, then saved. Résumé du cycle block.

### 7.5 Re-evaluation & progress
From a class, "Nouvelle évaluation" reuses the roster, captures new scores as a new
timestamped diagnostic. Progress view compares OBS-01/02/03 averages across diagnostics
(did the class improve).

### 7.6 AI assist (optional, per-teacher key)
On-demand buttons (to control cost), server-side Claude calls with the teacher's key,
bilingual output:
- **Enrich session content** — exercise variations/progressions per group A/B/C.
- **Justify decisions** — short pedagogical rationale for an axis/SA, for the report.
- **Summarise diagnostic** — natural-language class summary to paste into a report.
Gracefully disabled (with hint to add a key) when no key is configured.

### 7.7 Outputs
- **PDF** — clean diagnostic + cycle export via a print-targeted route/stylesheet
  (builds on the tool's existing A4-landscape print CSS).
- **CSV** — keep ADP-2026 CSV import and results CSV export.

### 7.8 i18n & RTL
French default; Arabic with full RTL (`dir="rtl"`, mirrored layout). All UI strings via a
dictionary; référentiel content stays as authored (FR), with an option to add AR labels
later. Needs an Arabic-capable font alongside the Latin serif/sans brand fonts.

### 7.9 Dashboard & analytics
Post-login home: my classes (level, date, last diagnostic, quick actions), recent cycles,
per-class progress trends, and cross-class aggregates (class count, average levels, most
common priority axes).

### 7.10 Branding / theme
Replace "Sporty" with **ADP-GYM**. Encode the gold (#B8843A) + navy (#0D1E35) cream-serif
identity as Tailwind `@theme` tokens so shadcn components inherit it. Header badges
(GAF/GAM, niveau, DI) and the "outil sans note" banner carry over.

---

## 8. Privacy & Security

- Student data = **first names only**, scoped to the owning teacher, fully deletable.
- Teacher Anthropic keys **encrypted at rest**, never sent to the browser, used only
  server-side.
- All data queries filtered by authenticated `user_id`.
- JWT in localStorage is XSS-exposed (accepted tradeoff for now; httpOnly cookie is a
  future hardening, noted in `lib/auth.ts`).

---

## 9. Milestones (staged, each independently runnable)

1. **Référentiel + calc** — port OBS/AX/SA/DI + pure functions to typed TS (sanity-verified).
2. **Wizard UI (client-only)** — the 4 steps in React with visual parity to the HTML tool
   (no persistence yet), ADP-GYM theme applied.
3. **DB + APIs** — SQLite schema, Next route handlers for auth/classes/diagnostics/cycles
   (auth ported off Express).
4. **Persistence + dashboard** — wire wizard save/load, re-evaluation, progress, dashboard.
5. **Settings + AI assist** — per-teacher key store + the 3 AI features.
6. **Outputs + i18n polish** — PDF/CSV, French/Arabic + RTL, responsive pass, seed data.

---

## 10. Risks & Things To Watch

- **Modified Next.js 16** — must consult bundled docs before writing route handlers/metadata.
- **Arabic + RTL + PDF** — RTL print/PDF layout is fiddly; validate early on real content.
- **Per-teacher key encryption** — requires a server secret (`APP_ENCRYPTION_KEY`) in env;
  losing it invalidates stored keys.
- **node:sqlite in Next** — fine for self-host/single-node; not suited to serverless
  multi-instance deploys (note for hosting choice).

---

## 11. Out of Scope (for now)

Multi-activity platform, offline/PWA, school/admin roles, password reset, shareable public
links, teacher-editable référentiel, full automated test suite.

---

## 12. Build Status (all 6 milestones complete)

| M | Scope | Status |
|---|---|---|
| 1 | `lib/referentiel.ts` + `lib/calc.ts` (typed, sanity-verified) | ✅ |
| 2 | 4-step wizard React port + scoped CSS module (gold/navy parity) at `/outil` | ✅ |
| 3 | `node:sqlite` schema + Next route handlers (auth/classes/diagnostics/cycles); Express retired | ✅ |
| 4 | Persistence wired; dashboard, class detail + progress trends, evaluate, editable cycle view; ADP-GYM auth rebrand | ✅ |
| 5 | `/settings` per-teacher Anthropic key (AES-256-GCM at rest) + 3 AI helpers (summary/justify/enrich) | ✅ |
| 6 | Browser-print PDF + CSV (CSV landed in M2); FR/AR + RTL toggle (chrome); demo-seed; lazy-DB build fix | ✅ |

**Notes / decisions made during the build:**
- **i18n scope:** FR + Arabic with RTL is implemented as infrastructure (`lib/i18n.tsx`,
  `dir`/`lang` switching, Noto Sans Arabic font, language toggle) with the **app chrome**
  (auth, header, dashboard) translated. The **pedagogical wizard + référentiel stay in
  French by design** — they mirror the official French ADP 2026 framework. Translating that
  content is a future enhancement if desired.
- **PDF = browser print-to-PDF** using the wizard's print stylesheet (`@media print`) and the
  cycle-page print button; no server-side PDF renderer.
- **Tests:** skipped per the chosen "seed + minimal" option; pure calc layer verified by a
  manual run, and every milestone verified end-to-end against the running server.
- **Lazy DB:** the SQLite connection opens on first query (not at import) so parallel
  `next build` workers don't hit "database is locked".
- **Env required:** `JWT_SECRET` and `APP_ENCRYPTION_KEY` in `frontend/.env.local` (dev
  defaults provided; change for production).
