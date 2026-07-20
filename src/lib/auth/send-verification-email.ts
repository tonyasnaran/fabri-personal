import "server-only";
import { renderSignInEmail } from "@/lib/auth/email-template";
import { logger } from "@/lib/security/logger";

/**
 * Calls the Resend API directly (matching how Auth.js's own built-in Resend
 * provider does it) rather than pulling in the `resend` SDK for a single
 * POST request. Overrides the provider's default so the email uses our
 * branded template instead of Auth.js's generic one.
 *
 * The verification URL is never logged — only metadata about the send.
 */
export async function sendVerificationEmail(params: {
  identifier: string;
  url: string;
  apiKey: string;
  from: string;
}): Promise<void> {
  const { identifier: to, url, apiKey, from } = params;
  const { host } = new URL(url);
  const { subject, html, text } = renderSignInEmail({ url, host });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!response.ok) {
    // Never log the response body — it may echo back request details.
    logger.error("auth.email.send_failed", { status: response.status });
    throw new Error("Resend request failed");
  }

  logger.info("auth.email.sent", { host });
}
