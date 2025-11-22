# Listening Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/listening` page showing Last.fm top tracks, artists, and albums with period filtering.

**Architecture:** Extend existing Last.fm library with three new API functions. Server actions use `"use cache"` with hourly revalidation. Simple server-rendered page with period selector as text links and three tables.

**Tech Stack:** Next.js 16 App Router, Zod validation, `"use cache"` directive, MSW for testing

---

## Task 1: Add Period Type

**Files:**

- Modify: `app/lib/lastfm.ts`

**Step 1: Add period type and validation**

Add after the imports in `app/lib/lastfm.ts`:

```typescript
export const periods = [
    "7day",
    "1month",
    "3month",
    "6month",
    "12month",
    "overall",
] as const;

export type Period = (typeof periods)[number];

export function isValidPeriod(value: unknown): value is Period {
    return periods.includes(value as Period);
}
```

**Step 2: Run lint to verify**

Run: `pnpm lint:tsc`
Expected: No errors

**Step 3: Commit**

```bash
git add app/lib/lastfm.ts
git commit -m "feat(lastfm): add period type and validation"
```

---

## Task 2: Add userGetTopTracks Function

**Files:**

- Test: `app/lib/lastfm.test.ts`
- Modify: `app/lib/lastfm.ts`

**Step 1: Write failing test**

Add to `app/lib/lastfm.test.ts`:

```typescript
import { userGetTopTracks } from "./lastfm";

// Add to imports at top
```

Then add new describe block:

```typescript
describe("userGetTopTracks", () => {
    it("should fetch and parse top tracks successfully", async () => {
        server.use(
            http.get(LASTFM_BASE_URL, ({ request }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get("method")).toBe(
                    "user.gettoptracks",
                );
                expect(url.searchParams.get("api_key")).toBe(
                    "test-last-fm-api-key",
                );
                expect(url.searchParams.get("user")).toBe("testuser");
                expect(url.searchParams.get("period")).toBe("7day");
                expect(url.searchParams.get("limit")).toBe("10");

                return HttpResponse.json({
                    toptracks: {
                        track: [
                            {
                                name: "Test Track",
                                playcount: "100",
                                artist: { name: "Test Artist" },
                                "@attr": { rank: "1" },
                            },
                            {
                                name: "Another Track",
                                playcount: "50",
                                artist: { name: "Another Artist" },
                                "@attr": { rank: "2" },
                            },
                        ],
                    },
                });
            }),
        );

        const tracks = await userGetTopTracks("testuser", {
            period: "7day",
            limit: 10,
        });

        expect(tracks).toEqual([
            {
                name: "Test Track",
                artist: "Test Artist",
                playcount: 100,
                rank: 1,
            },
            {
                name: "Another Track",
                artist: "Another Artist",
                playcount: 50,
                rank: 2,
            },
        ]);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: FAIL - `userGetTopTracks` is not exported

**Step 3: Write implementation**

Add to `app/lib/lastfm.ts`:

```typescript
const userGetTopTracksResponseSchema = z
    .object({
        toptracks: z.object({
            track: z.array(
                z
                    .object({
                        name: z.string(),
                        playcount: z.string().transform(Number),
                        artist: z.object({ name: z.string() }),
                        "@attr": z.object({
                            rank: z.string().transform(Number),
                        }),
                    })
                    .transform((data) => ({
                        name: data.name,
                        artist: data.artist.name,
                        playcount: data.playcount,
                        rank: data["@attr"].rank,
                    })),
            ),
        }),
    })
    .transform((data) => data.toptracks.track);

export type UserGetTopTracksResponse = z.infer<
    typeof userGetTopTracksResponseSchema
>;

export async function userGetTopTracks(
    user: string,
    params: { period: Period; limit: number },
): Promise<UserGetTopTracksResponse> {
    return call("user.gettoptracks", userGetTopTracksResponseSchema, {
        user,
        ...params,
    });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/lastfm.ts app/lib/lastfm.test.ts
git commit -m "feat(lastfm): add userGetTopTracks function"
```

---

## Task 3: Add userGetTopArtists Function

**Files:**

- Test: `app/lib/lastfm.test.ts`
- Modify: `app/lib/lastfm.ts`

**Step 1: Write failing test**

Add import and describe block to `app/lib/lastfm.test.ts`:

```typescript
import { userGetTopArtists } from "./lastfm";

// Add to imports at top
```

```typescript
describe("userGetTopArtists", () => {
    it("should fetch and parse top artists successfully", async () => {
        server.use(
            http.get(LASTFM_BASE_URL, ({ request }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get("method")).toBe(
                    "user.gettopartists",
                );
                expect(url.searchParams.get("user")).toBe("testuser");
                expect(url.searchParams.get("period")).toBe("1month");
                expect(url.searchParams.get("limit")).toBe("10");

                return HttpResponse.json({
                    topartists: {
                        artist: [
                            {
                                name: "Test Artist",
                                playcount: "500",
                                "@attr": { rank: "1" },
                            },
                            {
                                name: "Another Artist",
                                playcount: "300",
                                "@attr": { rank: "2" },
                            },
                        ],
                    },
                });
            }),
        );

        const artists = await userGetTopArtists("testuser", {
            period: "1month",
            limit: 10,
        });

        expect(artists).toEqual([
            { name: "Test Artist", playcount: 500, rank: 1 },
            { name: "Another Artist", playcount: 300, rank: 2 },
        ]);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: FAIL - `userGetTopArtists` is not exported

**Step 3: Write implementation**

Add to `app/lib/lastfm.ts`:

```typescript
const userGetTopArtistsResponseSchema = z
    .object({
        topartists: z.object({
            artist: z.array(
                z
                    .object({
                        name: z.string(),
                        playcount: z.string().transform(Number),
                        "@attr": z.object({
                            rank: z.string().transform(Number),
                        }),
                    })
                    .transform((data) => ({
                        name: data.name,
                        playcount: data.playcount,
                        rank: data["@attr"].rank,
                    })),
            ),
        }),
    })
    .transform((data) => data.topartists.artist);

export type UserGetTopArtistsResponse = z.infer<
    typeof userGetTopArtistsResponseSchema
>;

export async function userGetTopArtists(
    user: string,
    params: { period: Period; limit: number },
): Promise<UserGetTopArtistsResponse> {
    return call("user.gettopartists", userGetTopArtistsResponseSchema, {
        user,
        ...params,
    });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/lastfm.ts app/lib/lastfm.test.ts
git commit -m "feat(lastfm): add userGetTopArtists function"
```

---

## Task 4: Add userGetTopAlbums Function

**Files:**

- Test: `app/lib/lastfm.test.ts`
- Modify: `app/lib/lastfm.ts`

**Step 1: Write failing test**

Add import and describe block to `app/lib/lastfm.test.ts`:

```typescript
import { userGetTopAlbums } from "./lastfm";

// Add to imports at top
```

```typescript
describe("userGetTopAlbums", () => {
    it("should fetch and parse top albums successfully", async () => {
        server.use(
            http.get(LASTFM_BASE_URL, ({ request }) => {
                const url = new URL(request.url);
                expect(url.searchParams.get("method")).toBe(
                    "user.gettopalbums",
                );
                expect(url.searchParams.get("user")).toBe("testuser");
                expect(url.searchParams.get("period")).toBe("3month");
                expect(url.searchParams.get("limit")).toBe("10");

                return HttpResponse.json({
                    topalbums: {
                        album: [
                            {
                                name: "Test Album",
                                playcount: "200",
                                artist: { name: "Test Artist" },
                                "@attr": { rank: "1" },
                            },
                            {
                                name: "Another Album",
                                playcount: "150",
                                artist: { name: "Another Artist" },
                                "@attr": { rank: "2" },
                            },
                        ],
                    },
                });
            }),
        );

        const albums = await userGetTopAlbums("testuser", {
            period: "3month",
            limit: 10,
        });

        expect(albums).toEqual([
            {
                name: "Test Album",
                artist: "Test Artist",
                playcount: 200,
                rank: 1,
            },
            {
                name: "Another Album",
                artist: "Another Artist",
                playcount: 150,
                rank: 2,
            },
        ]);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: FAIL - `userGetTopAlbums` is not exported

**Step 3: Write implementation**

Add to `app/lib/lastfm.ts`:

```typescript
const userGetTopAlbumsResponseSchema = z
    .object({
        topalbums: z.object({
            album: z.array(
                z
                    .object({
                        name: z.string(),
                        playcount: z.string().transform(Number),
                        artist: z.object({ name: z.string() }),
                        "@attr": z.object({
                            rank: z.string().transform(Number),
                        }),
                    })
                    .transform((data) => ({
                        name: data.name,
                        artist: data.artist.name,
                        playcount: data.playcount,
                        rank: data["@attr"].rank,
                    })),
            ),
        }),
    })
    .transform((data) => data.topalbums.album);

export type UserGetTopAlbumsResponse = z.infer<
    typeof userGetTopAlbumsResponseSchema
>;

export async function userGetTopAlbums(
    user: string,
    params: { period: Period; limit: number },
): Promise<UserGetTopAlbumsResponse> {
    return call("user.gettopalbums", userGetTopAlbumsResponseSchema, {
        user,
        ...params,
    });
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/lib/lastfm.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/lastfm.ts app/lib/lastfm.test.ts
git commit -m "feat(lastfm): add userGetTopAlbums function"
```

---

## Task 5: Add Server Actions with Caching

**Files:**

- Test: `app/actions/lastfm.test.ts`
- Modify: `app/actions/lastfm.ts`

**Step 1: Write failing tests**

Add imports and describe blocks to `app/actions/lastfm.test.ts`:

```typescript
import {
    userGetRecentTracks,
    userGetTopAlbums,
    userGetTopArtists,
    userGetTopTracks,
    type UserGetRecentTracksResponse,
    type UserGetTopAlbumsResponse,
    type UserGetTopArtistsResponse,
    type UserGetTopTracksResponse,
} from "@/lib/lastfm";

import {
    getRecentTracks,
    getTopAlbums,
    getTopArtists,
    getTopTracks,
} from "./lastfm";
```

Update the mock:

```typescript
vi.mock(import("@/lib/lastfm"), () => ({
    userGetRecentTracks: vi.fn(),
    userGetTopTracks: vi.fn(),
    userGetTopArtists: vi.fn(),
    userGetTopAlbums: vi.fn(),
}));
```

Add test blocks:

```typescript
describe("getTopTracks", () => {
    it("should return success status with tracks", async () => {
        const mockTracks: UserGetTopTracksResponse = [
            { name: "Track 1", artist: "Artist 1", playcount: 100, rank: 1 },
            { name: "Track 2", artist: "Artist 2", playcount: 50, rank: 2 },
        ];

        vi.mocked(userGetTopTracks).mockResolvedValue(mockTracks);

        const result = await getTopTracks("7day");

        expect(userGetTopTracks).toHaveBeenCalledWith("magijo", {
            period: "7day",
            limit: 10,
        });
        expect(result).toEqual({ status: "ok", tracks: mockTracks });
    });

    it("should return error status when fetch fails", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        vi.mocked(userGetTopTracks).mockRejectedValue(new Error("API error"));

        const result = await getTopTracks("7day");

        expect(result).toEqual({
            status: "error",
            error: "Failed to fetch top tracks",
        });

        consoleErrorSpy.mockRestore();
    });
});

describe("getTopArtists", () => {
    it("should return success status with artists", async () => {
        const mockArtists: UserGetTopArtistsResponse = [
            { name: "Artist 1", playcount: 500, rank: 1 },
            { name: "Artist 2", playcount: 300, rank: 2 },
        ];

        vi.mocked(userGetTopArtists).mockResolvedValue(mockArtists);

        const result = await getTopArtists("1month");

        expect(userGetTopArtists).toHaveBeenCalledWith("magijo", {
            period: "1month",
            limit: 10,
        });
        expect(result).toEqual({ status: "ok", artists: mockArtists });
    });

    it("should return error status when fetch fails", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        vi.mocked(userGetTopArtists).mockRejectedValue(new Error("API error"));

        const result = await getTopArtists("1month");

        expect(result).toEqual({
            status: "error",
            error: "Failed to fetch top artists",
        });

        consoleErrorSpy.mockRestore();
    });
});

describe("getTopAlbums", () => {
    it("should return success status with albums", async () => {
        const mockAlbums: UserGetTopAlbumsResponse = [
            { name: "Album 1", artist: "Artist 1", playcount: 200, rank: 1 },
            { name: "Album 2", artist: "Artist 2", playcount: 150, rank: 2 },
        ];

        vi.mocked(userGetTopAlbums).mockResolvedValue(mockAlbums);

        const result = await getTopAlbums("3month");

        expect(userGetTopAlbums).toHaveBeenCalledWith("magijo", {
            period: "3month",
            limit: 10,
        });
        expect(result).toEqual({ status: "ok", albums: mockAlbums });
    });

    it("should return error status when fetch fails", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        vi.mocked(userGetTopAlbums).mockRejectedValue(new Error("API error"));

        const result = await getTopAlbums("3month");

        expect(result).toEqual({
            status: "error",
            error: "Failed to fetch top albums",
        });

        consoleErrorSpy.mockRestore();
    });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test app/actions/lastfm.test.ts`
Expected: FAIL - functions not exported

**Step 3: Write implementation**

Add to `app/actions/lastfm.ts`:

```typescript
import { cacheLife } from "next/cache";

import {
    type Period,
    userGetRecentTracks,
    userGetTopAlbums,
    userGetTopArtists,
    userGetTopTracks,
    type UserGetRecentTracksResponse,
    type UserGetTopAlbumsResponse,
    type UserGetTopArtistsResponse,
    type UserGetTopTracksResponse,
} from "@/lib/lastfm";
```

Add type exports:

```typescript
export type TopTrack = UserGetTopTracksResponse[number];
export type TopArtist = UserGetTopArtistsResponse[number];
export type TopAlbum = UserGetTopAlbumsResponse[number];

export type GetTopTracksResult =
    | { status: "ok"; tracks: TopTrack[] }
    | { status: "error"; error: string };

export type GetTopArtistsResult =
    | { status: "ok"; artists: TopArtist[] }
    | { status: "error"; error: string };

export type GetTopAlbumsResult =
    | { status: "ok"; albums: TopAlbum[] }
    | { status: "error"; error: string };
```

Add functions:

```typescript
export async function getTopTracks(
    period: Period,
): Promise<GetTopTracksResult> {
    "use cache";
    cacheLife("hours");

    try {
        const tracks = await userGetTopTracks("magijo", { period, limit: 10 });
        return { status: "ok", tracks };
    } catch (error) {
        console.error("Error fetching top tracks:", error);
        return { status: "error", error: "Failed to fetch top tracks" };
    }
}

export async function getTopArtists(
    period: Period,
): Promise<GetTopArtistsResult> {
    "use cache";
    cacheLife("hours");

    try {
        const artists = await userGetTopArtists("magijo", {
            period,
            limit: 10,
        });
        return { status: "ok", artists };
    } catch (error) {
        console.error("Error fetching top artists:", error);
        return { status: "error", error: "Failed to fetch top artists" };
    }
}

export async function getTopAlbums(
    period: Period,
): Promise<GetTopAlbumsResult> {
    "use cache";
    cacheLife("hours");

    try {
        const albums = await userGetTopAlbums("magijo", { period, limit: 10 });
        return { status: "ok", albums };
    } catch (error) {
        console.error("Error fetching top albums:", error);
        return { status: "error", error: "Failed to fetch top albums" };
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test app/actions/lastfm.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/actions/lastfm.ts app/actions/lastfm.test.ts
git commit -m "feat(lastfm): add cached server actions for top tracks/artists/albums"
```

---

## Task 6: Add Table Styles to global.css

**Files:**

- Modify: `app/global.css`

**Step 1: Add table styles**

Add at the end of `app/global.css`:

```css
table {
    width: 100%;
    border-collapse: collapse;
    font-size: inherit;
}

th {
    text-align: left;
    font-weight: normal;
    color: var(--color-muted);
    border-bottom: 1px solid var(--color-muted);
    padding: 0.25em 0.5em;
}

td {
    padding: 0.25em 0.5em;
    border-bottom: 1px solid var(--color-whitesmoke);
}

tr:last-child td {
    border-bottom: none;
}
```

**Step 2: Run lint to verify**

Run: `pnpm lint:prettier`
Expected: No errors

**Step 3: Commit**

```bash
git add app/global.css
git commit -m "style: add table styles"
```

---

## Task 7: Create PeriodSelector Component

**Files:**

- Create: `app/components/PeriodSelector.tsx`
- Test: `app/components/PeriodSelector.test.tsx`

**Step 1: Write failing test**

Create `app/components/PeriodSelector.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PeriodSelector } from "./PeriodSelector";

describe("PeriodSelector", () => {
  it("should render all period options", () => {
    render(<PeriodSelector current="overall" />);

    expect(screen.getByRole("link", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 month" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "3 months" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "6 months" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 year" })).toBeInTheDocument();
    expect(screen.getByText("all time")).toBeInTheDocument();
  });

  it("should not render current period as a link", () => {
    render(<PeriodSelector current="7day" />);

    expect(screen.getByText("7 days")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "7 days" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "all time" })).toBeInTheDocument();
  });

  it("should link to correct URLs", () => {
    render(<PeriodSelector current="overall" />);

    expect(screen.getByRole("link", { name: "7 days" })).toHaveAttribute(
      "href",
      "/listening?period=7day",
    );
    expect(screen.getByRole("link", { name: "1 month" })).toHaveAttribute(
      "href",
      "/listening?period=1month",
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/components/PeriodSelector.test.tsx`
Expected: FAIL - module not found

**Step 3: Write implementation**

Create `app/components/PeriodSelector.tsx`:

```typescript
import type { Period } from "@/lib/lastfm";

const periodLabels: Record<Period, string> = {
  "7day": "7 days",
  "1month": "1 month",
  "3month": "3 months",
  "6month": "6 months",
  "12month": "1 year",
  overall: "all time",
};

const periodOrder: Period[] = [
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
  "overall",
];

export interface PeriodSelectorProps {
  current: Period;
}

export const PeriodSelector = ({ current }: PeriodSelectorProps) => (
  <p>
    {periodOrder.map((period, index) => (
      <span key={period}>
        {index > 0 && " | "}
        {period === current ? (
          periodLabels[period]
        ) : (
          <a href={`/listening?period=${period}`}>{periodLabels[period]}</a>
        )}
      </span>
    ))}
  </p>
);
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/components/PeriodSelector.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/PeriodSelector.tsx app/components/PeriodSelector.test.tsx
git commit -m "feat: add PeriodSelector component"
```

---

## Task 8: Create TopTracksTable Component

**Files:**

- Create: `app/components/TopTracksTable.tsx`
- Test: `app/components/TopTracksTable.test.tsx`

**Step 1: Write failing test**

Create `app/components/TopTracksTable.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GetTopTracksResult } from "@/actions/lastfm";

import { TopTracksTable } from "./TopTracksTable";

describe("TopTracksTable", () => {
  it("should render tracks in a table", () => {
    const result: GetTopTracksResult = {
      status: "ok",
      tracks: [
        { name: "Track 1", artist: "Artist 1", playcount: 100, rank: 1 },
        { name: "Track 2", artist: "Artist 2", playcount: 50, rank: 2 },
      ],
    };

    render(<TopTracksTable result={result} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Track 1")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Track 2")).toBeInTheDocument();
  });

  it("should render error message on failure", () => {
    const result: GetTopTracksResult = {
      status: "error",
      error: "Failed to fetch",
    };

    render(<TopTracksTable result={result} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/components/TopTracksTable.test.tsx`
Expected: FAIL - module not found

**Step 3: Write implementation**

Create `app/components/TopTracksTable.tsx`:

```typescript
import type { GetTopTracksResult } from "@/actions/lastfm";

export interface TopTracksTableProps {
  result: GetTopTracksResult;
}

export const TopTracksTable = ({ result }: TopTracksTableProps) => {
  if (result.status === "error") {
    return <p>Top tracks are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Track</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.tracks.map((track) => (
          <tr key={`${track.rank}-${track.name}`}>
            <td>{track.rank}</td>
            <td>{track.name}</td>
            <td>{track.artist}</td>
            <td>{track.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/components/TopTracksTable.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/TopTracksTable.tsx app/components/TopTracksTable.test.tsx
git commit -m "feat: add TopTracksTable component"
```

---

## Task 9: Create TopArtistsTable Component

**Files:**

- Create: `app/components/TopArtistsTable.tsx`
- Test: `app/components/TopArtistsTable.test.tsx`

**Step 1: Write failing test**

Create `app/components/TopArtistsTable.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GetTopArtistsResult } from "@/actions/lastfm";

import { TopArtistsTable } from "./TopArtistsTable";

describe("TopArtistsTable", () => {
  it("should render artists in a table", () => {
    const result: GetTopArtistsResult = {
      status: "ok",
      artists: [
        { name: "Artist 1", playcount: 500, rank: 1 },
        { name: "Artist 2", playcount: 300, rank: 2 },
      ],
    };

    render(<TopArtistsTable result={result} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Artist 2")).toBeInTheDocument();
  });

  it("should render error message on failure", () => {
    const result: GetTopArtistsResult = {
      status: "error",
      error: "Failed to fetch",
    };

    render(<TopArtistsTable result={result} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/components/TopArtistsTable.test.tsx`
Expected: FAIL - module not found

**Step 3: Write implementation**

Create `app/components/TopArtistsTable.tsx`:

```typescript
import type { GetTopArtistsResult } from "@/actions/lastfm";

export interface TopArtistsTableProps {
  result: GetTopArtistsResult;
}

export const TopArtistsTable = ({ result }: TopArtistsTableProps) => {
  if (result.status === "error") {
    return <p>Top artists are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.artists.map((artist) => (
          <tr key={`${artist.rank}-${artist.name}`}>
            <td>{artist.rank}</td>
            <td>{artist.name}</td>
            <td>{artist.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/components/TopArtistsTable.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/TopArtistsTable.tsx app/components/TopArtistsTable.test.tsx
git commit -m "feat: add TopArtistsTable component"
```

---

## Task 10: Create TopAlbumsTable Component

**Files:**

- Create: `app/components/TopAlbumsTable.tsx`
- Test: `app/components/TopAlbumsTable.test.tsx`

**Step 1: Write failing test**

Create `app/components/TopAlbumsTable.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { GetTopAlbumsResult } from "@/actions/lastfm";

import { TopAlbumsTable } from "./TopAlbumsTable";

describe("TopAlbumsTable", () => {
  it("should render albums in a table", () => {
    const result: GetTopAlbumsResult = {
      status: "ok",
      albums: [
        { name: "Album 1", artist: "Artist 1", playcount: 200, rank: 1 },
        { name: "Album 2", artist: "Artist 2", playcount: 150, rank: 2 },
      ],
    };

    render(<TopAlbumsTable result={result} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Album 1")).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("Album 2")).toBeInTheDocument();
  });

  it("should render error message on failure", () => {
    const result: GetTopAlbumsResult = {
      status: "error",
      error: "Failed to fetch",
    };

    render(<TopAlbumsTable result={result} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test app/components/TopAlbumsTable.test.tsx`
Expected: FAIL - module not found

**Step 3: Write implementation**

Create `app/components/TopAlbumsTable.tsx`:

```typescript
import type { GetTopAlbumsResult } from "@/actions/lastfm";

export interface TopAlbumsTableProps {
  result: GetTopAlbumsResult;
}

export const TopAlbumsTable = ({ result }: TopAlbumsTableProps) => {
  if (result.status === "error") {
    return <p>Top albums are temporarily unavailable :(</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Album</th>
          <th>Artist</th>
          <th>Plays</th>
        </tr>
      </thead>
      <tbody>
        {result.albums.map((album) => (
          <tr key={`${album.rank}-${album.name}`}>
            <td>{album.rank}</td>
            <td>{album.name}</td>
            <td>{album.artist}</td>
            <td>{album.playcount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test app/components/TopAlbumsTable.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/TopAlbumsTable.tsx app/components/TopAlbumsTable.test.tsx
git commit -m "feat: add TopAlbumsTable component"
```

---

## Task 11: Create Listening Page

**Files:**

- Create: `app/listening/page.tsx`

**Step 1: Create the page**

Create `app/listening/page.tsx`:

```typescript
import type { Metadata } from "next";

import {
  getTopAlbums,
  getTopArtists,
  getTopTracks,
} from "@/actions/lastfm";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Subtitle } from "@/components/Subtitle";
import { TopAlbumsTable } from "@/components/TopAlbumsTable";
import { TopArtistsTable } from "@/components/TopArtistsTable";
import { TopTracksTable } from "@/components/TopTracksTable";
import { isValidPeriod, type Period } from "@/lib/lastfm";

export const metadata: Metadata = {
  title: "Listening | simon.dev",
  description: "My listening statistics from Last.fm",
};

interface ListeningPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListeningPage({
  searchParams,
}: ListeningPageProps) {
  const params = await searchParams;
  const periodParam = params["period"];
  const period: Period =
    typeof periodParam === "string" && isValidPeriod(periodParam)
      ? periodParam
      : "overall";

  const [tracksResult, artistsResult, albumsResult] = await Promise.all([
    getTopTracks(period),
    getTopArtists(period),
    getTopAlbums(period),
  ]);

  return (
    <Page title="Listening">
      <section>
        <p>
          My listening statistics from{" "}
          <ExternalLink href="https://www.last.fm/user/magijo">
            Last.fm
          </ExternalLink>
          .
        </p>
        <PeriodSelector current={period} />
      </section>

      <section>
        <Heading level={2}>
          Top Tracks <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopTracksTable result={tracksResult} />
      </section>

      <section>
        <Heading level={2}>
          Top Artists <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopArtistsTable result={artistsResult} />
      </section>

      <section>
        <Heading level={2}>
          Top Albums <Subtitle>(Top 10)</Subtitle>
        </Heading>
        <TopAlbumsTable result={albumsResult} />
      </section>
    </Page>
  );
}
```

**Step 2: Run type check**

Run: `pnpm lint:tsc`
Expected: No errors

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add app/listening/page.tsx
git commit -m "feat: add listening page with top tracks/artists/albums"
```

---

## Task 12: Manual Testing and Final Verification

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Test the page**

Open browser to `http://localhost:3000/listening`

Verify:

- Page loads with three tables
- Period selector shows all options
- Current period is not a link
- Clicking period links changes data
- Tables display correctly

**Step 3: Run full lint**

Run: `pnpm lint`
Expected: All checks pass

**Step 4: Final commit if any adjustments**

Only if needed based on manual testing.
