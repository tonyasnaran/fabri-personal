# Personal Dashboard

A personal website with a public portfolio area and a private, authenticated financial
dashboard. The dashboard is designed to eventually connect to real bank accounts through
Plaid — this repository currently ships the **foundation**: architecture, auth, database
schema, and UI shell, with Plaid wired up but intentionally not yet functional.

## Technology stack

- [Next.js](https://nextjs.org) 16 (App Router, React Server Components by default)
- TypeScript (strict mode)
- Tailwind CSS v4
- PostgreSQL + [Prisma ORM](https://www.prisma.io) 7
- [Auth.js](https://authjs.dev) (`next-auth` v5) with the Prisma adapter
- [Zod](https://zod.dev) for request/environment validation
- [Plaid Node SDK](https://github.com/plaid/plaid-node)
- Vitest (unit tests) + Playwright (e2e tests)
- ESLint + Prettier

## Architecture

Modular monolith — no microservices. Each layer has one job:

```
Route Handler (src/app/api/**/route.ts)
  → validates input with Zod
  → calls a Service (src/server/services/**)
      → calls a Repository (src/server/repositories/**, src/lib/db)
          → Prisma → PostgreSQL
```

- **Route Handlers** parse the request, validate with Zod, call a service, and return a
  response via the helpers in `src/lib/api/response.ts`. No business logic lives here.
- **Services** (`src/server/services/`) hold business logic and orchestrate repositories /
  external APIs (Plaid).
- **Repositories** (`src/server/repositories/`, `src/lib/db/`) are the only code that talks to
  Prisma, and every financial query is scoped by the authenticated user's id.
- **Client Components** never touch the database or Plaid directly.
- **Server Components** render by default; `"use client"` is only used where real browser
  interactivity is needed (mobile nav toggle, active-link highlighting).

Auth enforcement is layered:

1. `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) redirects unauthenticated
   requests to `/dashboard/*` for fast UX.
2. `requireUser()` in every dashboard layout/page and `requireApiUser()` in every private
   Route Handler are the **authoritative** check — Next's own docs note Proxy coverage can
   silently regress, so the app never relies on it alone.

## Folder structure

```
prisma/
  schema.prisma          # Prisma 7 schema (no datasource url — see prisma.config.ts)
prisma.config.ts          # Prisma 7 config: schema path, migrations path, DATABASE_URL
src/
  app/
    (public)/             # Home, About, Experience, Projects, Contact
    (auth)/sign-in/        # Sign-in placeholder
    dashboard/             # Protected: Overview, Accounts, Transactions, Analytics, Settings
    api/
      auth/[...nextauth]/  # Auth.js route handler
      health/              # GET /api/health
      plaid/                # create-link-token, exchange-public-token, sync-transactions, webhook
  components/
    dashboard/             # MetricCard, ChartContainer, RecentTransactions, ConnectedAccounts
    layout/                 # Sidebar, TopNav, MobileNav, public header/footer
    ui/                     # EmptyState, Skeleton, ErrorState
  config/                   # env.ts (Zod-validated), site.ts, navigation.ts
  lib/
    auth/                   # Auth.js config, requireUser()/requireApiUser()
    db/                     # Prisma client singleton (driver adapter)
    encryption/             # AES-256-GCM secret encryption
    plaid/                  # Plaid config + client factory
    security/               # Redacting structured logger
    validation/              # Zod schemas for API input
    api/                     # Response envelope helpers
  server/
    repositories/            # User-scoped Prisma queries
    services/                 # Business logic (Plaid placeholder service)
  proxy.ts                    # Edge-of-app redirect for /dashboard/*
tests/
  unit/                       # Vitest
  e2e/                         # Playwright
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — a PostgreSQL connection string.
- `AUTH_SECRET` — generate with `npx auth secret`.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — optional;
  omit to leave that sign-in provider disabled (the sign-in page shows a "not configured"
  message instead of crashing).
- `PLAID_CLIENT_ID` / `PLAID_SECRET` — optional; Plaid routes return `501 Not Implemented`
  until Plaid work resumes in a future task, regardless of whether these are set.
- `TOKEN_ENCRYPTION_KEY` — a base64-encoded 32-byte key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

The app validates these eagerly (`src/config/env.ts`) and fails with a clear error listing
exactly what's missing, rather than failing confusingly deep in a request handler.

### 3. Database

```bash
npm run db:generate   # generate the Prisma client into src/generated/prisma
npm run db:migrate    # create and apply a dev migration
npm run db:studio     # optional: browse data in Prisma Studio
```

No production migrations have been run against any real database as part of this task.

### 4. Run the app

```bash
npm run dev
```

## Testing

```bash
npm test        # Vitest unit tests (mocked Prisma/Auth.js/Plaid — no real accounts needed)
npm run test:e2e  # Playwright e2e tests (builds and starts the app first)
```

## Development commands

```bash
npm run lint        # ESLint
npm run lint:fix
npm run format       # Prettier (writes)
npm run format:check
npm run typecheck    # tsc --noEmit
npm run build
npm run start
```

## GitHub repository setup

This repo has not been pushed anywhere yet. From this directory:

**Preferred (GitHub CLI):**

```bash
gh auth login
gh repo create personal-dashboard --private --source=. --remote=origin --push
```

**Manual:**

```bash
git remote add origin git@github.com:YOUR_USERNAME/personal-dashboard.git
git branch -M main
git push -u origin main
```

## Deployment overview

Structured for Vercel: `next build` / `next start`, Route Handlers as serverless functions,
and `prisma.config.ts` reading `DATABASE_URL` from the platform's environment variables. Any
Vercel-compatible Postgres provider works (Vercel Postgres, Supabase, Neon, RDS, etc.) as long
as `DATABASE_URL` is set before build. This task does not deploy anything.

## Security notes

- Auth: `requireUser()` / `requireApiUser()` are the authoritative checks; `src/proxy.ts` is a
  UX-only convenience redirect (Next 16 renamed `middleware.ts` → `proxy.ts`).
- Every financial Prisma query is scoped by `userId` — see
  `src/server/repositories/financial-connection.repository.ts`.
- Plaid access tokens are never stored or logged in plaintext; they go through
  `encryptSecret()` (AES-256-GCM, versioned ciphertext format) before hitting the database.
  The encryption key currently comes from `TOKEN_ENCRYPTION_KEY`; before handling real
  financial data, replace this with envelope encryption backed by a cloud KMS.
- `src/lib/security/logger.ts` redacts access tokens, public tokens, `Authorization` headers,
  cookies, secrets, account numbers, and encryption keys from every log line.
- `next.config.ts` sets a baseline CSP plus `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- API responses never leak stack traces or raw exception messages — see
  `internalErrorResponse()` in `src/lib/api/response.ts`.
- An account-deletion path (`/dashboard/settings`) and a financial-connection disconnect path
  exist, both scoped to the authenticated user and audit-logged.
- Rate limiting and the Plaid webhook signature check are explicitly marked as `TODO`s, not
  silently skipped — see `src/app/api/plaid/webhook/route.ts` and
  `src/server/services/plaid-service.ts`.

## Plaid Sandbox notes

Nothing in `src/lib/plaid/` or `src/server/services/plaid-service.ts` calls a real Plaid
endpoint yet. All four routes (`create-link-token`, `exchange-public-token`,
`sync-transactions`, `webhook`) authenticate, validate input, log the attempt, and return
`501 Not Implemented`. When Plaid work resumes: use **Sandbox** credentials
(`PLAID_ENV=sandbox`) until a human explicitly approves moving beyond it — never live
credentials during development.

## Future roadmap

1. **Implement authentication fully** (this is the recommended next task) — wire real Google/
   GitHub OAuth credentials, add an Email provider, and add auth-focused tests (sign-in flow,
   session expiry, account linking).
2. Implement Plaid Link on the client and `createLinkToken` / `exchangePublicToken` on the
   server; encrypt and persist access tokens.
3. Implement `transactionsSync` with cursor-based incremental sync and Plaid webhook signature
   verification.
4. Build real spending analytics and net-worth charts once transaction data exists.
5. Add AI-generated financial insights on top of synced transaction data.
6. Add rate limiting to the Plaid and auth routes.
7. Replace the environment-variable encryption key with a cloud KMS before handling real
   financial data.
