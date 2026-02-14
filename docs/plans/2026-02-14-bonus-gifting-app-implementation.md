# Bonus Gifting App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack peer bonus gifting application with Express API, Next.js frontend, and PostgreSQL.

**Architecture:** pnpm monorepo with two packages — `packages/api` (Express + Prisma) and `packages/web` (Next.js + Tailwind + shadcn/ui). Postgres runs via Docker Compose. API serves on port 3001, frontend on port 3000. Auth uses Google OAuth with JWT sessions.

**Tech Stack:** TypeScript, Express.js, Prisma, PostgreSQL, Next.js (App Router), Tailwind CSS, shadcn/ui, Docker Compose, pnpm workspaces.

**Design document:** `docs/plans/2026-02-14-bonus-gifting-app-design.md`

---

## Task 1: Initialize Monorepo and Root Configuration

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: Create root package.json**

```json
{
  "name": "contributor-example",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "build": "pnpm -r run build",
    "lint": "pnpm -r run lint",
    "test": "pnpm -r run test"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

**Step 3: Create .nvmrc**

```
20
```

**Step 4: Create .gitignore**

```gitignore
node_modules/
dist/
.next/
.env
*.log
.DS_Store
coverage/
```

**Step 5: Run `pnpm install` to generate lockfile**

Run: `pnpm install`
Expected: Creates `pnpm-lock.yaml` (empty workspace for now)

**Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .nvmrc pnpm-lock.yaml
git commit -m "chore: initialize pnpm monorepo"
```

---

## Task 2: Docker Compose and Environment

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-gifting}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-gifting}
      POSTGRES_DB: ${POSTGRES_DB:-gifting}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: Create .env.example**

```env
# Database
DATABASE_URL=postgresql://gifting:gifting@localhost:5432/gifting

# Auth (Google OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_CALLBACK_URL=http://localhost:3001/api/v1/auth/callback

# JWT
JWT_SECRET=change-me-to-a-random-secret

# API
API_PORT=3001
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Step 3: Copy .env.example to .env**

Run: `cp .env.example .env`

**Step 4: Start Postgres and verify**

Run: `docker compose up -d && sleep 2 && docker compose ps`
Expected: postgres service running, healthy

**Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for Postgres and env config"
```

---

## Task 3: API Package Scaffold

**Files:**
- Create: `packages/api/package.json`
- Create: `packages/api/tsconfig.json`
- Create: `packages/api/src/index.ts`

**Step 1: Create packages/api/package.json**

```json
{
  "name": "@gifting/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "csv-parse": "^5.6.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

**Step 2: Create packages/api/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create packages/api/src/index.ts**

```typescript
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
```

**Step 4: Install dependencies**

Run: `cd packages/api && pnpm install`

**Step 5: Test that it starts**

Run: `cd packages/api && pnpm dev &` then `sleep 2 && curl http://localhost:3001/api/v1/health`
Expected: `{"status":"ok"}`
Clean up: Kill the dev server

**Step 6: Commit**

```bash
git add packages/api/
git commit -m "chore: scaffold API package with Express"
```

---

## Task 4: Prisma Schema and Migration

**Files:**
- Create: `packages/api/prisma/schema.prisma`

**Step 1: Initialize Prisma**

Run: `cd packages/api && npx prisma init --datasource-provider postgresql`
This creates `prisma/schema.prisma` — we'll replace its content.

**Step 2: Write the Prisma schema**

Replace `packages/api/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid()) @db.Uuid
  email       String   @unique
  displayName String   @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  isAdmin     Boolean  @default(false) @map("is_admin")
  createdAt   DateTime @default(now()) @map("created_at")

  createdCampaigns Campaign[]
  participations   CampaignParticipant[]
  givenGifts       Gift[]                @relation("GiverGifts")
  receivedGifts    Gift[]                @relation("RecipientGifts")

  @@map("users")
}

model Campaign {
  id           String   @id @default(uuid()) @db.Uuid
  title        String
  description  String?
  budgetPerUser Int     @map("budget_per_user")
  openDate     DateTime @map("open_date")
  closeDate    DateTime @map("close_date")
  createdBy    String   @map("created_by") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  creator      User                  @relation(fields: [createdBy], references: [id])
  participants CampaignParticipant[]
  gifts        Gift[]

  @@map("campaigns")
}

model CampaignParticipant {
  id         String   @id @default(uuid()) @db.Uuid
  campaignId String   @map("campaign_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  campaign Campaign @relation(fields: [campaignId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@unique([campaignId, userId])
  @@map("campaign_participants")
}

model Gift {
  id          String   @id @default(uuid()) @db.Uuid
  campaignId  String   @map("campaign_id") @db.Uuid
  giverId     String   @map("giver_id") @db.Uuid
  recipientId String   @map("recipient_id") @db.Uuid
  amount      Int
  comment     String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  campaign  Campaign @relation(fields: [campaignId], references: [id])
  giver     User     @relation("GiverGifts", fields: [giverId], references: [id])
  recipient User     @relation("RecipientGifts", fields: [recipientId], references: [id])

  @@unique([campaignId, giverId, recipientId])
  @@map("gifts")
}
```

**Step 3: Run the migration**

Run: `cd packages/api && npx prisma migrate dev --name init`
Expected: Migration created and applied successfully

**Step 4: Verify with Prisma Studio**

Run: `cd packages/api && npx prisma studio &`
Expected: Opens browser showing 4 tables: users, campaigns, campaign_participants, gifts
Clean up: Kill Prisma Studio

**Step 5: Commit**

```bash
git add packages/api/prisma/
git commit -m "feat: add Prisma schema with users, campaigns, participants, gifts"
```

---

## Task 5: Prisma Client Helper and Seed Script

**Files:**
- Create: `packages/api/src/lib/prisma.ts`
- Create: `packages/api/prisma/seed.ts`

**Step 1: Create Prisma client singleton**

Create `packages/api/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

**Step 2: Create seed script**

Create `packages/api/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      displayName: "Admin User",
      isAdmin: true,
    },
  });

  // Create regular users
  const users = await Promise.all(
    [
      { email: "alice@example.com", displayName: "Alice Johnson" },
      { email: "bob@example.com", displayName: "Bob Smith" },
      { email: "carol@example.com", displayName: "Carol Williams" },
      { email: "dave@example.com", displayName: "Dave Brown" },
      { email: "eve@example.com", displayName: "Eve Davis" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
    )
  );

  // Create a sample campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Q1 2026 Appreciation",
      description: "Show your coworkers some love!",
      budgetPerUser: 50000, // $500.00
      openDate: new Date("2026-01-01T00:00:00Z"),
      closeDate: new Date("2026-03-31T23:59:59Z"),
      createdBy: admin.id,
    },
  });

  // Add all users as participants
  const allUsers = [admin, ...users];
  for (const user of allUsers) {
    await prisma.campaignParticipant.upsert({
      where: {
        campaignId_userId: {
          campaignId: campaign.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        campaignId: campaign.id,
        userId: user.id,
      },
    });
  }

  console.log(`Seeded: ${allUsers.length} users, 1 campaign`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**Step 3: Add seed config to package.json**

Add to `packages/api/package.json` at root level:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Step 4: Run the seed**

Run: `cd packages/api && npx prisma db seed`
Expected: "Seeded: 6 users, 1 campaign"

**Step 5: Commit**

```bash
git add packages/api/src/lib/prisma.ts packages/api/prisma/seed.ts packages/api/package.json
git commit -m "feat: add Prisma client singleton and seed script"
```

---

## Task 6: API Error Handling and Validation Middleware

**Files:**
- Create: `packages/api/src/middleware/error-handler.ts`
- Create: `packages/api/src/middleware/validate.ts`
- Create: `packages/api/src/lib/errors.ts`

**Step 1: Create custom error classes**

Create `packages/api/src/lib/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}
```

**Step 2: Create error handler middleware**

Create `packages/api/src/middleware/error-handler.ts`:

```typescript
import { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
```

**Step 3: Create Zod validation middleware**

Create `packages/api/src/middleware/validate.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
```

**Step 4: Wire into Express app**

Update `packages/api/src/index.ts` to add error handler at the end:

```typescript
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler must be last
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
```

**Step 5: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add error handling and Zod validation middleware"
```

---

## Task 7: Auth Middleware (JWT Verification)

**Files:**
- Create: `packages/api/src/middleware/auth.ts`
- Create: `packages/api/src/types.ts`
- Create: `packages/api/src/__tests__/middleware/auth.test.ts`

**Step 1: Create types file for authenticated request**

Create `packages/api/src/types.ts`:

```typescript
import { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
```

**Step 2: Write the failing test**

Create `packages/api/src/__tests__/middleware/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const JWT_SECRET = "test-secret";
vi.stubEnv("JWT_SECRET", JWT_SECRET);

function mockReqResNext() {
  const req: any = { headers: {} };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe("requireAuth", () => {
  it("rejects requests without Authorization header", () => {
    const { req, res, next } = mockReqResNext();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid tokens", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Bearer invalid-token";
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user to request for valid tokens", () => {
    const { req, res, next } = mockReqResNext();
    const payload = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      isAdmin: false,
    };
    const token = jwt.sign(payload, JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
});

describe("requireAdmin", () => {
  it("rejects non-admin users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test",
      isAdmin: false,
    };
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows admin users", () => {
    const { req, res, next } = mockReqResNext();
    req.user = {
      id: "user-1",
      email: "admin@example.com",
      displayName: "Admin",
      isAdmin: true,
    };
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd packages/api && pnpm test`
Expected: FAIL — cannot resolve `../../middleware/auth.js`

**Step 4: Implement auth middleware**

Create `packages/api/src/middleware/auth.ts`:

```typescript
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, AuthUser } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = {
      id: payload.id,
      email: payload.email,
      displayName: payload.displayName,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
```

**Step 5: Run tests to verify they pass**

Run: `cd packages/api && pnpm test`
Expected: All 5 tests PASS

**Step 6: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add JWT auth and admin middleware with tests"
```

---

## Task 8: Auth Routes (OAuth Flow)

**Files:**
- Create: `packages/api/src/routes/auth.ts`

**Note:** Full OAuth is complex. We implement the redirect + callback structure, but for local dev we also add a `POST /auth/dev-login` endpoint that generates a JWT for any seeded user by email. This makes development and testing practical without real OAuth credentials.

**Step 1: Create auth routes**

Create `packages/api/src/routes/auth.ts`:

```typescript
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

// Google OAuth redirect
router.get("/login", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.OAUTH_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    res.status(500).json({ error: "OAuth not configured" });
    return;
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  res.redirect(url.toString());
});

// OAuth callback
router.get("/callback", async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.OAUTH_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Find user in our DB (must be pre-imported by admin)
    const user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });
    if (!user) {
      res.status(403).json({ error: "User not registered. Contact your admin." });
      return;
    }

    // Update avatar if available
    if (userInfo.picture && userInfo.picture !== user.avatarUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: userInfo.picture },
      });
    }

    // Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Dev-only login (generates JWT for any user by email)
if (process.env.NODE_ENV !== "production") {
  router.post("/dev-login", async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, user });
  });
}

// Get current user
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
```

**Step 2: Register routes in Express app**

Update `packages/api/src/index.ts`:

```typescript
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.js";

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
```

**Step 3: Manual smoke test with dev-login**

Run the API, then:
```bash
curl -X POST http://localhost:3001/api/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'
```
Expected: JSON with `token` and `user` fields

**Step 4: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add auth routes with OAuth flow and dev-login"
```

---

## Task 9: Campaign Routes

**Files:**
- Create: `packages/api/src/routes/campaigns.ts`
- Create: `packages/api/src/schemas/campaign.ts`
- Create: `packages/api/src/__tests__/routes/campaigns.test.ts`

**Step 1: Create Zod schema for campaign creation**

Create `packages/api/src/schemas/campaign.ts`:

```typescript
import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  budgetPerUser: z.number().int().positive(),
  openDate: z.coerce.date(),
  closeDate: z.coerce.date(),
}).refine((data) => data.closeDate > data.openDate, {
  message: "Close date must be after open date",
  path: ["closeDate"],
});
```

**Step 2: Write the failing test**

Create `packages/api/src/__tests__/routes/campaigns.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../../index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    {
      id: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
      isAdmin: false,
      ...overrides,
    },
    JWT_SECRET
  );
}

describe("Campaign routes", () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    // Clean and seed test data
    await prisma.gift.deleteMany();
    await prisma.campaignParticipant.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
      data: { email: "admin@test.com", displayName: "Admin", isAdmin: true },
    });
    const user = await prisma.user.create({
      data: { email: "user@test.com", displayName: "User", isAdmin: false },
    });
    adminId = admin.id;
    userId = user.id;
    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, displayName: admin.displayName, isAdmin: true },
      JWT_SECRET
    );
    userToken = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName, isAdmin: false },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/campaigns", () => {
    it("rejects non-admin users", async () => {
      const res = await request(app)
        .post("/api/v1/campaigns")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Test Campaign",
          budgetPerUser: 50000,
          openDate: "2026-01-01",
          closeDate: "2026-03-31",
        });
      expect(res.status).toBe(403);
    });

    it("creates a campaign for admin users", async () => {
      const res = await request(app)
        .post("/api/v1/campaigns")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Test Campaign",
          budgetPerUser: 50000,
          openDate: "2026-01-01",
          closeDate: "2026-03-31",
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Test Campaign");
      expect(res.body.budgetPerUser).toBe(50000);
    });
  });

  describe("GET /api/v1/campaigns", () => {
    it("returns only campaigns user participates in", async () => {
      const res = await request(app)
        .get("/api/v1/campaigns")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd packages/api && pnpm test`
Expected: FAIL — route not found (404)

**Step 4: Implement campaign routes**

Create `packages/api/src/routes/campaigns.ts`:

```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCampaignSchema } from "../schemas/campaign.js";
import { AuthRequest } from "../types.js";

const router = Router();

// List campaigns user participates in
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaigns = await prisma.campaign.findMany({
    where: {
      participants: { some: { userId: req.user!.id } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(campaigns);
});

// Create campaign (admin only)
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createCampaignSchema),
  async (req: AuthRequest, res: Response) => {
    const campaign = await prisma.campaign.create({
      data: {
        ...req.body,
        createdBy: req.user!.id,
      },
    });
    res.status(201).json(campaign);
  }
);

// Get campaign details with user's remaining budget
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
  });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  // Check participation
  const participant = await prisma.campaignParticipant.findUnique({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: req.user!.id,
      },
    },
  });
  if (!participant && !req.user!.isAdmin) {
    res.status(403).json({ error: "Not a participant in this campaign" });
    return;
  }

  // Calculate remaining budget
  const totalGifted = await prisma.gift.aggregate({
    where: { campaignId: campaign.id, giverId: req.user!.id },
    _sum: { amount: true },
  });

  res.json({
    ...campaign,
    totalGifted: totalGifted._sum.amount || 0,
    remainingBudget: campaign.budgetPerUser - (totalGifted._sum.amount || 0),
  });
});

// Campaign status (admin only)
router.get(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: { user: { select: { id: true, email: true, displayName: true } } },
        },
      },
    });
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Get gifting totals per user
    const giftsByUser = await prisma.gift.groupBy({
      by: ["giverId"],
      where: { campaignId: campaign.id },
      _sum: { amount: true },
      _count: true,
    });

    const giftMap = new Map(giftsByUser.map((g) => [g.giverId, g]));

    const participantStatus = campaign.participants.map((p) => {
      const gifts = giftMap.get(p.userId);
      return {
        user: p.user,
        totalGifted: gifts?._sum.amount || 0,
        giftCount: gifts?._count || 0,
        remainingBudget: campaign.budgetPerUser - (gifts?._sum.amount || 0),
      };
    });

    res.json({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        budgetPerUser: campaign.budgetPerUser,
        openDate: campaign.openDate,
        closeDate: campaign.closeDate,
      },
      participantStatus,
    });
  }
);

export default router;
```

**Step 5: Register campaign routes in index.ts**

Add to `packages/api/src/index.ts` after auth routes:

```typescript
import campaignRoutes from "./routes/campaigns.js";
// ...
app.use("/api/v1/campaigns", campaignRoutes);
```

**Step 6: Run tests to verify they pass**

Run: `cd packages/api && pnpm test`
Expected: All campaign tests PASS

**Step 7: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add campaign CRUD routes with tests"
```

---

## Task 10: Participant Routes (CSV Import + List)

**Files:**
- Create: `packages/api/src/routes/participants.ts`

**Step 1: Create participant routes**

Create `packages/api/src/routes/participants.ts`:

```typescript
import { Router, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

// List participants (for coworker picker — excludes current user)
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const participants = await prisma.campaignParticipant.findMany({
    where: {
      campaignId: req.params.id,
      userId: { not: req.user!.id },
    },
    include: {
      user: {
        select: { id: true, email: true, displayName: true, avatarUrl: true },
      },
    },
  });
  res.json(participants.map((p) => p.user));
});

// Import participants via CSV (admin only)
router.post(
  "/import",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file uploaded" });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<{ email: string; display_name: string }>;

    let created = 0;
    let added = 0;
    const errors: string[] = [];

    for (const record of records) {
      if (!record.email) {
        errors.push(`Row missing email: ${JSON.stringify(record)}`);
        continue;
      }

      // Upsert user
      const user = await prisma.user.upsert({
        where: { email: record.email },
        update: { displayName: record.display_name || record.email },
        create: {
          email: record.email,
          displayName: record.display_name || record.email,
        },
      });
      created++;

      // Add as participant (skip if already exists)
      try {
        await prisma.campaignParticipant.create({
          data: { campaignId: campaign.id, userId: user.id },
        });
        added++;
      } catch {
        // Already a participant — skip
      }
    }

    res.json({
      usersProcessed: created,
      participantsAdded: added,
      errors,
    });
  }
);

export default router;
```

**Step 2: Register participant routes in index.ts**

Add to `packages/api/src/index.ts`:

```typescript
import participantRoutes from "./routes/participants.js";
// ...
app.use("/api/v1/campaigns/:id/participants", participantRoutes);
```

**Step 3: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add participant list and CSV import routes"
```

---

## Task 11: Gift Routes (CRUD + Budget Enforcement)

**Files:**
- Create: `packages/api/src/routes/gifts.ts`
- Create: `packages/api/src/schemas/gift.ts`
- Create: `packages/api/src/__tests__/routes/gifts.test.ts`

**Step 1: Create Zod schema for gifts**

Create `packages/api/src/schemas/gift.ts`:

```typescript
import { z } from "zod";

export const createGiftSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().int().positive(),
  comment: z.string().min(1).max(1000),
});

export const updateGiftSchema = z.object({
  amount: z.number().int().positive().optional(),
  comment: z.string().min(1).max(1000).optional(),
});
```

**Step 2: Write the failing test**

Create `packages/api/src/__tests__/routes/gifts.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../../index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

describe("Gift routes", () => {
  let userToken: string;
  let userId: string;
  let recipientId: string;
  let campaignId: string;

  beforeAll(async () => {
    await prisma.gift.deleteMany();
    await prisma.campaignParticipant.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: { email: "giver@test.com", displayName: "Giver" },
    });
    const recipient = await prisma.user.create({
      data: { email: "recipient@test.com", displayName: "Recipient" },
    });
    userId = user.id;
    recipientId = recipient.id;

    const admin = await prisma.user.create({
      data: { email: "admin2@test.com", displayName: "Admin", isAdmin: true },
    });

    const campaign = await prisma.campaign.create({
      data: {
        title: "Test",
        budgetPerUser: 10000, // $100
        openDate: new Date("2025-01-01"),
        closeDate: new Date("2027-12-31"),
        createdBy: admin.id,
      },
    });
    campaignId = campaign.id;

    // Add participants
    await prisma.campaignParticipant.createMany({
      data: [
        { campaignId, userId: user.id },
        { campaignId, userId: recipient.id },
      ],
    });

    userToken = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName, isAdmin: false },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a gift", async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId, amount: 2500, comment: "Great work!" });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(2500);
  });

  it("rejects gift exceeding budget", async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ recipientId, amount: 99999, comment: "Too much" });
    expect(res.status).toBe(400);
  });

  it("lists gifts I've given", async () => {
    const res = await request(app)
      .get(`/api/v1/campaigns/${campaignId}/gifts`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `cd packages/api && pnpm test`
Expected: FAIL — route returns 404

**Step 4: Implement gift routes**

Create `packages/api/src/routes/gifts.ts`:

```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createGiftSchema, updateGiftSchema } from "../schemas/gift.js";
import { AuthRequest } from "../types.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../lib/errors.js";

const router = Router({ mergeParams: true });

async function assertCampaignOpen(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  const now = new Date();
  if (now < campaign.openDate || now > campaign.closeDate) {
    throw new BadRequestError("Campaign is not currently open for gifting");
  }
  return campaign;
}

async function assertParticipant(campaignId: string, userId: string) {
  const p = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
  });
  if (!p) throw new ForbiddenError("Not a participant in this campaign");
}

async function getRemainingBudget(campaignId: string, userId: string, excludeGiftId?: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new NotFoundError("Campaign not found");

  const where: any = { campaignId, giverId: userId };
  if (excludeGiftId) where.id = { not: excludeGiftId };

  const total = await prisma.gift.aggregate({ where, _sum: { amount: true } });
  return campaign.budgetPerUser - (total._sum.amount || 0);
}

// List gifts I've given in this campaign
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const gifts = await prisma.gift.findMany({
    where: { campaignId: req.params.id, giverId: req.user!.id },
    include: {
      recipient: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(gifts);
});

// List gifts I've received (anonymous — no giver info)
router.get("/received", requireAuth, async (req: AuthRequest, res: Response) => {
  const gifts = await prisma.gift.findMany({
    where: { campaignId: req.params.id, recipientId: req.user!.id },
    select: { id: true, amount: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(gifts);
});

// Create a gift
router.post(
  "/",
  requireAuth,
  validate(createGiftSchema),
  async (req: AuthRequest, res: Response) => {
    const { id: campaignId } = req.params;
    const { recipientId, amount, comment } = req.body;
    const userId = req.user!.id;

    await assertCampaignOpen(campaignId);
    await assertParticipant(campaignId, userId);

    if (recipientId === userId) {
      throw new BadRequestError("Cannot gift to yourself");
    }

    await assertParticipant(campaignId, recipientId);

    const remaining = await getRemainingBudget(campaignId, userId);
    if (amount > remaining) {
      throw new BadRequestError(
        `Amount exceeds remaining budget. You have $${(remaining / 100).toFixed(2)} left.`
      );
    }

    const gift = await prisma.gift.create({
      data: { campaignId, giverId: userId, recipientId, amount, comment },
      include: {
        recipient: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    res.status(201).json(gift);
  }
);

// Update a gift
router.put(
  "/:giftId",
  requireAuth,
  validate(updateGiftSchema),
  async (req: AuthRequest, res: Response) => {
    const { id: campaignId, giftId } = req.params;
    const userId = req.user!.id;

    await assertCampaignOpen(campaignId);

    const existing = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!existing) throw new NotFoundError("Gift not found");
    if (existing.giverId !== userId) throw new ForbiddenError("Not your gift");
    if (existing.campaignId !== campaignId) throw new NotFoundError("Gift not in this campaign");

    if (req.body.amount) {
      const remaining = await getRemainingBudget(campaignId, userId, giftId);
      if (req.body.amount > remaining) {
        throw new BadRequestError(
          `Amount exceeds remaining budget. You have $${(remaining / 100).toFixed(2)} left.`
        );
      }
    }

    const gift = await prisma.gift.update({
      where: { id: giftId },
      data: req.body,
      include: {
        recipient: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    res.json(gift);
  }
);

// Delete a gift
router.delete("/:giftId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: campaignId, giftId } = req.params;
  const userId = req.user!.id;

  await assertCampaignOpen(campaignId);

  const existing = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!existing) throw new NotFoundError("Gift not found");
  if (existing.giverId !== userId) throw new ForbiddenError("Not your gift");
  if (existing.campaignId !== campaignId) throw new NotFoundError("Gift not in this campaign");

  await prisma.gift.delete({ where: { id: giftId } });
  res.status(204).send();
});

export default router;
```

**Step 5: Register gift routes in index.ts**

Add to `packages/api/src/index.ts`:

```typescript
import giftRoutes from "./routes/gifts.js";
// ...
app.use("/api/v1/campaigns/:id/gifts", giftRoutes);
```

**Step 6: Run tests to verify they pass**

Run: `cd packages/api && pnpm test`
Expected: All gift tests PASS

**Step 7: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add gift CRUD routes with budget enforcement and tests"
```

---

## Task 12: Report Routes

**Files:**
- Create: `packages/api/src/routes/reports.ts`

**Step 1: Create report routes**

Create `packages/api/src/routes/reports.ts`:

```typescript
import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { AuthRequest } from "../types.js";

const router = Router({ mergeParams: true });

router.get("/summary", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const campaignId = req.params.id;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const totalParticipants = await prisma.campaignParticipant.count({
    where: { campaignId },
  });

  const participantsWhoGifted = await prisma.gift.groupBy({
    by: ["giverId"],
    where: { campaignId },
  });

  const giftStats = await prisma.gift.aggregate({
    where: { campaignId },
    _sum: { amount: true },
    _avg: { amount: true },
    _count: true,
  });

  res.json({
    totalParticipants,
    participantsWhoGifted: participantsWhoGifted.length,
    participationRate:
      totalParticipants > 0 ? participantsWhoGifted.length / totalParticipants : 0,
    totalAmountGifted: giftStats._sum.amount || 0,
    averageGiftAmount: Math.round(giftStats._avg.amount || 0),
    totalGiftsCount: giftStats._count,
  });
});

export default router;
```

**Step 2: Register report routes in index.ts**

Add to `packages/api/src/index.ts`:

```typescript
import reportRoutes from "./routes/reports.js";
// ...
app.use("/api/v1/campaigns/:id/reports", reportRoutes);
```

**Step 3: Commit**

```bash
git add packages/api/src/
git commit -m "feat: add campaign summary report route"
```

---

## Task 13: Web Package Scaffold (Next.js + Tailwind + shadcn/ui)

**Files:**
- Create: `packages/web/` (via create-next-app)

**Step 1: Create Next.js app**

Run from project root:
```bash
pnpm create next-app@latest packages/web --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-pnpm
```

**Step 2: Install shadcn/ui**

Run:
```bash
cd packages/web && pnpm dlx shadcn@latest init -d
```

**Step 3: Install core shadcn components**

Run:
```bash
cd packages/web && pnpm dlx shadcn@latest add button card input textarea label progress toast sonner dialog avatar badge separator dropdown-menu
```

**Step 4: Install additional dependencies**

Run:
```bash
cd packages/web && pnpm add canvas-confetti @tanstack/react-query
cd packages/web && pnpm add -D @types/canvas-confetti
```

**Step 5: Create API client helper**

Create `packages/web/src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
```

**Step 6: Create auth context**

Create `packages/web/src/lib/auth.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "./api";

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      setToken(stored);
      apiFetch<User>("/auth/me")
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    apiFetch<User>("/auth/me").then(setUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

**Step 7: Create React Query provider**

Create `packages/web/src/lib/providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { AuthProvider } from "./auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

**Step 8: Update root layout to use providers**

Replace `packages/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bonus Gifting",
  description: "Gift bonus dollars to your coworkers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 9: Commit**

```bash
git add packages/web/
git commit -m "chore: scaffold Next.js app with Tailwind, shadcn/ui, auth context"
```

---

## Task 14: Login Page and Auth Callback

**Files:**
- Create: `packages/web/src/app/login/page.tsx`
- Create: `packages/web/src/app/auth/callback/page.tsx`

**Step 1: Create login page**

Create `packages/web/src/app/login/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleDevLogin = async () => {
    try {
      const res = await apiFetch<{ token: string }>("/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      login(res.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOAuthLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    window.location.href = `${apiUrl}/auth/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎁</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            Bonus Gifting
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Spread the love to your coworkers
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleOAuthLogin} className="w-full" size="lg">
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or dev login
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
            />
            <Button variant="outline" onClick={handleDevLogin}>
              Login
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create auth callback page**

Create `packages/web/src/app/auth/callback/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      login(token);
      router.push("/");
    } else {
      router.push("/login");
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add packages/web/src/app/login/ packages/web/src/app/auth/
git commit -m "feat: add login page with OAuth and dev-login, auth callback"
```

---

## Task 15: Dashboard Page

**Files:**
- Modify: `packages/web/src/app/page.tsx`
- Create: `packages/web/src/components/campaign-card.tsx`

**Step 1: Create campaign card component**

Create `packages/web/src/components/campaign-card.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    budgetPerUser: number;
    openDate: string;
    closeDate: string;
    totalGifted: number;
    remainingBudget: number;
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const now = new Date();
  const closeDate = new Date(campaign.closeDate);
  const openDate = new Date(campaign.openDate);
  const isOpen = now >= openDate && now <= closeDate;
  const spent = campaign.totalGifted;
  const budget = campaign.budgetPerUser;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
  const daysLeft = Math.max(0, Math.ceil((closeDate.getTime() - now.getTime()) / 86400000));

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                ${(campaign.remainingBudget / 100).toFixed(2)} remaining
              </span>
              <span className="text-muted-foreground">
                of ${(budget / 100).toFixed(2)}
              </span>
            </div>
            <Progress value={percentUsed} className="h-3" />
          </div>
          {isOpen && (
            <p className="text-sm text-muted-foreground">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Create dashboard page**

Replace `packages/web/src/app/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { CampaignCard } from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  budgetPerUser: number;
  openDate: string;
  closeDate: string;
  totalGifted: number;
  remainingBudget: number;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const list = await apiFetch<Campaign[]>("/campaigns");
      // Fetch details with budget info for each
      return Promise.all(list.map((c) => apiFetch<Campaign>(`/campaigns/${c.id}`)));
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
            🎁 Bonus Gifting
          </h1>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Link href="/admin">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{user?.displayName}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">Your Campaigns</h2>
        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No campaigns yet. Check back soon!
          </p>
        )}
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add packages/web/src/
git commit -m "feat: add dashboard page with campaign cards and budget progress"
```

---

## Task 16: Gifting Page (Coworker Picker + Gift Form + Budget Meter)

**Files:**
- Create: `packages/web/src/app/campaigns/[id]/page.tsx`
- Create: `packages/web/src/components/budget-meter.tsx`
- Create: `packages/web/src/components/coworker-picker.tsx`
- Create: `packages/web/src/components/gift-form.tsx`
- Create: `packages/web/src/components/gift-card.tsx`
- Create: `packages/web/src/lib/confetti.ts`

**Step 1: Create confetti helper**

Create `packages/web/src/lib/confetti.ts`:

```typescript
import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6"],
  });
}
```

**Step 2: Create budget meter component**

Create `packages/web/src/components/budget-meter.tsx`:

```tsx
"use client";

import { Progress } from "@/components/ui/progress";

interface BudgetMeterProps {
  budget: number;
  spent: number;
}

export function BudgetMeter({ budget, spent }: BudgetMeterProps) {
  const remaining = budget - spent;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold">Your Budget</span>
        <span className="text-2xl font-bold text-orange-600">
          ${(remaining / 100).toFixed(2)}
        </span>
      </div>
      <Progress value={percentUsed} className="h-4 mb-2" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>${(spent / 100).toFixed(2)} gifted</span>
        <span>${(budget / 100).toFixed(2)} total</span>
      </div>
    </div>
  );
}
```

**Step 3: Create coworker picker component**

Create `packages/web/src/components/coworker-picker.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Coworker {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CoworkerPickerProps {
  coworkers: Coworker[];
  giftedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CoworkerPicker({ coworkers, giftedIds, selectedId, onSelect }: CoworkerPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = coworkers.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search coworkers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              selectedId === c.id
                ? "bg-orange-100 border-2 border-orange-300"
                : "hover:bg-gray-50 border-2 border-transparent"
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={c.avatarUrl || undefined} />
              <AvatarFallback className="bg-orange-200 text-orange-700">
                {c.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 font-medium">{c.displayName}</span>
            {giftedIds.has(c.id) && (
              <span className="text-green-600 text-lg">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Create gift form component**

Create `packages/web/src/components/gift-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface GiftFormProps {
  recipientName: string | null;
  remainingBudget: number;
  onSubmit: (amount: number, comment: string) => Promise<void>;
  initialAmount?: number;
  initialComment?: string;
  isEdit?: boolean;
}

export function GiftForm({
  recipientName,
  remainingBudget,
  onSubmit,
  initialAmount,
  initialComment,
  isEdit,
}: GiftFormProps) {
  const [amount, setAmount] = useState(initialAmount ? (initialAmount / 100).toString() : "");
  const [comment, setComment] = useState(initialComment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit(cents, comment);
      if (!isEdit) {
        setAmount("");
        setComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {recipientName ? (
        <p className="font-medium">
          {isEdit ? "Editing gift for" : "Gifting to"}{" "}
          <span className="text-orange-600">{recipientName}</span>
        </p>
      ) : (
        <p className="text-muted-foreground">Select a coworker to start gifting</p>
      )}

      <div>
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          max={(remainingBudget / 100).toFixed(2)}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!recipientName}
        />
      </div>

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          placeholder="Say something nice..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!recipientName}
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!recipientName || !amount || !comment || submitting}
        className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
        size="lg"
      >
        {submitting ? "Sending..." : isEdit ? "Update Gift" : "🎁 Send Gift"}
      </Button>
    </div>
  );
}
```

**Step 5: Create gift card component**

Create `packages/web/src/components/gift-card.tsx`:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GiftCardProps {
  gift: {
    id: string;
    amount: number;
    comment: string;
    recipient: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  onEdit: () => void;
  onDelete: () => void;
  campaignOpen: boolean;
}

export function GiftCard({ gift, onEdit, onDelete, campaignOpen }: GiftCardProps) {
  return (
    <Card className="border-2 border-orange-50">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={gift.recipient.avatarUrl || undefined} />
          <AvatarFallback className="bg-orange-200 text-orange-700">
            {gift.recipient.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{gift.recipient.displayName}</span>
            <span className="text-orange-600 font-bold">
              ${(gift.amount / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{gift.comment}</p>
        </div>
        {campaignOpen && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 6: Create gifting page**

Create `packages/web/src/app/campaigns/[id]/page.tsx`:

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { fireConfetti } from "@/lib/confetti";
import { BudgetMeter } from "@/components/budget-meter";
import { CoworkerPicker } from "@/components/coworker-picker";
import { GiftForm } from "@/components/gift-form";
import { GiftCard } from "@/components/gift-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  budgetPerUser: number;
  openDate: string;
  closeDate: string;
  totalGifted: number;
  remainingBudget: number;
}

interface Coworker {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Gift {
  id: string;
  amount: number;
  comment: string;
  recipient: { id: string; displayName: string; avatarUrl: string | null };
}

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCoworker, setSelectedCoworker] = useState<string | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => apiFetch<Campaign>(`/campaigns/${id}`),
    enabled: !!user,
  });

  const { data: coworkers } = useQuery({
    queryKey: ["participants", id],
    queryFn: () => apiFetch<Coworker[]>(`/campaigns/${id}/participants`),
    enabled: !!user,
  });

  const { data: gifts } = useQuery({
    queryKey: ["gifts", id],
    queryFn: () => apiFetch<Gift[]>(`/campaigns/${id}/gifts`),
    enabled: !!user,
  });

  const isOpen = campaign
    ? new Date() >= new Date(campaign.openDate) && new Date() <= new Date(campaign.closeDate)
    : false;

  const giftedIds = new Set(gifts?.map((g) => g.recipient.id) || []);
  const selectedName = coworkers?.find((c) => c.id === selectedCoworker)?.displayName || null;

  const createGift = useMutation({
    mutationFn: (data: { recipientId: string; amount: number; comment: string }) =>
      apiFetch(`/campaigns/${id}/gifts`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      setSelectedCoworker(null);
      fireConfetti();
      toast.success("Gift sent!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteGift = useMutation({
    mutationFn: (giftId: string) =>
      apiFetch(`/campaigns/${id}/gifts/${giftId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Gift removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="text-xl font-bold">{campaign.title}</h1>
          <Link href={`/campaigns/${id}/received`} className="ml-auto">
            <Button variant="outline" size="sm">🎁 Received Gifts</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <BudgetMeter budget={campaign.budgetPerUser} spent={campaign.totalGifted} />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Coworkers</h2>
            <CoworkerPicker
              coworkers={coworkers || []}
              giftedIds={giftedIds}
              selectedId={selectedCoworker}
              onSelect={setSelectedCoworker}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              {isOpen ? "Send a Gift" : "Campaign Closed"}
            </h2>
            {isOpen ? (
              <GiftForm
                recipientName={selectedName}
                remainingBudget={campaign.remainingBudget}
                onSubmit={async (amount, comment) => {
                  if (!selectedCoworker) return;
                  await createGift.mutateAsync({
                    recipientId: selectedCoworker,
                    amount,
                    comment,
                  });
                }}
              />
            ) : (
              <p className="text-muted-foreground">This campaign is no longer accepting gifts.</p>
            )}
          </div>
        </div>

        {gifts && gifts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Gifts ({gifts.length})</h2>
            <div className="space-y-3">
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  campaignOpen={isOpen}
                  onEdit={() => setSelectedCoworker(gift.recipient.id)}
                  onDelete={() => deleteGift.mutate(gift.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 7: Commit**

```bash
git add packages/web/src/
git commit -m "feat: add gifting page with coworker picker, gift form, budget meter, confetti"
```

---

## Task 17: Received Gifts Page

**Files:**
- Create: `packages/web/src/app/campaigns/[id]/received/page.tsx`

**Step 1: Create received gifts page**

Create `packages/web/src/app/campaigns/[id]/received/page.tsx`:

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReceivedGift {
  id: string;
  amount: number;
  comment: string;
  createdAt: string;
}

export default function ReceivedGiftsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: gifts } = useQuery({
    queryKey: ["received-gifts", id],
    queryFn: () => apiFetch<ReceivedGift[]>(`/campaigns/${id}/gifts/received`),
    enabled: !!user,
  });

  const total = gifts?.reduce((sum, g) => sum + g.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/campaigns/${id}`}>
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 className="text-xl font-bold">Received Gifts</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {gifts && gifts.length > 0 && (
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border-2 border-orange-100">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-2xl font-bold text-orange-600">
              ${(total / 100).toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              from {gifts.length} gift{gifts.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {gifts?.map((gift) => (
            <Card key={gift.id} className="border-2 border-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">🎁</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${(gift.amount / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-gray-700 italic">"{gift.comment}"</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(gift.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!gifts || gifts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🎁</p>
            <p className="text-muted-foreground">No gifts received yet. Stay tuned!</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/web/src/app/campaigns/
git commit -m "feat: add anonymous received gifts page"
```

---

## Task 18: Admin Pages (Create Campaign + Status Dashboard)

**Files:**
- Create: `packages/web/src/app/admin/page.tsx`
- Create: `packages/web/src/app/admin/campaigns/[id]/page.tsx`

**Step 1: Create admin dashboard page**

Create `packages/web/src/app/admin/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  budgetPerUser: number;
  openDate: string;
  closeDate: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => apiFetch<Campaign[]>("/campaigns"),
    enabled: !!user?.isAdmin,
  });

  const createCampaign = useMutation({
    mutationFn: (data: object) =>
      apiFetch("/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setTitle("");
      setDescription("");
      setBudget("");
      setOpenDate("");
      setCloseDate("");
      toast.success("Campaign created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">← Dashboard</Button>
          </Link>
          <h1 className="text-xl font-bold">Admin</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budget">Budget per user ($)</Label>
                <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="open">Open date</Label>
                <Input id="open" type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="close">Close date</Label>
                <Input id="close" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={() =>
                createCampaign.mutate({
                  title,
                  description: description || undefined,
                  budgetPerUser: Math.round(parseFloat(budget) * 100),
                  openDate: new Date(openDate).toISOString(),
                  closeDate: new Date(closeDate).toISOString(),
                })
              }
              disabled={!title || !budget || !openDate || !closeDate}
            >
              Create Campaign
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">All Campaigns</h2>
          <div className="space-y-3">
            {campaigns?.map((c) => (
              <Link key={c.id} href={`/admin/campaigns/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${(c.budgetPerUser / 100).toFixed(2)} per person
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(c.openDate).toLocaleDateString()} — {new Date(c.closeDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Create campaign status page**

Create `packages/web/src/app/admin/campaigns/[id]/page.tsx`:

```tsx
"use client";

import { useParams } from "next/navigation";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface CampaignStatus {
  campaign: {
    id: string;
    title: string;
    budgetPerUser: number;
    openDate: string;
    closeDate: string;
  };
  participantStatus: Array<{
    user: { id: string; email: string; displayName: string };
    totalGifted: number;
    giftCount: number;
    remainingBudget: number;
  }>;
}

interface ReportSummary {
  totalParticipants: number;
  participantsWhoGifted: number;
  participationRate: number;
  totalAmountGifted: number;
  averageGiftAmount: number;
  totalGiftsCount: number;
}

export default function CampaignStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: status } = useQuery({
    queryKey: ["campaign-status", id],
    queryFn: () => apiFetch<CampaignStatus>(`/campaigns/${id}/status`),
    enabled: !!user?.isAdmin,
  });

  const { data: report } = useQuery({
    queryKey: ["campaign-report", id],
    queryFn: () => apiFetch<ReportSummary>(`/campaigns/${id}/reports/summary`),
    enabled: !!user?.isAdmin,
  });

  const handleCSVUpload = async () => {
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

    const res = await fetch(`${apiUrl}/campaigns/${id}/participants/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await res.json();

    if (res.ok) {
      toast.success(`Added ${result.participantsAdded} participants`);
    } else {
      toast.error(result.error);
    }
  };

  if (!status) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">← Admin</Button>
          </Link>
          <h1 className="text-xl font-bold">{status.campaign.title}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary stats */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Participation", value: `${Math.round(report.participationRate * 100)}%` },
              { label: "Total Gifted", value: `$${(report.totalAmountGifted / 100).toFixed(2)}` },
              { label: "Total Gifts", value: report.totalGiftsCount.toString() },
              { label: "Avg Gift", value: `$${(report.averageGiftAmount / 100).toFixed(2)}` },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Import Participants</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-end">
            <div className="flex-1">
              <Input ref={fileInput} type="file" accept=".csv" />
              <p className="text-xs text-muted-foreground mt-1">CSV format: email,display_name</p>
            </div>
            <Button onClick={handleCSVUpload}>Upload</Button>
          </CardContent>
        </Card>

        {/* Participant status table */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.participantStatus.map((p) => {
                const pct =
                  status.campaign.budgetPerUser > 0
                    ? (p.totalGifted / status.campaign.budgetPerUser) * 100
                    : 0;
                return (
                  <div key={p.user.id} className="flex items-center gap-4">
                    <div className="w-48 truncate">
                      <p className="font-medium text-sm">{p.user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2" />
                    </div>
                    <div className="w-32 text-right text-sm">
                      ${(p.totalGifted / 100).toFixed(2)} / ${(status.campaign.budgetPerUser / 100).toFixed(2)}
                    </div>
                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {p.giftCount} gift{p.giftCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add packages/web/src/app/admin/
git commit -m "feat: add admin pages for campaign creation, CSV import, and status dashboard"
```

---

## Task 19: Developer Setup Documentation

**Files:**
- Create: `docs/local-setup.md`

**Step 1: Write developer setup docs**

Create `docs/local-setup.md`:

````markdown
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
│   │   │   ├── services/      # Business logic
│   │   │   ├── lib/           # Prisma client, errors
│   │   │   └── index.ts       # Express app entry
│   │   └── prisma/
│   │       ├── schema.prisma  # Database schema
│   │       └── seed.ts        # Seed data
│   └── web/                    # Next.js frontend (port 3000)
│       └── src/
│           ├── app/           # Pages (App Router)
│           ├── components/    # Shared UI components
│           ├── hooks/         # Custom React hooks
│           └── lib/           # API client, auth, utils
└── docs/                       # Documentation
```
````

**Step 2: Commit**

```bash
git add docs/local-setup.md
git commit -m "docs: add local development setup guide"
```

---

## Task 20: API Spec and Schema Diagram

**Files:**
- Create: `docs/api-spec.yaml`
- Create: `docs/schema-diagram.md`

**Step 1: Create OpenAPI spec**

Create `docs/api-spec.yaml` — a complete OpenAPI 3.0 spec covering all endpoints. The spec should mirror the routes defined in Task 8–12, with request/response schemas matching the Zod schemas and Prisma models.

Key sections:
- All auth endpoints (`/auth/login`, `/auth/callback`, `/auth/me`, `/auth/dev-login`)
- All campaign endpoints with admin-only markers
- Participant import (multipart/form-data) and list
- Gift CRUD with budget validation error responses
- Report summary endpoint

**Step 2: Create schema diagram**

Create `docs/schema-diagram.md` — copy the Mermaid ER diagram from the design document (`docs/plans/2026-02-14-bonus-gifting-app-design.md`, lines 86–129).

**Step 3: Commit**

```bash
git add docs/api-spec.yaml docs/schema-diagram.md
git commit -m "docs: add OpenAPI spec and database schema diagram"
```
