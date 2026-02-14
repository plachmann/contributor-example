# CLAUDE.md

## Package: web (Next.js frontend)

Next.js 14 App Router with shadcn/ui, React Query, Tailwind CSS v4.

## Commands

```bash
pnpm dev     # next dev (port 3000)
pnpm build   # next build
pnpm lint    # eslint
```

## Key Patterns

- All pages use `"use client"` — no server components in this app
- `apiFetch<T>()` in `src/lib/api.ts` handles JWT auth and JSON parsing. Always sets `Content-Type: application/json` — use raw `fetch` for multipart uploads (see admin CSV import).
- Auth via `useAuth()` hook from `src/lib/auth.tsx` — provides `user`, `login()`, `logout()`
- Data fetching via React Query (`@tanstack/react-query`) with `["queryKey", id]` patterns
- Toasts via `sonner` (not shadcn toast, which is deprecated)
- `canvas-confetti` fires on successful gift submission

## Component Organization

- `src/components/ui/` — shadcn/ui primitives (button, card, input, etc.)
- `src/components/` — app-specific components (budget-meter, coworker-picker, gift-form, gift-card, campaign-card)
- `src/lib/` — utilities (api client, auth context, providers, confetti)

## Environment

Set `NEXT_PUBLIC_API_URL` to point at the API (defaults to `http://localhost:3001/api/v1`).
