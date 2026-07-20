import { z } from "zod";

/**
 * Request validation for the Plaid route handlers. The user id is
 * intentionally NOT part of these schemas — it must always come from the
 * authenticated session (`requireApiUser()`), never from the request body.
 */

export const createLinkTokenSchema = z.object({
  // No client-supplied fields yet; reserved for future options such as
  // `products` overrides once Link customization is implemented.
});

export const exchangePublicTokenSchema = z.object({
  publicToken: z.string().min(1, "publicToken is required"),
});

export const syncTransactionsSchema = z.object({
  financialConnectionId: z.string().min(1, "financialConnectionId is required"),
});

export type CreateLinkTokenInput = z.infer<typeof createLinkTokenSchema>;
export type ExchangePublicTokenInput = z.infer<typeof exchangePublicTokenSchema>;
export type SyncTransactionsInput = z.infer<typeof syncTransactionsSchema>;
