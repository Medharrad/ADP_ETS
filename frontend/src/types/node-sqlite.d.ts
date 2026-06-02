// Minimal ambient types for Node's built-in `node:sqlite` module.
// The installed @types/node (v20) predates this module; runtime is Node 22.5+.
declare module "node:sqlite" {
  export interface StatementSync {
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
