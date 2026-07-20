-- Enables Row Level Security on every table with no permissive policies
-- attached, i.e. a default-deny for any role RLS actually applies to.
--
-- Why this is needed: Supabase auto-exposes every table in the `public`
-- schema through its PostgREST API, queryable by the `anon` (public) and
-- `authenticated` roles using the project's publishable/anon key. This app
-- never uses that API — it connects directly over Postgres via Prisma,
-- using the `postgres` role, which owns these tables and therefore bypasses
-- RLS regardless of what policies exist (Postgres never applies RLS to a
-- table's owner unless FORCE ROW LEVEL SECURITY is also set, which we
-- deliberately do not set). So this migration:
--   - Has zero effect on this application's own read/write access.
--   - Closes off `anon`/`authenticated` access via Supabase's REST API,
--     which had no RLS policies restricting it at all prior to this.
--
-- `accounts` (OAuth refresh/access tokens) and `verification_tokens`
-- (magic-link tokens) are the most sensitive tables here, but every table
-- gets this treatment since none of them are meant to be reachable through
-- anything but this application's own server-side code.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_sync_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
