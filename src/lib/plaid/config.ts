import "server-only";
import { z } from "zod";

/**
 * Plaid credentials are optional at the environment-validation layer
 * (src/config/env.ts) so the rest of the app can boot without them. This
 * module is the single place that decides whether Plaid is actually usable,
 * and route handlers/services should check `isPlaidConfigured()` before
 * doing anything else.
 */

const plaidEnvSchema = z.object({
  PLAID_CLIENT_ID: z.string().min(1),
  PLAID_SECRET: z.string().min(1),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]),
  PLAID_WEBHOOK_URL: z.string().optional(),
});

export type PlaidEnv = z.infer<typeof plaidEnvSchema>;

export function isPlaidConfigured(): boolean {
  return plaidEnvSchema.safeParse(process.env).success;
}

export function getPlaidEnv(): PlaidEnv {
  const parsed = plaidEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Plaid is not configured. Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to enable it.",
    );
  }
  return parsed.data;
}
