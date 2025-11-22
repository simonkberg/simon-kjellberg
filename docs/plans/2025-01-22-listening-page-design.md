# Listening Page Design

## Overview

A new `/listening` page displaying Last.fm listening statistics: top tracks, top artists, and top albums with configurable time periods.

## Route

`/listening?period={7day|1month|3month|6month|12month|overall}`

Default period: `overall`

## Data Layer

### Last.fm Library (`app/lib/lastfm.ts`)

Add three new functions using the existing `call()` helper:

- `userGetTopTracks(user, { period, limit })` - returns `{ name, artist, playcount, rank }[]`
- `userGetTopArtists(user, { period, limit })` - returns `{ name, playcount, rank }[]`
- `userGetTopAlbums(user, { period, limit })` - returns `{ name, artist, playcount, rank }[]`

Each function includes Zod schema validation matching the Last.fm API response format.

### Server Actions (`app/actions/lastfm.ts`)

Add three cached server actions:

```tsx
"use server";

import { cacheLife } from "next/cache";

export async function getTopTracks(period: Period) {
    "use cache";
    cacheLife("hours");
    // fetch with user "magijo", limit 10
}

export async function getTopArtists(period: Period) {
    "use cache";
    cacheLife("hours");
    // fetch with user "magijo", limit 10
}

export async function getTopAlbums(period: Period) {
    "use cache";
    cacheLife("hours");
    // fetch with user "magijo", limit 10
}
```

Returns discriminated unions: `{ status: "ok"; data: T[] } | { status: "error"; error: string }`

## Page Structure

### `app/listening/page.tsx`

```tsx
export default async function ListeningPage({ searchParams }) {
    const period = validatePeriod(searchParams.period); // defaults to "overall"

    const [tracks, artists, albums] = await Promise.all([
        getTopTracks(period),
        getTopArtists(period),
        getTopAlbums(period),
    ]);

    return (
        <Page title="Listening">
            <PeriodSelector current={period} />
            <section>
                <Heading>Top Tracks</Heading>
                <TopTracksTable data={tracks} />
            </section>
            <section>
                <Heading>Top Artists</Heading>
                <TopArtistsTable data={artists} />
            </section>
            <section>
                <Heading>Top Albums</Heading>
                <TopAlbumsTable data={albums} />
            </section>
        </Page>
    );
}
```

## Components

### PeriodSelector

Text links for all periods. Current period shown without underline or bold.

```
7 days | 1 month | 3 months | 6 months | 1 year | all time
```

### Table Components

Three components rendering `<table>` elements:

- **TopTracksTable**: #, Track, Artist, Plays
- **TopArtistsTable**: #, Artist, Plays
- **TopAlbumsTable**: #, Album, Artist, Plays

## Styling

Table styles in `app/global.css`:

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

## Files to Create/Modify

1. `app/lib/lastfm.ts` - Add three API functions with Zod schemas
2. `app/actions/lastfm.ts` - Add three cached server actions
3. `app/listening/page.tsx` - New page component
4. `app/components/PeriodSelector.tsx` - Period link navigation
5. `app/components/TopTracksTable.tsx` - Tracks table
6. `app/components/TopArtistsTable.tsx` - Artists table
7. `app/components/TopAlbumsTable.tsx` - Albums table
8. `app/global.css` - Table styles
