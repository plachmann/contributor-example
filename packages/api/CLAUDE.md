# CLAUDE.md

## Package: @gifting/api

Express REST API with Prisma ORM, JWT auth, Zod validation.

## Commands

```bash
pnpm dev            # tsx watch src/index.ts
pnpm test           # vitest run (sequential, shared DB)
pnpm test:watch     # vitest watch mode
pnpm db:migrate     # prisma migrate dev (needs DATABASE_URL)
pnpm db:seed        # tsx prisma/seed.ts
pnpm db:studio      # prisma studio
```

## Key Patterns

- All sub-routers use `Router({ mergeParams: true })` to access `:id` from parent route
- `req.params.id as string` cast needed due to Express 5 type definitions (`string | string[]`)
- Route handlers are async — `express-async-errors` (imported first in index.ts) catches thrown errors
- Custom errors (`BadRequestError`, `NotFoundError`, `ForbiddenError`) extend `AppError` and are handled by `errorHandler` middleware
- Zod schemas in `src/schemas/` validated via `validate()` middleware

## Environment

Dotenv loads `../../.env` (monorepo root) at startup. Prisma CLI commands need `DATABASE_URL` set explicitly:
```bash
DATABASE_URL="postgresql://gifting:gifting@localhost:5432/gifting" npx prisma migrate dev
```

## Testing

- Tests use vitest + supertest against real Postgres (no mocks)
- `fileParallelism: false` in `vitest.config.ts` — tests share the DB and must run sequentially
- `NODE_ENV=test` skips `app.listen()` so supertest can bind its own port
- Tests clean up their own data but leave the DB empty — re-seed after: `DATABASE_URL=... npx prisma db seed`

## Schema Constraints

- `@@unique([campaignId, userId])` on campaign_participants — one entry per user per campaign
- `@@unique([campaignId, giverId, recipientId])` on gifts — one gift per giver/recipient pair per campaign
- Amounts stored as `Int` (cents), not floats
