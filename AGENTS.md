# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This is a personal website built with Next.js 16 (App Router) that integrates with Slack for real-time chat functionality and WakaTime for coding statistics. The site is deployed as a standalone Docker container (configured for Heroku).

## Development Commands

### Essential Commands
- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build production bundle (requires all environment variables to be set)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
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
- Build: `docker build -t simon-kjellberg .`
- Run: `docker run -p 3000:3000 simon-kjellberg`

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
Environment validation is handled via `@t3-oss/env-nextjs` in `app/lib/env.ts`. Required variables:
- `SESSION_SECRET` - Session encryption secret
- `SLACK_CHANNEL` - Slack channel ID
- `SLACK_TOKEN` - Slack API token

Variables default to dummy values for development but must be set properly for production. Configure development environment variables in `.env.local` (per Next.js convention).

**Slack Integration Architecture:**
- Uses both Slack Web API (for reading/posting messages) and RTM API (for real-time subscriptions)
- Message parsing pipeline: `textParser` → `emojiParser` converts Slack-formatted messages to React components
- DataLoader with LRU cache (100 entries) is used to batch and cache user info requests
- Server-Sent Events (SSE) endpoint at `/api/chat/sse` streams chat updates to clients
- Emoji data is extracted from `emoji-datasource` package at build time

**Session Management:**
- Sessions use encrypted cookies via `app/lib/session.ts`
- Random usernames are generated using `app/lib/randomName.ts`
- Username-to-color mapping via `app/lib/stringToColor.ts` for consistent UI coloring

**React Compiler:**
- Enabled via `babel-plugin-react-compiler` in Next.js config
- Components are automatically optimized at build time

**TypeScript Configuration:**
- Extremely strict mode enabled (see tsconfig.json)
- Notable strictness: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`
- Always use optional chaining and nullish coalescing when accessing arrays/objects

**Testing Strategy:**
- Tests are co-located with source files
- Uses @testing-library/react for component tests
- Snapshot tests are used for emoji parsing validation
- happy-dom provides a lightweight DOM environment

## Common Patterns

**Server-Only Code:**
Files that should never run on the client must import `"server-only"` at the top (e.g., `app/lib/slack.ts`, `app/lib/session.ts`).

**Server Actions:**
All server actions are in `app/actions/` and marked with `"use server"` directive. They return discriminated unions with `status: "ok" | "error"` for type-safe error handling.

**Message Parsing:**
Slack messages are processed through a two-stage pipeline:
1. `textParser` - Handles text formatting (links, mentions, etc.)
2. `emojiParser` - Converts emoji codes to React components with skin tone support