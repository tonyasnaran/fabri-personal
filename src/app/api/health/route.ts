import { apiSuccess } from "@/lib/api/response";

/**
 * Intentionally minimal: application status, timestamp, and environment
 * name only. Never return secrets, connection strings, or internal
 * system details from this endpoint — it's unauthenticated by design.
 */
export async function GET() {
  return apiSuccess({
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
}
