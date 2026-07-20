import { siteConfig } from "@/config/site";

/**
 * Branded sign-in email. Deliberately contains no sensitive information
 * beyond the single-use sign-in link itself (no user data, no internal
 * ids). The raw token/url is never logged — see auth config's
 * sendVerificationRequest for the logging boundary.
 */
export function renderSignInEmail({ url, host }: { url: string; host: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Sign in to ${siteConfig.name}`;

  const text = [
    `Sign in to ${siteConfig.name}`,
    "",
    `Use the link below to sign in on ${host}:`,
    url,
    "",
    "This link expires in 24 hours and can only be used once.",
    "",
    "If you didn't request this email, you can safely ignore it — no account changes were made.",
  ].join("\n");

  const html = `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#71717a;letter-spacing:0.02em;text-transform:uppercase;">${escapeHtml(siteConfig.name)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#18181b;">Sign in to your dashboard</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">
                  Click the button below to sign in on <strong>${escapeHtml(host)}</strong>. This link expires in 24 hours and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <a href="${escapeHtml(url)}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">
                  Sign in
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                  If the button doesn't work, copy and paste this link into your browser:<br />
                  <span style="word-break:break-all;">${escapeHtml(url)}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px;">
                  Didn't request this email? You can safely ignore it — no changes were made to your account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
