import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  apiSuccess,
  apiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  notImplementedResponse,
  internalErrorResponse,
  rateLimitedResponse,
} from "@/lib/api/response";

describe("api response helpers", () => {
  it("apiSuccess returns the standard success envelope", async () => {
    const res = apiSuccess({ hello: "world" });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { hello: "world" }, error: null });
  });

  it("apiError returns the standard error envelope with the right status", async () => {
    const res = apiError("CONFLICT", "already exists");
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      data: null,
      error: { code: "CONFLICT", message: "already exists" },
    });
  });

  it("unauthorizedResponse returns 401", async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("forbiddenResponse returns 403", () => {
    expect(forbiddenResponse().status).toBe(403);
  });

  it("notFoundResponse returns 404", () => {
    expect(notFoundResponse().status).toBe(404);
  });

  it("notImplementedResponse returns 501", () => {
    expect(notImplementedResponse().status).toBe(501);
  });

  it("rateLimitedResponse returns 429", async () => {
    const res = rateLimitedResponse();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("internalErrorResponse returns 500 and never leaks the raw message", async () => {
    const res = internalErrorResponse();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).toBe("An unexpected error occurred");
  });

  it("validationErrorResponse maps Zod issues to field-level details", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);

    if (!result.success) {
      const res = validationErrorResponse(result.error);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details[0].path).toBe("email");
    }
  });
});
