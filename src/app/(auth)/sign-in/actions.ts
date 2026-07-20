"use server";

import { z } from "zod";
import { signIn, authConfig } from "@/lib/auth/config";
import { normalizeEmail } from "@/lib/auth/normalize-email";
import { getEmailSignInRateLimiter } from "@/lib/security/rate-limit";
import { emailRateLimitId } from "@/lib/security/rate-limit-identifier";
import { logger } from "@/lib/security/logger";

const emailSchema = z.email({ error: "Enter a valid email address" });

export type SendMagicLinkState = {
  status: "idle" | "error" | "sent";
  message?: string;
};

const EMAIL_PROVIDER_ID = "resend";

// Kept identical for both outcomes on purpose: whether the address has an
// account, and whether the request was rate-limited, must not be
// distinguishable from the response — otherwise the form becomes an
// account-existence oracle.
const NEUTRAL_SENT_MESSAGE =
  "If that address can receive sign-in emails, we've sent a link. Check your inbox.";

export async function sendMagicLinkAction(
  _prevState: SendMagicLinkState,
  formData: FormData,
): Promise<SendMagicLinkState> {
  const isEmailProviderConfigured = authConfig.providers.some((provider) => {
    const id = typeof provider === "function" ? provider({}).id : provider.id;
    return id === EMAIL_PROVIDER_ID;
  });

  if (!isEmailProviderConfigured) {
    return { status: "error", message: "Email sign-in isn't available right now." };
  }

  const rawEmail = String(formData.get("email") ?? "");
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address",
    };
  }

  const email = normalizeEmail(parsed.data);

  const { success } = await getEmailSignInRateLimiter().limit(emailRateLimitId(email));
  if (!success) {
    // Rate-limited requests still return the neutral "sent" message (see
    // NEUTRAL_SENT_MESSAGE above) — only the server log distinguishes it.
    logger.warn("auth.email_signin.rate_limited");
    return { status: "sent", message: NEUTRAL_SENT_MESSAGE };
  }

  try {
    await signIn(EMAIL_PROVIDER_ID, { email, redirectTo: "/dashboard", redirect: false });
  } catch (error) {
    logger.error("auth.email_signin.failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  return { status: "sent", message: NEUTRAL_SENT_MESSAGE };
}
