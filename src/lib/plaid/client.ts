import "server-only";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { getPlaidEnv } from "@/lib/plaid/config";

let cachedClient: PlaidApi | undefined;

/**
 * Plaid client factory. Lazily constructed and cached — never instantiate
 * `PlaidApi` directly elsewhere in the app, and never forward `PLAID_SECRET`
 * or the client itself to browser code.
 */
export function getPlaidClient(): PlaidApi {
  if (cachedClient) return cachedClient;

  const env = getPlaidEnv();

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env.PLAID_ENV],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": env.PLAID_CLIENT_ID,
        "PLAID-SECRET": env.PLAID_SECRET,
      },
    },
  });

  cachedClient = new PlaidApi(configuration);
  return cachedClient;
}
