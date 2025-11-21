import { cacheLife } from "next/cache";
import { describe, expect, it, vi } from "vitest";

import { getStats, type WakaTimeStats } from "@/lib/wakaTime";

import { getWakaTimeStats } from "./wakaTime";

vi.mock(import("@/lib/wakaTime"), () => ({ getStats: vi.fn() }));

vi.mock(import("next/cache"), () => ({ cacheLife: vi.fn() }));

describe("getWakaTimeStats", () => {
  it("should return success status with stats when getStats succeeds", async () => {
    const mockStats: WakaTimeStats = [
      { name: "TypeScript", percent: 45.5 },
      { name: "JavaScript", percent: 30.2 },
      { name: "JSON", percent: 15.3 },
    ];

    vi.mocked(getStats).mockResolvedValue(mockStats);

    const result = await getWakaTimeStats();

    expect(result).toEqual({ status: "ok", stats: mockStats });
    expect(cacheLife).toHaveBeenCalledWith("hours");
  });

  it("should return error status when getStats fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mockError = new Error("Network error");
    vi.mocked(getStats).mockRejectedValue(mockError);

    const result = await getWakaTimeStats();

    expect(result).toEqual({
      status: "error",
      error: "Failed to fetch WakaTime stats",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching WakaTime stats:",
      mockError,
    );
    expect(cacheLife).toHaveBeenCalledWith("seconds");

    consoleErrorSpy.mockRestore();
  });
});
