# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This is a personal website built with Next.js 16 (App Router) that integrates with Slack for real-time chat functionality, WakaTime for coding statistics, and Last.fm for recently played music. The site is deployed as a standalone Docker container (configured for Heroku).

## Requirements

- Node.js 24
- Corepack enabled

If Corepack is not enabled, run `corepack enable` before installing dependencies.

## Development Commands

### Essential Commands

- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build production bundle (requires all environment variables to be set)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm lint:fix` - Auto-fix ESLint and Prettier issues
- `pnpm lint:eslint` - Run ESLint only
- `pnpm lint:prettier` - Run Prettier check only
- `pnpm test` - Run Vitest in watch mode

### Testing

- `pnpm test` - Run tests in watch mode
- `CI=true pnpm test` - Run tests once with coverage (as CI does)
- Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions
- Test files must be in the `app/` directory to be discovered
- Uses happy-dom as the test environment
- Coverage is automatically enabled in CI mode

### MCP Tools

MCP servers are configured in `.mcp.json`. Key guidance:

- Use the ESLint MCP tools for linting instead of running `pnpm lint` directly
- For Next.js questions or features, always consult the Next.js documentation via the `nextjs_docs` MCP tool

### Docker

- Build: `docker build -t simon.dev .`
- Run: `docker run -p 3000:3000 simon.dev`

## Architecture

### Directory Structure

- `app/` - Next.js App Router structure (all source code lives here)
    - `actions/` - Server actions for chat and WakaTime integration
    - `api/` - API routes (e.g., SSE endpoint for real-time chat updates)
    - `components/` - React components (co-located with tests)
    - `lib/` - Utility libraries and core logic
        - `messageParser/` - Slack message parsing with emoji support
    - `assets/` - Static assets (fonts, images)

### Key Technical Details

**Path Aliases:**

- `@/*` maps to `app/*` (configured in tsconfig.json)

**Environment Variables:**
Environment validation is handled via custom Zod validation in `app/lib/env.ts`. Required variables:

- `SESSION_SECRET` - Session encryption secret (auto-defaults to "unsafe_dev_secret" in development)
- `SLACK_CHANNEL` - Slack channel ID
- `SLACK_TOKEN` - Slack API token
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token
- `LAST_FM_API_KEY` - Last.fm API key for fetching recently played tracks

Set `SKIP_ENV_VALIDATION=true` to allow builds without all environment variables (used in CI/Docker). Configure development environment variables in `.env.local` (per Next.js convention).

**Slack Integration Architecture:**

- Uses both Slack Web API (for reading/posting messages) and RTM API (for real-time subscriptions)
- Message parsing pipeline: `textParser` → `emojiParser` converts Slack-formatted messages to React components
- DataLoader with LRU cache (100 entries) is used to batch and cache user info requests
- Server-Sent Events (SSE) endpoint at `/api/chat/sse` streams chat updates to clients
- Emoji data is extracted from `emoji-datasource` package at build time

**WakaTime Integration Architecture:**

- Simple fetch function in `app/lib/wakaTime.ts` retrieves coding statistics
- Uses public share URL (no API key required)
- 3 second timeout on API requests
- Returns language/framework usage percentages
- Zod schema validation for response data

**Last.fm Integration Architecture:**

- Client implementation in `app/lib/lastfm.ts` wraps Last.fm Web Services API
- Fetches recently played tracks via `user.getRecentTracks` method
- Supports pagination with `limit` and `page` parameters
- Includes now playing status and loved track indicators
- 3 second timeout on API requests
- Track data includes artist, album, play time, and MusicBrainz IDs

**Session Management:**

- Sessions use encrypted cookies via `app/lib/session.ts`
- Random usernames are generated using `app/lib/randomName.ts`
- Username-to-color mapping via `app/lib/stringToColor.ts` for consistent UI coloring

**Rate Limiting:**

- Chat messages are rate-limited using Upstash Redis (5 messages per 30 seconds per IP)
- Uses sliding window algorithm for accurate rate limiting
- Lazy initialization pattern for the rate limiter singleton
- Analytics and protection features enabled
- Identifier extraction via `app/lib/identifiers.ts` (IP address and user agent)

**React Compiler:**

- Enabled via `babel-plugin-react-compiler` in Next.js config
- Components are automatically optimized at build time

**TypeScript Configuration:**

- Extremely strict mode enabled (see tsconfig.json)
- Notable strictness: `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- `exactOptionalPropertyTypes` is disabled for better compatibility with optional fields and external libraries
- Always use optional chaining and nullish coalescing when accessing arrays/objects

**Testing Strategy:**

- Tests are co-located with source files
- Uses @testing-library/react for component tests
- Snapshot tests are used for emoji parsing validation
- happy-dom provides a lightweight DOM environment
- MSW (Mock Service Worker) is used for mocking HTTP requests in tests
    - MSW server is set up in `mocks/node.ts` and configured in `vitest.setup.ts`
    - Handlers are automatically reset between tests
    - Import server from `@/mocks/node` to add request handlers in tests
    - Environment variables are mocked in `vitest.config.ts` using a `mockEnv` object

## Common Patterns

**Server-Only Code:**
Files that should never run on the client must import `"server-only"` at the top (e.g., `app/lib/slack.ts`, `app/lib/session.ts`).

**Server Actions:**
All server actions are in `app/actions/` and marked with `"use server"` directive. They return discriminated unions with `status: "ok" | "error"` for type-safe error handling.

**Message Parsing:**
Slack messages are processed through a two-stage pipeline:

1. `textParser` - Handles text formatting (links, mentions, etc.)
2. `emojiParser` - Converts emoji codes to React components with skin tone support
