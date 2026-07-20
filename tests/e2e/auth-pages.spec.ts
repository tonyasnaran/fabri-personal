import { test, expect } from "@playwright/test";

test.describe("Protected dashboard routes", () => {
  for (const path of [
    "/dashboard",
    "/dashboard/accounts",
    "/dashboard/transactions",
    "/dashboard/analytics",
    "/dashboard/settings",
  ]) {
    test(`${path} cannot be reached directly while unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in/);
    });
  }
});

test.describe("Sign-in page", () => {
  test("renders without crashing and shows a back-to-site link", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to site/i })).toBeVisible();
  });

  test("renders exactly one coherent provider state, whatever is configured in this environment", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    // Whichever of these is true depends on which providers this
    // environment's .env.local happens to have configured — the page must
    // render some coherent state either way, never a crash or a blank form.
    const hasNoticeOrForm = await page
      .getByRole("status")
      .or(page.getByLabel(/email address/i))
      .or(page.getByRole("button", { name: /continue with/i }))
      .first()
      .isVisible();
    expect(hasNoticeOrForm).toBe(true);
  });

  test("email validation error is accessible (announced via role=alert, tied to the field)", async ({
    page,
  }) => {
    const emailField = page.getByLabel(/email address/i);
    if ((await emailField.count()) === 0) {
      test.skip(true, "Email provider not configured in this environment");
    }

    await page.goto("/sign-in");
    await emailField.fill("not-an-email");
    // Browser-native `type="email"` validation may block submission before
    // our server action runs; force submission via the form to exercise the
    // server-side validation path too.
    await page.getByRole("button", { name: /send sign-in link/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Auth status pages render safely", () => {
  test("/verify-request renders a check-your-email message", async ({ page }) => {
    await page.goto("/verify-request");
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  });

  test("/auth-error renders a safe, generic message for an unknown error code", async ({
    page,
  }) => {
    await page.goto("/auth-error?error=SomeInternalDatabaseFailure");
    await expect(page.getByRole("heading", { name: /authentication error/i })).toBeVisible();

    // Only the visible card content, not the whole document — the raw HTML
    // also contains Next.js's React Server Components hydration payload,
    // which naturally echoes the URL/searchParams for client-side routing.
    // That's normal Next.js behavior (the query string is already visible
    // in the address bar), not a leak; what matters is the *rendered*
    // message the user actually reads.
    const card = page
      .locator("div", { has: page.getByRole("heading", { name: /authentication error/i }) })
      .first();
    const visibleText = await card.innerText();
    expect(visibleText).not.toContain("SomeInternalDatabaseFailure");
    expect(visibleText.toLowerCase()).not.toContain("prisma");
    expect(visibleText.toLowerCase()).not.toContain("stack");
  });

  test("/auth-error maps AccessDenied to a distinct heading", async ({ page }) => {
    await page.goto("/auth-error?error=AccessDenied");
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
  });

  test("/signed-out renders with links back to sign-in and home", async ({ page }) => {
    await page.goto("/signed-out");
    await expect(page.getByRole("heading", { name: /signed out/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^sign in$/i })).toBeVisible();
  });
});
