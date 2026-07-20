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
2. `requireUser()` (Server Components, redirects) and `requireApiUser()` (Route Handlers,
   throws) in `src/lib/auth/require-user.ts` are the **authoritative** check — Next's own docs
   note Proxy coverage can silently regress, so the app never relies on it alone. Also exports
   `requireUserId()` (just the trusted id), `getOptionalUser()` (non-throwing, for pages that
   render differently when signed in), and `assertResourceOwner(userId, resourceOwnerId)` for
   authorizing access to an already-fetched resource.

## Folder structure

```
prisma/
  schema.prisma          # Prisma 7 schema (no datasource url — see prisma.config.ts)
prisma.config.ts          # Prisma 7 config: schema path, migrations path, DATABASE_URL
src/
  app/
    (public)/             # Home, About, Experience, Projects, Contact
    (auth)/
      sign-in/             # Google/GitHub buttons + email magic-link form
      verify-request/      # "Check your email" (post magic-link-request)
      auth-error/          # Safe, mapped auth error messages
      signed-out/          # Post sign-out confirmation
    dashboard/             # Protected: Overview, Accounts, Transactions, Analytics, Settings
    api/
      auth/[...nextauth]/  # Auth.js route handler
      health/              # GET /api/health
      plaid/                # create-link-token, exchange-public-token, sync-transactions, webhook
  components/
    dashboard/             # MetricCard, ChartContainer, RecentTransactions, ConnectedAccounts
    layout/                 # Sidebar, TopNav, MobileNav, public header/footer
    forms/                   # SubmitButton (useFormStatus pending state)
    ui/                     # EmptyState, Skeleton, ErrorState
  config/                   # env.ts (Zod-validated), site.ts, navigation.ts
  lib/
    auth/                   # Auth.js config, requireUser()/requireApiUser()/assertResourceOwner(),
                             # normalizeEmail(), error-messages, branded email template
    db/                     # Prisma client singleton (driver adapter)
    encryption/             # AES-256-GCM secret encryption
    plaid/                  # Plaid config + client factory
    security/               # Redacting logger, audit log writer, rate limiter + identifiers
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
- `AUTH_SECRET` — see [Auth Secret](#auth-secret) below.
- `AUTH_TRUST_HOST` — set to `true` for any non-Vercel deployment (Vercel sets this
  automatically). Auth.js reads it directly from the environment.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`,
  `AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM` — each pair is optional, but **must be set together**.
  Setting only half of a pair fails startup with a clear error naming the missing variable.
  Omit a pair entirely to leave that sign-in method disabled (the sign-in page hides it and
  shows a "not configured" notice instead of a broken button). See
  [Authentication Provider Setup](#authentication-provider-setup) for how to obtain each value.
- `PLAID_CLIENT_ID` / `PLAID_SECRET` — optional; Plaid routes return `501 Not Implemented`
  until Plaid work resumes in a future task, regardless of whether these are set.
- `TOKEN_ENCRYPTION_KEY` — a base64-encoded 32-byte key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

The app validates these eagerly (`src/config/env.ts`) and fails with a clear error listing
exactly what's missing — including provider pairs and a malformed `AUTH_TRUST_HOST` — rather
than failing confusingly deep in a request handler. Error messages only ever include variable
_names_, never their values.

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

## Authentication Provider Setup

Every provider below is optional and independent — set up as many or as few as you want. The
sign-in page automatically hides any provider whose environment variables aren't set.

### Google Cloud

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create or select a
   project.
2. Go to **APIs & Services → OAuth consent screen** and configure it (choose **External** unless
   this is a Google Workspace org app; you can leave it in "Testing" mode for local development).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Choose **Web application** as the application type.
5. Under **Authorized JavaScript origins**, add your local origin:
   ```text
   http://localhost:3000
   ```
6. Under **Authorized redirect URIs**, add the callback URL:
   ```text
   http://localhost:3000/api/auth/callback/google
   ```
   For production, add the equivalent on your real domain:
   ```text
   https://YOUR_DOMAIN/api/auth/callback/google
   ```
   (Replace `YOUR_DOMAIN` with your actual production domain — this repo doesn't assume one.)
7. Copy the generated **Client ID** and **Client secret** into `.env.local` as `AUTH_GOOGLE_ID`
   and `AUTH_GOOGLE_SECRET`.

### GitHub

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (https://github.com/settings/developers).
2. Set the **Homepage URL** to:
   ```text
   http://localhost:3000
   ```
3. Set the **Authorization callback URL** to:
   ```text
   http://localhost:3000/api/auth/callback/github
   ```
   For production, register a second OAuth App (GitHub OAuth Apps take one callback URL each)
   with:
   ```text
   https://YOUR_DOMAIN/api/auth/callback/github
   ```
4. Copy the **Client ID** into `.env.local` as `AUTH_GITHUB_ID`. Click **Generate a new client
   secret** and copy it as `AUTH_GITHUB_SECRET`.

A GitHub _personal access token_ is not needed anywhere in this flow — that's a different
credential from an OAuth App's client ID/secret, and sign-in doesn't use one.

### Resend (email magic-link sign-in)

1. Create an account at [resend.com](https://resend.com).
2. Go to **API Keys** and create a key with sending access. Copy it into `.env.local` as
   `AUTH_RESEND_KEY`.
3. Verify a sender:
   - For local development/testing, Resend allows sending from their shared testing address —
     check your Resend dashboard for the current one, as it's account-specific.
   - For production, verify your own domain under **Domains** in the Resend dashboard (adds DNS
     records you'll need to create with your domain registrar), then use an address on that
     domain.
4. Set `AUTH_EMAIL_FROM` to the address you verified, e.g. `Personal Dashboard <sign-in@yourdomain.com>`.

`AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` are required together — setting one without the other
fails startup with a clear error.

### Auth Secret

```bash
npx auth secret
```

This writes a cryptographically random secret directly to `.env.local` for you. If that command
isn't available, generate one manually and paste it into `AUTH_SECRET` yourself:

```bash
openssl rand -base64 32
```

Never commit the generated value.

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
- Database-backed sessions (`session: { strategy: "database" }`) via `@auth/prisma-adapter` —
  session tokens are random, stored server-side, revocable (delete the `Session` row), and
  expire; the raw token is never logged.
- Account linking is conservative: `allowDangerousEmailAccountLinking` is not set on any
  provider (default `false`), so a verified email under one provider can't silently gain a
  second linked OAuth account — Auth.js surfaces a safe `OAuthAccountNotLinked` error instead
  (mapped to friendly copy in `src/lib/auth/error-messages.ts`).
- The session exposed to the browser contains only `user.id`, `name`, `email`, `image`, and
  `expires` (see the module augmentation in `src/types/next-auth.d.ts`) — never provider
  tokens, the session's database token, or verification tokens.
- Every financial Prisma query is scoped by `userId` — see
  `src/server/repositories/financial-connection.repository.ts`. Cross-resource access can also
  be asserted explicitly via `assertResourceOwner()`.
- Plaid access tokens are never stored or logged in plaintext; they go through
  `encryptSecret()` (AES-256-GCM, versioned ciphertext format) before hitting the database.
  The encryption key currently comes from `TOKEN_ENCRYPTION_KEY`; before handling real
  financial data, replace this with envelope encryption backed by a cloud KMS.
- `src/lib/security/logger.ts` redacts access tokens, public tokens, `Authorization` headers,
  cookies, secrets, account numbers, and encryption keys from every log line.
- `src/lib/security/audit.ts` writes `AuditLog` rows for sign-in, sign-out, new-user creation,
  account linking, email verification, unauthorized dashboard/API access, and sign-in failures.
  Writes are best-effort and never block or fail the action they describe — a failed audit
  write is itself logged, not thrown.
- Email magic-link requests are rate-limited (`src/lib/security/rate-limit.ts`, 3 per 10 minutes
  per hashed-email identifier — the raw address is never used as a key or logged), and the
  three implemented Plaid routes are rate-limited per authenticated user (20/minute) as an
  example of protecting a sensitive authenticated endpoint. **The limiter is in-memory and
  single-instance only** — see the doc comment on `InMemoryRateLimiter` for what a production,
  multi-instance implementation (e.g. `@upstash/ratelimit`) needs to change; the `RateLimiter`
  interface is designed so callers don't need to change.
- The email sign-in response is intentionally identical whether or not the address has an
  account, and whether or not it was rate-limited — this avoids turning the form into an
  account-existence oracle.
- `next.config.ts` sets a baseline CSP plus `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS. Reviewed against this task's OAuth/Resend
  additions: OAuth sign-in is a same-origin form POST followed by a server-side redirect (not
  governed by `form-action`), and the Resend call happens server-side (not subject to browser
  CSP at all), so no policy changes were needed.
- API responses never leak stack traces or raw exception messages — see
  `internalErrorResponse()` in `src/lib/api/response.ts`. Auth.js error pages only ever show
  copy mapped from a small allow-list of "client-safe" error codes (see
  `src/lib/auth/error-messages.ts`); everything else collapses to a generic message before it
  ever reaches the browser — that collapsing happens inside Auth.js itself.
- An account-deletion path (`/dashboard/settings`) and a financial-connection disconnect path
  exist, both scoped to the authenticated user and audit-logged.
- The Plaid webhook signature check remains an explicit `TODO`, not silently skipped — see
  `src/app/api/plaid/webhook/route.ts`. It intentionally does not require a user session
  (Plaid calls it server-to-server); it must not be protected by `requireApiUser()`.

### Known limitations

- The in-memory rate limiter resets on restart/redeploy and isn't shared across instances —
  fine for a single dev/small deployment, not for a scaled production one (see above).
- No live-browser (Playwright) coverage exists for a fully **authenticated** session reaching
  the dashboard, or for sign-out actually revoking access, because that requires either real
  OAuth test credentials or a live Postgres database to seed a session — neither is available
  in this sandbox. Deliberately not worked around with a network-reachable test-auth-bypass
  route, since that would be a standing risk in the shipped app. Unauthenticated-access denial
  (the security-critical direction) _is_ covered end-to-end; authenticated-session behavior is
  covered at the unit/integration level instead (mocked sessions in `tests/unit/require-user.test.ts`
  and `tests/unit/plaid-routes.test.ts`).

## Plaid Sandbox notes

Nothing in `src/lib/plaid/` or `src/server/services/plaid-service.ts` calls a real Plaid
endpoint yet. Three of the four routes (`create-link-token`, `exchange-public-token`,
`sync-transactions`) require an authenticated session (`requireApiUser()`) and are rate-limited
per user; `webhook` is intentionally unauthenticated (Plaid calls it server-to-server) pending
signature verification. All four authenticate-or-not-as-appropriate, validate input, log the
attempt, and return `501 Not Implemented`. When Plaid work resumes: use **Sandbox** credentials
(`PLAID_ENV=sandbox`) until a human explicitly approves moving beyond it — never live
credentials during development.

## Future roadmap

1. **Implement the complete Plaid Sandbox connection flow** (this is the recommended next
   task) — Plaid Link on the client, `createLinkToken` / `exchangePublicToken` on the server,
   encrypted access-token storage, account and transaction synchronization, webhook signature
   verification, a disconnect flow, and financial-data deletion. Test with Google, GitHub, and
   email sign-in locally first.
2. Build real spending analytics and net-worth charts once transaction data exists.
3. Add AI-generated financial insights on top of synced transaction data.
4. Replace the in-memory rate limiter with a shared store (e.g. `@upstash/ratelimit`) before a
   multi-instance production deployment.
5. Replace the environment-variable encryption key with a cloud KMS before handling real
   financial data.

## Credential Checklist

Credentials you need to personally create and add to `.env.local` (never commit them):

```text
[ ] PostgreSQL DATABASE_URL
[ ] AUTH_SECRET
[ ] Google OAuth client ID
[ ] Google OAuth client secret
[ ] GitHub OAuth client ID
[ ] GitHub OAuth client secret
[ ] Resend sending API key
[ ] Verified Resend sender address
```

Plaid Sandbox credentials (`PLAID_CLIENT_ID`, `PLAID_SECRET`) are unchanged by this task — see
[Plaid Sandbox notes](#plaid-sandbox-notes) above.
