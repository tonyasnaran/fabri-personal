import type { NextConfig } from "next";
import path from "node:path";

/**
 * Baseline CSP. `unsafe-inline` on style-src is required by Next.js's
 * inlined critical CSS; there is no inline script usage in this app
 * (no `dangerouslySetInnerHTML`, no eval). Tighten further with a nonce
 * if/when third-party scripts are introduced.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
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
