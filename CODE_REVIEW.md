# Code Review Findings

Reviewed: 2026-02-15

## CRITICAL (6 findings)

### 1. JWT secret defaults to `"change-me"` in production
**Files:** `packages/api/src/middleware/auth.ts:5`, `packages/api/src/routes/auth.ts:8`

`const JWT_SECRET = process.env.JWT_SECRET || "change-me";` — if `JWT_SECRET` env var is missing in production, the app silently uses `"change-me"`, allowing anyone who knows this to forge tokens. Should throw at startup if unset in production.

### 2. Budget check race condition
**Files:** `packages/api/src/routes/gifts.ts:82-87` (create), `:118-123` (update)

The remaining budget is read then a gift is created in separate queries with no transaction or row-level lock. Two concurrent requests can both pass the budget check and overspend. Should wrap the check + create/update in a Prisma `$transaction` with serializable isolation or use a database-level constraint.

### 3. Gift update passes `req.body` directly to Prisma
**File:** `packages/api/src/routes/gifts.ts:128`

`data: req.body` passes the entire validated body to Prisma. While Zod strips unknown fields by default, this pattern is fragile. If the Zod schema is ever changed to `.passthrough()` or additional fields are added, unexpected fields could be written to the database. Safer to destructure only expected fields: `{ amount, comment }`.

### 4. OAuth callback accepts any token without validation
**File:** `packages/web/src/app/auth/callback/page.tsx:13-16`

The callback reads a `token` from the URL and immediately stores it via `login(token)` with no validation. Any string passed as `?token=...` will be stored in localStorage. Session fixation risk if an attacker tricks a user into visiting `/auth/callback?token=attacker-jwt`. Should add a state/nonce parameter to the OAuth flow.

### 5. `login()` doesn't await `/auth/me` — race condition
**File:** `packages/web/src/lib/auth.tsx:45-49`

```tsx
const login = (newToken: string) => {
  localStorage.setItem("token", newToken);
  setToken(newToken);
  apiFetch<User>("/auth/me").then(setUser);  // Fire-and-forget
};
```

The token is persisted and the user is navigated to `/` before `/auth/me` completes. If the token is invalid, the user briefly sees the dashboard in an unauthenticated state. No `.catch()` handler, so a failed `/auth/me` leaves a stale token with `user` remaining `null`. Should make `login()` async, await the call, and clear token on failure.

### 6. Gift update bug: `if (req.body.amount)` is falsy for 0
**File:** `packages/api/src/routes/gifts.ts:117`

`if (req.body.amount)` would be falsy if amount were 0. While the Zod schema requires `.positive()` so 0 is rejected at validation, this is a defensive coding issue. Use `if (req.body.amount !== undefined)` instead.

---

## WARNING (14 findings)

### 7. OAuth token exchange response not validated
**File:** `packages/api/src/routes/auth.ts:47-53`

`tokenRes.json()` is used without checking `tokenRes.ok`. If Google returns an error, `tokens.access_token` is `undefined`, and the user info fetch proceeds with `Authorization: Bearer undefined`.

### 8. `isAdmin` baked into JWT, not re-checked from DB
**File:** `packages/api/src/middleware/auth.ts:16-22`

Admin status is read from the JWT payload. If an admin is demoted in the DB, they retain admin access for up to 24h until the token expires.

### 9. CSV import: no file size limit, sequential per-row queries
**File:** `packages/api/src/routes/participants.ts:9,59-85`

`multer({ storage: multer.memoryStorage() })` with no `limits` option. Each CSV row triggers 2 DB round-trips. Large imports will be slow and could consume excessive memory. Should add `limits: { fileSize: ... }` and batch with `createMany`.

### 10. PUT gift endpoint has zero test coverage
**File:** `packages/api/src/__tests__/routes/gifts.test.ts`

The most complex gift operation (ownership check, budget recalculation with `excludeGiftId`, campaign-open check) has no tests. Missing tests for: updating amount within/exceeding budget, updating another user's gift, updating in closed campaign.

### 11. Missing test coverage for multiple scenarios
**Files:** Various test files

- Campaign detail/status endpoints untested
- Self-gift rejection untested (`routes/gifts.ts:76-78`)
- Closed campaign rejection untested (`routes/gifts.ts:11-18`)
- Non-participant rejection untested (`routes/gifts.ts:74`)
- Unique constraint violation (duplicate gift) untested (`schema.prisma:70`)
- Campaign list test doesn't assert created campaign is in results

### 12. No auth guard component — pages flash content before redirect
**File:** `packages/web/src/app/page.tsx:27-29`

Protected pages rely on a `useEffect` redirect that runs after initial render. The dashboard briefly renders with `null` data before redirecting unauthenticated users. Should create a reusable `RequireAuth` wrapper.

### 13. N+1 query on dashboard
**File:** `packages/web/src/app/page.tsx:31-38`

The dashboard fetches the campaign list, then fires an individual request for each campaign to get budget data. With 20 campaigns, this is 21 HTTP requests. Should add a query parameter or dedicated endpoint to include budget summary data.

### 14. CSV upload has no error handling for network failures
**File:** `packages/web/src/app/admin/campaigns/[id]/page.tsx:57-79`

The CSV upload uses raw `fetch` but `await res.json()` will throw if the response is not JSON (e.g., 500 with HTML body). No try/catch around the block.

### 15. Admin form input validation gaps
**File:** `packages/web/src/app/admin/page.tsx:108-110`

`parseFloat("")` returns `NaN` which propagates to the API. `new Date("").toISOString()` throws `RangeError`. The disabled button check helps but isn't airtight (e.g., whitespace strings pass).

### 16. Missing React Query error states on all pages
**Files:** `app/page.tsx`, `app/campaigns/[id]/page.tsx`, `app/campaigns/[id]/received/page.tsx`, `app/admin/campaigns/[id]/page.tsx`

None of these pages handle the `error` / `isError` state from `useQuery`. If the API is down, users see blank screens or stuck loading spinners.

### 17. `GiftForm` remaining budget wrong for edits
**File:** `packages/web/src/app/campaigns/[id]/page.tsx:147`

When editing an existing gift, `remainingBudget` doesn't account for the current gift's amount. If a user has $5 remaining and edits a $10 gift, the form shows $5.00 max instead of $15.00. Should pass `campaign.remainingBudget + (existingGift?.amount ?? 0)`.

### 18. `Campaign` interface duplicated 4 times
**Files:** `app/page.tsx:12-21`, `app/campaigns/[id]/page.tsx:17-25`, `app/admin/page.tsx:16-22`, `components/campaign-card.tsx:8-19`

The `Campaign` interface is defined 4 times with slightly different fields. Should extract to a shared `lib/types.ts`.

### 19. Tests share DB state with ordering dependency
**File:** `packages/api/src/__tests__/routes/gifts.test.ts`

The "deletes a gift" test depends on a gift created in "creates a gift". If tests are reordered or the create test fails, the delete test also fails.

### 20. Auth middleware test hardcodes JWT_SECRET
**File:** `packages/api/src/__tests__/middleware/auth.test.ts:5`

Hardcodes `"change-me"` instead of reading from env. Works because the fallback matches, but would silently break if the default ever changes.

---

## INFO (13 findings)

### 21. Prisma schema lacks indexes on foreign keys
**File:** `packages/api/prisma/schema.prisma`

No explicit `@@index` on `Gift.giverId`, `Gift.recipientId`, `CampaignParticipant.campaignId`, etc. PostgreSQL auto-creates indexes for unique constraints but not for non-unique FKs. Will cause slow queries as data grows.

### 22. Seed script doesn't create sample gifts
**File:** `packages/api/prisma/seed.ts`

Creates users, a campaign, and participants, but no sample gifts. Pre-seeded gifts would be useful for development/demos.

### 23. No upper bound on `budgetPerUser` or gift `amount`
**Files:** `packages/api/src/schemas/campaign.ts:6`, `packages/api/src/schemas/gift.ts:4`

`z.number().int().positive()` allows arbitrarily large values. Consider adding `.max()` for sanity checks.

### 24. `apiFetch` return type `undefined as T` is a type lie
**File:** `packages/web/src/lib/api.ts:20`

`if (res.status === 204) return undefined as T;` casts `undefined` to whatever `T` is, bypassing TypeScript's type checking at runtime.

### 25. Dev login form visible in production UI
**File:** `packages/web/src/app/login/page.tsx:56-77`

The dev login form is always rendered. The API endpoint is gated behind `NODE_ENV`, but the UI still shows it. Should conditionally render.

### 26. No delete confirmation dialog for gifts
**File:** `packages/web/src/app/campaigns/[id]/page.tsx:184`

Clicking "Delete" immediately fires the mutation with no confirmation. Should add an `AlertDialog`.

### 27. Missing `aria-label` on interactive elements
**Files:** `components/coworker-picker.tsx:36-55`, `components/gift-card.tsx:44-46`

Coworker picker buttons and gift card action buttons lack accessible labels for screen readers.

### 28. No loading/disabled state on mutation buttons
**Files:** `app/campaigns/[id]/page.tsx` (delete), `app/admin/page.tsx` (create campaign)

Delete gift and create campaign buttons don't disable during mutation, allowing double-clicks.

### 29. Health endpoint doesn't check DB connectivity
**File:** `packages/api/src/index.ts:22-24`

`/api/v1/health` always returns `{ status: "ok" }`. Should verify DB connection for production.

### 30. No graceful Prisma disconnect on SIGTERM
**File:** `packages/api/src/lib/prisma.ts`

No shutdown handler calling `prisma.$disconnect()`. Should be added for production.

### 31. `updateGiftSchema` allows empty `{}` updates
**File:** `packages/api/src/schemas/gift.ts:9-12`

Both `amount` and `comment` are optional. A PUT with `{}` succeeds and updates nothing. Consider requiring at least one field.

### 32. No campaign update/delete endpoints
**File:** `packages/api/src/routes/campaigns.ts`

Only `POST /` (create) and `GET /:id` exist. No way for admin to update or close/cancel a campaign.

### 33. CORS origin is a single string
**File:** `packages/api/src/index.ts:19`

Fine for single-frontend deployment but will need restructuring for multiple origins.

---

## Recommended Priority Order

1. Wrap budget check + gift create/update in a Prisma `$transaction` (Critical #2)
2. Throw on missing `JWT_SECRET` in production (Critical #1)
3. Fix `login()` to be async, await `/auth/me`, clear token on failure (Critical #5)
4. Destructure `req.body` explicitly in gift update (Critical #3)
5. Add tests for PUT gift endpoint (Warning #10)
6. Add error states to all `useQuery` hooks (Warning #16)
7. Add a backend endpoint for dashboard data to eliminate N+1 (Warning #13)
8. Extract shared TypeScript types (Warning #18)

## Strengths

- Clean middleware chain pattern (`requireAuth -> requireAdmin -> validate -> handler`)
- Gift anonymity properly enforced on `/received` endpoint
- Good use of React Query with proper cache invalidation on mutations
- Dev-login correctly gated behind `NODE_ENV !== "production"` on the API
- Nice UX touches (confetti, gradients, responsive layouts)
- Proper Suspense boundary on OAuth callback page
- Custom error classes with `express-async-errors` make error handling clean and uniform
- Self-gifting prevention implemented
