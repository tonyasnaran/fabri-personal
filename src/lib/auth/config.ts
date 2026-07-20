import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/security/logger";
import { recordAuditEvent } from "@/lib/security/audit";
import { getServerEnv, isGoogleAuthConfigured, isGitHubAuthConfigured } from "@/config/env";
import { normalizeEmail } from "@/lib/auth/normalize-email";
import { sendVerificationEmail } from "@/lib/auth/send-verification-email";

/**
 * Auth.js configuration.
 *
 * Providers are wired in conditionally: if a provider's credentials aren't
 * set, it's simply omitted from the list rather than crashing the app or
 * being offered non-functionally. `src/config/env.ts` already enforces that
 * each provider's env vars come in complete pairs (e.g. AUTH_GOOGLE_ID
 * requires AUTH_GOOGLE_SECRET) — by the time this module runs, a partially
 * configured provider has already failed startup with a clear error.
 *
 * Note: Next.js 16 renamed `middleware.ts` to `proxy.ts` and Proxy now
 * defaults to the Node.js runtime (previously Edge-only), so this config
 * — including the Prisma adapter — can be safely imported directly from
 * `src/proxy.ts` without the old edge/node config split.
 */

const env = getServerEnv();

const providers: NextAuthConfig["providers"] = [];

if (isGoogleAuthConfigured(env)) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (isGitHubAuthConfigured(env)) {
  providers.push(
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  );
}

// Narrowed to local consts (rather than relying on isEmailAuthConfigured())
// so TypeScript knows both values are defined below, without non-null
// assertions.
const resendApiKey = env.AUTH_RESEND_KEY;
const emailFrom = env.AUTH_EMAIL_FROM;
if (resendApiKey && emailFrom) {
  providers.push(
    Resend({
      apiKey: resendApiKey,
      from: emailFrom,
      maxAge: 24 * 60 * 60, // 24 hours — matches the copy in the email template.
      normalizeIdentifier: normalizeEmail,
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendVerificationEmail({ identifier, url, apiKey: resendApiKey, from: emailFrom });
      },
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
    error: "/auth-error",
  },
  // Deliberately NOT setting `allowDangerousEmailAccountLinking` on any
  // provider. Default (false) means a verified email that already has an
  // account under one provider cannot silently gain a second linked
  // provider account — Auth.js instead surfaces a safe
  // "OAuthAccountNotLinked" error (mapped in src/lib/auth/error-messages.ts)
  // and the user signs in with their original method. This trades a little
  // sign-in friction for not trusting a third-party's "email verified" flag
  // as proof of ownership on our behalf.
  providers,
  callbacks: {
    session({ session, user }) {
      // Only ever attach the internal user id — never provider tokens,
      // adapter internals, or anything not already in DefaultSession.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info("auth.sign_in", { userId: user.id, provider: account?.provider });
      await recordAuditEvent({
        userId: user.id ?? null,
        action: "auth.sign_in",
        entityType: "User",
        entityId: user.id ?? null,
        metadata: { provider: account?.provider ?? "unknown", isNewUser: Boolean(isNewUser) },
      });
    },
    async signOut(message) {
      const userId = "session" in message ? message.session?.userId : undefined;
      logger.info("auth.sign_out", { userId });
      await recordAuditEvent({
        userId: userId ?? null,
        action: "auth.sign_out",
        entityType: "User",
        entityId: userId ?? null,
      });
    },
    async createUser({ user }) {
      await recordAuditEvent({
        userId: user.id ?? null,
        action: "auth.user_created",
        entityType: "User",
        entityId: user.id ?? null,
      });
    },
    async linkAccount({ user, account }) {
      await recordAuditEvent({
        userId: user.id ?? null,
        action: "auth.account_linked",
        entityType: "Account",
        entityId: user.id ?? null,
        metadata: { provider: account.provider },
      });
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
