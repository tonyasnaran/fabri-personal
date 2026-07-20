import "server-only";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Consistent API envelope used by every route handler in the app.
 *
 * Success: { data: T, error: null }
 * Failure: { data: null, error: { code, message, details? } }
 *
 * Handlers should always return one of the helpers below rather than
 * NextResponse.json() directly, and should never forward raw exception
 * messages or stack traces to the client.
 */

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "NOT_IMPLEMENTED"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiSuccess<T> = { data: T; error: null };
export type ApiFailure = {
  data: null;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  NOT_IMPLEMENTED: 501,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function apiSuccess<T>(data: T, init?: { status?: number }): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, error: null }, { status: init?.status ?? 200 });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  options?: { details?: unknown; status?: number },
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      data: null,
      error: { code, message, ...(options?.details ? { details: options.details } : {}) },
    },
    { status: options?.status ?? STATUS_BY_CODE[code] },
  );
}

export function unauthorizedResponse(
  message = "Authentication required",
): NextResponse<ApiFailure> {
  return apiError("UNAUTHORIZED", message);
}

export function forbiddenResponse(
  message = "You do not have access to this resource",
): NextResponse<ApiFailure> {
  return apiError("FORBIDDEN", message);
}

export function notFoundResponse(message = "Resource not found"): NextResponse<ApiFailure> {
  return apiError("NOT_FOUND", message);
}

export function rateLimitedResponse(
  message = "Too many requests. Please try again shortly.",
): NextResponse<ApiFailure> {
  return apiError("RATE_LIMITED", message);
}

export function validationErrorResponse(error: ZodError): NextResponse<ApiFailure> {
  return apiError("VALIDATION_ERROR", "Request validation failed", {
    details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
}

export function notImplementedResponse(message = "Not implemented yet"): NextResponse<ApiFailure> {
  return apiError("NOT_IMPLEMENTED", message);
}

/**
 * For unexpected exceptions. Logs the real error server-side (via the
 * caller) and returns only a generic message to the client — never a
 * stack trace or exception message, which could leak internals.
 */
export function internalErrorResponse(
  message = "An unexpected error occurred",
): NextResponse<ApiFailure> {
  return apiError("INTERNAL_ERROR", message);
}
