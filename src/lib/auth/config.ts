import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/security/logger";

/**
 * Auth.js foundation.
 *
 * Providers are wired in conditionally: if OAuth credentials aren't set
 * (e.g. local development before secrets are configured), the provider is
 * simply omitted rather than crashing the app. This is a placeholder
 * configuration — do not treat an empty provider list as a security
 * bypass, it just means nobody can sign in yet.
 *
 * TODO(next-task): add an Email (magic link) provider once an SMTP/Resend
 * key is available. Requires an additional env var not yet in .env.example.
 *
 * Note: Next.js 16 renamed `middleware.ts` to `proxy.ts` and Proxy now
 * defaults to the Node.js runtime (previously Edge-only), so this config
 * — including the Prisma adapter — can be safely imported directly from
 * `src/proxy.ts` without the old edge/node config split.
 */

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
  },
  // Required for self-hosted deployments (this app isn't Vercel-only, which
  // sets this automatically). The trusted host is still whatever the
  // reverse proxy / platform actually serves — this doesn't widen it.
  trustHost: true,
  providers,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      logger.info("auth.sign_in", { userId: user.id });
    },
    async signOut(message) {
      const userId = "session" in message ? message.session?.userId : undefined;
      logger.info("auth.sign_out", { userId });
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
