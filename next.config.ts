import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV === "development";

/**
 * Baseline CSP.
 *
 * `unsafe-inline` on style-src is required by Next.js's inlined critical
 * CSS. `unsafe-inline` on script-src is required by Next.js App Router
 * itself: every page (not just this app's own code) streams its RSC
 * hydration payload to the browser via inline `<script>` tags
 * (`self.__next_f.push(...)`) — this is Next's own runtime mechanism, not
 * anything we author. Without it, pages with a `loading.tsx` (which wraps
 * the route in a Suspense boundary and streams the real content in after
 * the fallback) never receive that follow-up chunk: the browser is left
 * showing the loading skeleton forever, with no error thrown anywhere
 * server-side. Confirmed by reproducing this exact freeze in production.
 *
 * Next's documented alternative is a per-request nonce generated in
 * proxy.ts, but that requires *every* page to render dynamically — no
 * static optimization anywhere in the app, including the public marketing
 * pages, which lose nothing from XSS-hardening they don't render any
 * user-controlled content to begin with. Given that tradeoff, `unsafe-inline`
 * here is a deliberate, framework-mandated exception, not a "silence the
 * console" workaround — see node_modules/next/dist/docs/01-app/02-guides/
 * content-security-policy.md for Next's own writeup of both options.
 * `unsafe-eval` is added only in development, where React needs it to
 * reconstruct server-side error stacks in the browser; it's never present
 * in a production response.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // https://cdn.plaid.com: Plaid Link loads its own script from here
  // (react-plaid-link injects a <script src="https://cdn.plaid.com/link/...">
  // tag) — this is Plaid's documented CSP requirement for embedding Link,
  // not optional.
  `script-src 'self' 'unsafe-inline' https://cdn.plaid.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  // production.plaid.com/sandbox.plaid.com/tags.plaid.com: Plaid Link's
  // script pings these directly from our page context before/while the
  // Link iframe is open (telemetry, config). Once the iframe itself is
  // open, its own network activity runs under cdn.plaid.com's CSP, not
  // ours, so it doesn't need to be listed here too.
  "connect-src 'self' https://production.plaid.com https://sandbox.plaid.com https://tags.plaid.com",
  // Plaid Link renders as an iframe from cdn.plaid.com.
  "frame-src https://cdn.plaid.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // 'self' plus the OAuth providers' authorization endpoints: the
  // "Continue with Google/GitHub" buttons are same-origin form
  // submissions that the server then 303-redirects to the provider.
  // Browsers enforce form-action against that redirect target too (not
  // just the form's initial action URL), so omitting these silently
  // blocks the redirect — the request still succeeds server-side (a
  // valid Location header is sent), the browser just won't follow it.
  "form-action 'self' https://accounts.google.com https://github.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A lockfile in a parent directory (outside this repo) makes Next.js guess
  // the workspace root; pin it explicitly to this project.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
