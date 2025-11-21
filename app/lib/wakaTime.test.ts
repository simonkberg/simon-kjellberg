import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/node";

import { getStats } from "./wakaTime";

const WAKATIME_URL =
  "https://wakatime.com/share/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json";

describe("getStats", () => {
  it("should fetch and parse WakaTime stats successfully", async () => {
    server.use(
      http.get(WAKATIME_URL, () =>
        HttpResponse.json({
          data: [
            { name: "TypeScript", percent: 45.5 },
            { name: "JavaScript", percent: 30.2 },
            { name: "JSON", percent: 15.3 },
          ],
        }),
      ),
    );

    const stats = await getStats();

    expect(stats).toEqual([
      { name: "TypeScript", percent: 45.5 },
      { name: "JavaScript", percent: 30.2 },
      { name: "JSON", percent: 15.3 },
    ]);
  });

  it("should handle invalid response schema", async () => {
    server.use(
      http.get(WAKATIME_URL, () =>
        HttpResponse.json({ data: [{ invalid: "data" }] }),
      ),
    );

    await expect(getStats()).rejects.toThrow();
  });

  it("should handle network errors", async () => {
    server.use(http.get(WAKATIME_URL, () => HttpResponse.error()));

    await expect(getStats()).rejects.toThrow();
  });

  it("should configure fetch with 3 second timeout", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

    server.use(
      http.get(WAKATIME_URL, () =>
        HttpResponse.json({ data: [{ name: "TypeScript", percent: 45.5 }] }),
      ),
    );

    await getStats();

    expect(timeoutSpy).toHaveBeenCalledWith(3000);
    timeoutSpy.mockRestore();
  });

  it.each([
    { status: 404, statusText: "Not Found" },
    { status: 429, statusText: "Too Many Requests" },
    { status: 500, statusText: "Internal Server Error" },
    { status: 503, statusText: "Service Unavailable" },
  ])("should handle HTTP $status error", async ({ status, statusText }) => {
    server.use(
      http.get(
        WAKATIME_URL,
        () => new HttpResponse(null, { status, statusText }),
      ),
    );

    await expect(getStats()).rejects.toThrow(
      `WakaTime API error: ${status} ${statusText}`,
    );
  });
});
