import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Next.js resolves "server-only" to a no-op via its "react-server"
      // bundler condition; plain Node/Vite resolution doesn't set that
      // condition, so the package's default export throws unconditionally.
      // Point it at the package's own no-op build instead.
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
    },
  },
  test: {
    // Default to node: most tests exercise server-only modules (routes,
    // services, encryption) that reject a `window` global. Add a
    // `// @vitest-environment jsdom` directive at the top of any test file
    // that needs to render Client Components.
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
