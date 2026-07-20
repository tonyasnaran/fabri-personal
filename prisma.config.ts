import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// `dotenv/config`'s default behavior only loads `.env`, but this project
// (matching Next.js's own convention) keeps local secrets in `.env.local`.
// Load that explicitly so `prisma migrate`/`db push` etc. see the same
// DATABASE_URL the app itself resolves at runtime.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
