# Local Development Setup

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd contributor-example
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values (defaults work for local dev)

# 3. Start Postgres
docker compose up -d

# 4. Run database migration and seed
cd packages/api
pnpm db:migrate
pnpm db:seed
cd ../..

# 5. Start both API and frontend
pnpm dev
```

- API runs at http://localhost:3001
- Frontend runs at http://localhost:3000

## Dev Login

For local development, use the dev-login endpoint instead of OAuth:

1. Open http://localhost:3000/login
2. Enter an email from the seed data (e.g., `admin@example.com` or `alice@example.com`)
3. Click "Login"

Seeded users:
- `admin@example.com` — Admin
- `alice@example.com` — Alice Johnson
- `bob@example.com` — Bob Smith
- `carol@example.com` — Carol Williams
- `dave@example.com` — Dave Brown
- `eve@example.com` — Eve Davis

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + frontend in parallel |
| `pnpm test` | Run all tests |
| `pnpm build` | Build all packages |
| `cd packages/api && pnpm test` | Run API tests only |
| `cd packages/api && pnpm test:watch` | Run API tests in watch mode |
| `cd packages/api && pnpm db:migrate` | Run Prisma migrations |
| `cd packages/api && pnpm db:seed` | Seed the database |
| `cd packages/api && pnpm db:studio` | Open Prisma Studio (DB browser) |
| `docker compose up -d` | Start Postgres |
| `docker compose down` | Stop Postgres |
| `docker compose down -v` | Stop Postgres and delete data |

## Project Structure

```
contributor-example/
├── docker-compose.yml          # Postgres
├── packages/
│   ├── api/                    # Express API (port 3001)
│   │   ├── src/
│   │   │   ├── routes/         # Route handlers
│   │   │   ├── middleware/     # Auth, validation, errors
│   │   │   ├── schemas/       # Zod validation schemas
│   │   │   ├── lib/           # Prisma client, errors
│   │   │   └── index.ts       # Express app entry
│   │   └── prisma/
│   │       ├── schema.prisma  # Database schema
│   │       └── seed.ts        # Seed data
│   └── web/                    # Next.js frontend (port 3000)
│       └── src/
│           ├── app/           # Pages (App Router)
│           ├── components/    # Shared UI components
│           └── lib/           # API client, auth, utils
└── docs/                       # Documentation
```
