import "server-only";
import { z } from "zod";

import { env } from "@/lib/env";
import { getGlobal } from "@/lib/global";
import { log } from "@/lib/log";

const TIMEOUT_MS = 5000;
// Idle for a while, Turso stalls the next query past the timeout.
const KEEP_WARM_MS = 60_000;

export type Value = string | number | null;
export type Row = Record<string, Value>;
export type QueryResult = {
  rows: Row[];
  rowsAffected: number;
  lastInsertRowId: number | null;
};

const valueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("null") }),
  z.object({ type: z.literal("integer"), value: z.string() }),
  z.object({ type: z.literal("float"), value: z.number() }),
  z.object({ type: z.literal("text"), value: z.string() }),
  z.object({ type: z.literal("blob"), base64: z.string() }),
]);

const stmtResultSchema = z.object({
  cols: z.array(z.object({ name: z.string().nullable() })),
  rows: z.array(z.array(valueSchema)),
  affected_row_count: z.number(),
  last_insert_rowid: z.string().nullable(),
});

const errorSchema = z.object({ message: z.string() });

const pipelineResponseSchema = z.object({
  results: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("ok"),
        response: z.discriminatedUnion("type", [
          z.object({ type: z.literal("execute"), result: stmtResultSchema }),
          z.object({
            type: z.literal("batch"),
            result: z.object({
              step_results: z.array(stmtResultSchema.nullable()),
              step_errors: z.array(errorSchema.nullable()),
            }),
          }),
          z.object({ type: z.literal("close") }),
        ]),
      }),
      z.object({ type: z.literal("error"), error: errorSchema }),
    ]),
  ),
});

function encodeValue(value: Value) {
  if (value === null) return { type: "null" };
  if (typeof value === "string") return { type: "text", value };
  if (Number.isInteger(value)) return { type: "integer", value: String(value) };
  return { type: "float", value };
}

function decodeValue(value: z.infer<typeof valueSchema>): Value {
  switch (value.type) {
    case "null":
      return null;
    case "integer":
      return Number(value.value);
    case "float":
    case "text":
      return value.value;
    case "blob":
      return value.base64;
  }
}

function pipelineUrl(): string {
  const base = env.TURSO_DATABASE_URL.replace(
    /^(libsql|turso):/,
    "https:",
  ).replace(/\/$/, "");
  return `${base}/v2/pipeline`;
}

export type Statement = { sql: string; args?: Value[] };
export type BatchResults<T extends readonly Statement[]> = {
  -readonly [K in keyof T]: QueryResult;
};

function encodeStatement({ sql, args = [] }: Statement) {
  return { sql, args: args.map(encodeValue) };
}

function decodeResult({
  cols,
  rows,
  affected_row_count,
  last_insert_rowid,
}: z.infer<typeof stmtResultSchema>): QueryResult {
  return {
    rows: rows.map((row) =>
      Object.fromEntries(
        row.map((value, index) => [
          cols[index]?.name ?? String(index),
          decodeValue(value),
        ]),
      ),
    ),
    rowsAffected: affected_row_count,
    lastInsertRowId:
      last_insert_rowid === null ? null : Number(last_insert_rowid),
  };
}

async function pipeline(request: object) {
  const response = await fetch(pipelineUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
    },
    body: JSON.stringify({ requests: [request, { type: "close" }] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Turso API error: ${response.status} ${response.statusText}`,
    );
  }

  const [result] = pipelineResponseSchema.parse(await response.json()).results;

  if (!result) {
    throw new Error("Turso returned no results");
  }
  if (result.type === "error") {
    throw new Error(`Turso query error: ${result.error.message}`);
  }
  return result.response;
}

export async function query(
  sql: string,
  args: Value[] = [],
): Promise<QueryResult> {
  const response = await pipeline({
    type: "execute",
    stmt: encodeStatement({ sql, args }),
  });
  if (response.type !== "execute") {
    throw new Error(`Turso returned unexpected ${response.type} result`);
  }
  return decodeResult(response.result);
}

/** Runs the statements in one request and one transaction: all of them apply, or none. */
export async function batch<const T extends readonly Statement[]>(
  statements: T,
): Promise<BatchResults<T>> {
  const commitStep = statements.length + 1;
  const response = await pipeline({
    type: "batch",
    batch: {
      steps: [
        { stmt: { sql: "BEGIN" } },
        ...statements.map((statement, index) => ({
          condition: { type: "ok", step: index },
          stmt: encodeStatement(statement),
        })),
        {
          condition: { type: "ok", step: commitStep - 1 },
          stmt: { sql: "COMMIT" },
        },
        {
          condition: { type: "not", cond: { type: "ok", step: commitStep } },
          stmt: { sql: "ROLLBACK" },
        },
      ],
    },
  });
  if (response.type !== "batch") {
    throw new Error(`Turso returned unexpected ${response.type} result`);
  }

  const { step_results, step_errors } = response.result;
  const failed = step_errors
    .slice(0, commitStep + 1)
    .findIndex((e) => e !== null);
  const error = step_errors[failed];
  if (error) {
    const step =
      failed === 0
        ? "BEGIN"
        : failed === commitStep
          ? "COMMIT"
          : `statement ${failed}`;
    throw new Error(`Turso query error in ${step}: ${error.message}`);
  }
  return z
    .array(stmtResultSchema)
    .parse(step_results.slice(1, commitStep))
    .map(decodeResult) as BatchResults<T>;
}

export function keepWarm(): void {
  getGlobal("simon.dev/turso-keep-warm", () =>
    setInterval(() => {
      query("SELECT 1").catch((err: unknown) => {
        log.warn({ err }, "Turso keep-warm query failed");
      });
    }, KEEP_WARM_MS).unref(),
  );
}
