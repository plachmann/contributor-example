# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peer bonus gifting application where employees gift bonus dollars to coworkers during time-limited campaigns. pnpm monorepo with separate API and web packages.

## Architecture

- **packages/api/** — Express.js REST API (port 3001) with Prisma ORM, JWT auth, Zod validation
- **packages/web/** — Next.js 14 App Router frontend (port 3000) with shadcn/ui, React Query, Tailwind CSS
- **PostgreSQL** via Docker Compose (port 5432)

All monetary amounts stored as **integers in cents** (e.g., $5.00 = 500).

## Common Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start API + frontend in parallel
pnpm test                 # Run all tests
pnpm build                # Build all packages

# API-specific
cd packages/api
pnpm test                 # Run vitest tests
pnpm test:watch           # Watch mode
pnpm db:migrate           # Run Prisma migrations
pnpm db:seed              # Seed database
pnpm db:studio            # Open Prisma Studio

# Database
docker compose up -d      # Start Postgres
docker compose down -v    # Stop and delete data
```

## API Route Structure

All routes under `/api/v1`:
- `src/routes/auth.ts` — OAuth login/callback, dev-login, /me
- `src/routes/campaigns.ts` — CRUD + status (admin)
- `src/routes/participants.ts` — List + CSV import
- `src/routes/gifts.ts` — CRUD with budget enforcement
- `src/routes/reports.ts` — Summary stats (admin)

Middleware chain: `requireAuth` → `requireAdmin` (where needed) → `validate(zodSchema)` → handler

## Key Patterns

- Express routes use `AuthRequest` type (extends `Request` with `user` property)
- `req.params.id` cast as `string` due to Express 5 type definitions
- Frontend uses `apiFetch<T>()` helper with JWT from localStorage
- Auth context via `useAuth()` hook from `src/lib/auth.tsx`
- React Query for all data fetching with `["queryKey", id]` pattern
- Gifts are anonymous to recipients (no giver info exposed on received endpoint)

## Dev Login

Use `POST /api/v1/auth/dev-login` with `{ "email": "admin@example.com" }` for local testing. Seeded users: admin@, alice@, bob@, carol@, dave@, eve@ (all @example.com).

## Testing

API tests use vitest + supertest. Test files in `packages/api/src/__tests__/`. Tests require a running Postgres instance (`docker compose up -d`).

```bash
# Run a single test file
cd packages/api && DATABASE_URL="postgresql://gifting:gifting@localhost:5432/gifting" pnpm vitest run src/__tests__/routes/gifts.test.ts
```

## Gotchas

- **Env loading**: The API loads `../../.env` via dotenv in `src/index.ts`. Prisma CLI commands need `DATABASE_URL` passed explicitly or a `.env` in `packages/api/`.
- **Tests wipe DB**: Integration tests clear all tables in beforeAll/afterAll. Re-seed after running tests: `DATABASE_URL=... npx prisma db seed`
- **apiFetch and file uploads**: `apiFetch()` always sets `Content-Type: application/json`. For file uploads (CSV import), use raw `fetch` instead.
- **express-async-errors**: Imported at top of `index.ts` — errors thrown in async route handlers are automatically caught by the error handler middleware.
