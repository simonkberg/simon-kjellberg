import { DatabaseSync } from "node:sqlite";

import { beforeEach, vi } from "vitest";

import type { batch, BatchResults, query, QueryResult, Row } from "@/lib/turso";

export const emptyResult: QueryResult = {
  rows: [],
  rowsAffected: 0,
  lastInsertRowId: null,
};

// An in-memory stand-in for Turso, so tests exercise the real SQL.
export function createSqliteQuery(setup: readonly string[] = []): typeof query {
  const db = new DatabaseSync(":memory:");
  for (const sql of setup) db.exec(sql);
  const totalChanges = db.prepare("SELECT total_changes() AS n");
  const changes = () => Number(totalChanges.get()?.["n"]);

  return async (sql, args) => {
    const statement = db.prepare(sql);
    const before = changes();
    let rows: Row[] = [];
    if (statement.columns().length > 0) {
      rows = statement.all(...(args ?? [])) as Row[];
    } else {
      statement.run(...(args ?? []));
    }
    return { rows, rowsAffected: changes() - before, lastInsertRowId: null };
  };
}

// Gives the mocked query a fresh database before each test; call the result for it.
export function sqliteBeforeEach(
  mocked: typeof query,
  setup: readonly string[] = [],
): () => typeof query {
  let sqlite: typeof query;
  beforeEach(() => {
    sqlite = createSqliteQuery(setup);
    vi.mocked(mocked).mockImplementation(sqlite);
  });
  return () => sqlite;
}

// Rejects statements starting with prefix and runs the rest. afterRunning
// rejects once, after the statement ran, like a response lost on the way back.
export function failQuery(
  run: typeof query,
  prefix: string,
  { error = new Error("boom"), once = false, afterRunning = false } = {},
): typeof query {
  const onlyOnce = once || afterRunning;
  let failed = false;
  return async (sql, args) => {
    if (!sql.startsWith(prefix) || (onlyOnce && failed)) return run(sql, args);
    if (onlyOnce) failed = true;
    if (afterRunning) await run(sql, args);
    throw error;
  };
}

// Turso as a mock module: `batch` runs through `query`, so give `query` an implementation.
export function mockTurso(): { query: typeof query; batch: typeof batch } {
  const query = vi.fn<typeof import("@/lib/turso").query>();
  // A mock's call signature drops batch's generic, though it runs the same function.
  return { query, batch: vi.fn(sqliteBatch(query)) as typeof batch };
}

// Goes through the given query, so failures a test injects there reach batches too.
// Queued, since overlapping batches would nest BEGIN on the one shared connection.
export function sqliteBatch(run: typeof query): typeof batch {
  let queue: Promise<unknown> = Promise.resolve();
  return (statements) => {
    const done = queue.then(async () => {
      await run("BEGIN");
      try {
        const results: QueryResult[] = [];
        for (const { sql, args } of statements)
          results.push(await run(sql, args));
        await run("COMMIT");
        return results as BatchResults<typeof statements>;
      } catch (err) {
        await run("ROLLBACK").catch(() => {});
        throw err;
      }
    });
    queue = done.catch(() => {});
    return done;
  };
}
