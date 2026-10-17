import { DatabaseSync } from "node:sqlite";

import type { batch, query, QueryResult, Row } from "@/lib/turso";

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

// Goes through the given query, so failures a test injects there reach batches too.
export function sqliteBatch(run: typeof query): typeof batch {
  return async (statements) => {
    await run("BEGIN");
    try {
      const results: QueryResult[] = [];
      for (const { sql, args } of statements)
        results.push(await run(sql, args));
      await run("COMMIT");
      return results;
    } catch (err) {
      await run("ROLLBACK").catch(() => {});
      throw err;
    }
  };
}
