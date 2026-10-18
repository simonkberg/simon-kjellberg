import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetGlobal } from "@/lib/global";
import { log } from "@/lib/log";
import { server } from "@/mocks/node";

import { batch, keepWarm, query } from "./turso";

vi.mock(import("server-only"), () => ({}));

const PIPELINE_URL = "https://test-db.turso.io/v2/pipeline";

function pipelineResponse(result: Record<string, unknown> = {}) {
  return {
    results: [
      {
        type: "ok",
        response: {
          type: "execute",
          result: {
            cols: [],
            rows: [],
            affected_row_count: 0,
            last_insert_rowid: null,
            ...result,
          },
        },
      },
      { type: "ok", response: { type: "close" } },
    ],
  };
}

describe("query", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should send the statement with encoded args and the auth header", async () => {
    let body: unknown;
    server.use(
      http.post(PIPELINE_URL, async ({ request }) => {
        body = await request.json();
        expect(request.headers.get("authorization")).toBe(
          "Bearer test-turso-token",
        );
        expect(request.headers.get("content-type")).toBe("application/json");
        return HttpResponse.json(pipelineResponse());
      }),
    );

    await query("SELECT ?, ?, ?, ?", ["text", 42, 1.5, null]);

    expect(body).toEqual({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: "SELECT ?, ?, ?, ?",
            args: [
              { type: "text", value: "text" },
              { type: "integer", value: "42" },
              { type: "float", value: 1.5 },
              { type: "null" },
            ],
          },
        },
        { type: "close" },
      ],
    });
  });

  it("should decode rows into objects keyed by column name", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json(
          pipelineResponse({
            cols: [
              { name: "id" },
              { name: "name" },
              { name: "score" },
              { name: "missing" },
              { name: null },
            ],
            rows: [
              [
                { type: "integer", value: "7" },
                { type: "text", value: "seven" },
                { type: "float", value: 0.5 },
                { type: "null" },
                { type: "blob", base64: "AQI=" },
              ],
            ],
            affected_row_count: 1,
            last_insert_rowid: "7",
          }),
        ),
      ),
    );

    await expect(query("SELECT 1")).resolves.toEqual({
      rows: [{ id: 7, name: "seven", score: 0.5, missing: null, 4: "AQI=" }],
      rowsAffected: 1,
      lastInsertRowId: 7,
    });
  });

  it("should throw on HTTP errors", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.text("nope", { status: 500, statusText: "Server Error" }),
      ),
    );

    await expect(query("SELECT 1")).rejects.toThrow(
      "Turso API error: 500 Server Error",
    );
  });

  it("should throw on statement errors", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json({
          results: [
            { type: "error", error: { message: "no such table: nope" } },
            { type: "ok", response: { type: "close" } },
          ],
        }),
      ),
    );

    await expect(query("SELECT * FROM nope")).rejects.toThrow(
      "Turso query error: no such table: nope",
    );
  });

  it("should throw when the first result is not an execute result", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json({
          results: [{ type: "ok", response: { type: "close" } }],
        }),
      ),
    );

    await expect(query("SELECT 1")).rejects.toThrow(
      "Turso returned unexpected close result",
    );
  });

  it("should fall back to the column index when a value has no column", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json(
          pipelineResponse({
            cols: [{ name: "id" }],
            rows: [
              [
                { type: "integer", value: "1" },
                { type: "text", value: "extra" },
              ],
            ],
          }),
        ),
      ),
    );

    await expect(query("SELECT 1")).resolves.toMatchObject({
      rows: [{ id: 1, 1: "extra" }],
    });
  });

  it("should throw when the response has no results", async () => {
    server.use(
      http.post(PIPELINE_URL, () => HttpResponse.json({ results: [] })),
    );

    await expect(query("SELECT 1")).rejects.toThrow(
      "Turso returned no results",
    );
  });

  it.each(["libsql", "turso"])(
    "should rewrite %s URLs to https",
    async (scheme) => {
      vi.stubEnv("TURSO_DATABASE_URL", `${scheme}://other-db.turso.io/`);
      vi.resetModules();
      const { query: freshQuery } = await import("./turso");

      server.use(
        http.post("https://other-db.turso.io/v2/pipeline", () =>
          HttpResponse.json(pipelineResponse()),
        ),
      );

      await expect(freshQuery("SELECT 1")).resolves.toMatchObject({ rows: [] });
    },
  );
});

describe("batch", () => {
  function stmtResult(value: number) {
    return {
      cols: [{ name: "n" }],
      rows: [[{ type: "integer", value: String(value) }]],
      affected_row_count: 0,
      last_insert_rowid: null,
    };
  }

  function batchResponse(
    stepResults: unknown[],
    stepErrors: unknown[] = stepResults.map(() => null),
  ) {
    return {
      results: [
        {
          type: "ok",
          response: {
            type: "batch",
            result: { step_results: stepResults, step_errors: stepErrors },
          },
        },
        { type: "ok", response: { type: "close" } },
      ],
    };
  }

  it("should run the statements in one transaction that rolls back on failure", async () => {
    let body: unknown;
    server.use(
      http.post(PIPELINE_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          batchResponse([
            stmtResult(0),
            stmtResult(1),
            stmtResult(2),
            stmtResult(0),
            null,
          ]),
        );
      }),
    );

    await expect(
      batch([{ sql: "SELECT ?", args: [1] }, { sql: "SELECT 2" }]),
    ).resolves.toEqual([
      { rows: [{ n: 1 }], rowsAffected: 0, lastInsertRowId: null },
      { rows: [{ n: 2 }], rowsAffected: 0, lastInsertRowId: null },
    ]);
    expect(body).toEqual({
      requests: [
        {
          type: "batch",
          batch: {
            steps: [
              { stmt: { sql: "BEGIN" } },
              {
                condition: { type: "ok", step: 0 },
                stmt: {
                  sql: "SELECT ?",
                  args: [{ type: "integer", value: "1" }],
                },
              },
              {
                condition: { type: "ok", step: 1 },
                stmt: { sql: "SELECT 2", args: [] },
              },
              { condition: { type: "ok", step: 2 }, stmt: { sql: "COMMIT" } },
              {
                condition: { type: "not", cond: { type: "ok", step: 3 } },
                stmt: { sql: "ROLLBACK" },
              },
            ],
          },
        },
        { type: "close" },
      ],
    });
  });

  it("should name the statement that failed", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json(
          batchResponse(
            [stmtResult(0), stmtResult(1), null, null, stmtResult(0)],
            [null, null, { message: "no such table: nope" }, null, null],
          ),
        ),
      ),
    );

    await expect(
      batch([{ sql: "SELECT 1" }, { sql: "SELECT * FROM nope" }]),
    ).rejects.toThrow("Turso query error in statement 2: no such table: nope");
  });

  it("should throw when the transaction can't begin", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json(
          batchResponse(
            [null, null, null, null],
            [
              { message: "database is locked" },
              null,
              null,
              { message: "cannot rollback - no transaction is active" },
            ],
          ),
        ),
      ),
    );

    await expect(batch([{ sql: "SELECT 1" }])).rejects.toThrow(
      "Turso query error in BEGIN: database is locked",
    );
  });

  it("should throw when the result is not a batch result", async () => {
    server.use(
      http.post(PIPELINE_URL, () => HttpResponse.json(pipelineResponse())),
    );

    await expect(batch([{ sql: "SELECT 1" }])).rejects.toThrow(
      "Turso returned unexpected execute result",
    );
  });

  it("should throw when the commit fails", async () => {
    server.use(
      http.post(PIPELINE_URL, () =>
        HttpResponse.json(
          batchResponse(
            [stmtResult(0), stmtResult(1), null, stmtResult(0)],
            [null, null, { message: "database is locked" }, null],
          ),
        ),
      ),
    );

    await expect(batch([{ sql: "SELECT 1" }])).rejects.toThrow(
      "Turso query error in COMMIT: database is locked",
    );
  });
});

describe("keepWarm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval"] });
  });

  afterEach(() => {
    resetGlobal("simon.dev/turso-keep-warm");
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should query Turso every minute", async () => {
    const statements: unknown[] = [];
    server.use(
      http.post(PIPELINE_URL, async ({ request }) => {
        statements.push(await request.json());
        return HttpResponse.json(pipelineResponse());
      }),
    );

    keepWarm();
    keepWarm();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(59_999);
    expect(statements).toHaveLength(0);

    vi.advanceTimersByTime(1);
    await vi.waitFor(() => expect(statements).toHaveLength(1));
    expect(statements[0]).toEqual({
      requests: [
        { type: "execute", stmt: { sql: "SELECT 1", args: [] } },
        { type: "close" },
      ],
    });

    vi.advanceTimersByTime(60_000);
    await vi.waitFor(() => expect(statements).toHaveLength(2));
  });

  it("should log a failed query and keep going", async () => {
    const warn = vi.spyOn(log, "warn").mockImplementation(() => {});
    server.use(
      http.post(PIPELINE_URL, () => new HttpResponse(null, { status: 503 })),
    );

    keepWarm();
    vi.advanceTimersByTime(60_000);

    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Turso keep-warm query failed",
      ),
    );
  });
});
