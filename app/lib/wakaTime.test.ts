import { http, HttpResponse, type JsonBodyType } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/node";

import { getStats, type Period, periods } from "./wakaTime";

const WAKATIME_BASE_URL = "https://wakatime.com/share/@simonkberg";
const STATS_URLS: Record<Period, string> = {
  last_7_days: "b2bb44ec-d8bd-42ee-ad9d-8948172388d0.json",
  last_30_days: "2daa8cdd-2a7e-4deb-836f-b913a308a93a.json",
  last_year: "bdbe1607-6d0d-418c-aa98-9602535e8f6b.json",
  all_time: "b65f0e73-704a-44ce-9538-eee4fc913be8.json",
};

function statsRespond(
  body: JsonBodyType | Response,
  period: Period = "last_7_days",
) {
  server.use(
    http.get(`${WAKATIME_BASE_URL}/${STATS_URLS[period]}`, () =>
      body instanceof Response ? body : HttpResponse.json(body),
    ),
  );
}

describe("getStats", () => {
  it("should use last_7_days as the default period", async () => {
    const data = [
      { name: "TypeScript", percent: 45.5 },
      { name: "JavaScript", percent: 30.2 },
      { name: "JSON", percent: 15.3 },
    ];
    statsRespond({ data });

    const stats = await getStats();

    expect(stats).toEqual(data);
  });

  it.each(periods)("should fetch stats for period: %s", async (period) => {
    statsRespond({ data: [{ name: "TypeScript", percent: 50 }] }, period);

    const stats = await getStats(period);

    expect(stats).toEqual([{ name: "TypeScript", percent: 50 }]);
  });

  it("should limit results to specified limit", async () => {
    statsRespond({
      data: [
        { name: "TypeScript", percent: 40 },
        { name: "JavaScript", percent: 30 },
        { name: "JSON", percent: 15 },
        { name: "CSS", percent: 10 },
        { name: "HTML", percent: 5 },
      ],
    });

    const stats = await getStats("last_7_days", 3);

    expect(stats).toEqual([
      { name: "TypeScript", percent: 40 },
      { name: "JavaScript", percent: 30 },
      { name: "JSON", percent: 15 },
    ]);
  });

  it("should use default limit of 15", async () => {
    statsRespond({
      data: Array.from({ length: 20 }, (_, i) => ({
        name: `Language${i}`,
        percent: 5,
      })),
    });

    const stats = await getStats();

    expect(stats).toHaveLength(15);
  });

  it("should handle invalid response schema", async () => {
    statsRespond({ data: [{ invalid: "data" }] });

    await expect(getStats()).rejects.toThrow();
  });

  it("should handle network errors", async () => {
    statsRespond(HttpResponse.error());

    await expect(getStats()).rejects.toThrow();
  });

  it("should configure fetch with 3 second timeout", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    statsRespond({ data: [{ name: "TypeScript", percent: 45.5 }] });

    await getStats();

    expect(timeoutSpy).toHaveBeenCalledWith(3000);
  });

  it("should handle an HTTP error", async () => {
    statsRespond(
      new HttpResponse(null, {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    await expect(getStats()).rejects.toThrow(
      "WakaTime API error: 503 Service Unavailable",
    );
  });
});
