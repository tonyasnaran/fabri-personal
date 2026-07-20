/**
 * Maps Auth.js's `?error=` query-param codes to safe, user-facing copy.
 *
 * Auth.js already does the hard part: internally it only forwards a small
 * whitelist of "client-safe" error types verbatim (see `clientErrors` in
 * @auth/core/errors.js) and collapses everything else — including real
 * config/database errors — to a generic "Configuration" code before it ever
 * reaches this app. This module's job is just to turn those known codes
 * into friendly copy; it must never render the raw code, a stack trace, or
 * any provider/database response body to the user.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access denied. You don't have permission to sign in.",
  Verification: "This sign-in link is invalid or has expired. Request a new one.",
  OAuthAccountNotLinked:
    "That email address is already associated with a different sign-in method. Please use the method you originally signed up with.",
  AccountNotLinked:
    "That email address is already associated with a different sign-in method. Please use the method you originally signed up with.",
  OAuthCallbackError: "We couldn't complete sign-in with that provider. Please try again.",
  MissingCSRF: "Your sign-in attempt expired before it could complete. Please try again.",
  WebAuthnVerificationError: "We couldn't verify that sign-in attempt. Please try again.",
  CredentialsSignin: "Those credentials couldn't be verified. Please try again.",
};

const DEFAULT_MESSAGE =
  "Something went wrong while signing you in. Please try again, or contact support if the problem continues.";

export function getAuthErrorMessage(code: string | null | undefined): string {
  if (!code) return DEFAULT_MESSAGE;
  return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_MESSAGE;
}

/** A short heading distinct from the body message, for the error page layout. */
export function getAuthErrorHeading(code: string | null | undefined): string {
  switch (code) {
    case "AccessDenied":
      return "Access denied";
    case "Verification":
      return "Link expired";
    case "OAuthAccountNotLinked":
    case "AccountNotLinked":
      return "Account already exists";
    default:
      return "Authentication error";
  }
}
