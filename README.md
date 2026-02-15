# Bonus Gifting App

A full-stack application for managing bonus gifting, built as a pnpm monorepo.

## Tech Stack

- **Frontend** (`packages/web`) — Next.js 16, React 19, Tailwind CSS 4, Radix UI, TanStack Query
- **Backend** (`packages/api`) — Express, Prisma, PostgreSQL, Zod, JWT auth (Google OAuth)
- **Tooling** — TypeScript, pnpm workspaces, Vitest, ESLint

## Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- pnpm
- Docker (for PostgreSQL)

## Getting Started

1. **Install dependencies**

   ```sh
   pnpm install
   ```

2. **Set up environment variables**

   ```sh
   cp .env.example .env
   ```

   Edit `.env` with your Google OAuth credentials and a JWT secret.

3. **Start the database**

   ```sh
   docker compose up -d
   ```

4. **Run database migrations**

   ```sh
   pnpm --filter @gifting/api run db:migrate
   ```

5. **Seed the database** (optional)

   ```sh
   pnpm --filter @gifting/api run db:seed
   ```

6. **Start development servers**

   ```sh
   pnpm dev
   ```

   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## Scripts

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start all packages in dev mode       |
| `pnpm build` | Build all packages                   |
| `pnpm lint`  | Lint all packages                    |
| `pnpm test`  | Run tests across all packages        |

## Project Structure

```
├── packages/
│   ├── api/          # Express API server
│   └── web/          # Next.js frontend
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```
