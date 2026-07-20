<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent rules for this project

Permanent instructions for any future coding agent (human or AI) working in this repository.

## Architecture

- Modular monolith. Do not introduce microservices or a separate backend service.
- Route Handlers stay thin: parse the request, validate with Zod, call a service, return a
  response via `src/lib/api/response.ts` helpers. Business logic belongs in `src/server/services/`.
- Database access only happens in `src/server/repositories/` (or `src/lib/db`). Never call
  Prisma directly from a route handler or a React component.
- Client Components never talk to the database or Plaid directly. If a client needs data,
  it goes through a Server Component, Server Action, or Route Handler.
- Server Components by default. Add `"use client"` only when something genuinely needs
  browser state, event handlers, or a browser-only API.

## Security (non-negotiable)

- Every request under `/dashboard` and `/api/plaid/*` (except the webhook) must call
  `requireUser()` (Server Components) or `requireApiUser()` (Route Handlers) from
  `src/lib/auth/require-user.ts`. `src/proxy.ts` is a UX convenience, not the enforcement
  point — Next.js's own docs warn Proxy coverage can silently regress.
- Never trust a `userId` sent from the browser (body, query string, header). Always derive it
  from the authenticated session and pass it down into repository calls.
- Every financial query must be scoped by `userId` at the repository layer — see
  `src/server/repositories/financial-connection.repository.ts` for the pattern.
- Never log access tokens, public tokens, `Authorization` headers, cookies, encryption keys,
  or full account numbers. Use `src/lib/security/logger.ts`, which redacts known-sensitive
  keys automatically — don't `console.log` sensitive objects directly.
- Plaid access tokens are encrypted at rest with `encryptSecret()` /
  `decryptSecret()` (`src/lib/encryption/secret-encryption.ts`) before they touch the
  database. Never store or return a raw Plaid access token.
- Money is always `Decimal` (Prisma `@db.Decimal`), never `Float`/`number`, in the schema or
  in any calculation.
- Do not connect live financial institutions or use production Plaid credentials during
  development. Use Plaid Sandbox until a human explicitly approves otherwise.
- Do not weaken authentication, remove a `requireUser()`/`requireApiUser()` call, or loosen
  the CSP in `next.config.ts` just to make a test or build pass.

## TypeScript / code quality

- `strict` mode is on in `tsconfig.json`; keep it on.
- Don't bypass type errors with `@ts-ignore`/`@ts-expect-error` without a comment explaining
  why, and don't use `any` without a documented justification (ESLint errors on bare `any`).
- Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg`) — see
  `src/lib/db/prisma.ts`. The `datasource` block in `prisma/schema.prisma` has no `url`; the
  connection string lives in `prisma.config.ts` (loaded via `dotenv/config`) and is passed to
  `PrismaClient` through the adapter, not read implicitly from the schema.
- The generated Prisma client lives in `src/generated/prisma` and is gitignored. Run
  `npm run db:generate` after any `prisma/schema.prisma` change (this also runs implicitly via
  `prisma migrate dev`).
- Write or update tests for any security-sensitive change (auth, encryption, financial data
  access, response helpers, redaction).

## Before finishing a task

Run, in order, and fix failures rather than working around them:

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

Do not commit if any of these fail. Do not modify files unrelated to the task at hand.
