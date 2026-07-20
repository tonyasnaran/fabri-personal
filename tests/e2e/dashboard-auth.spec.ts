import { test, expect } from "@playwright/test";

test.describe("Dashboard authentication", () => {
  test("unauthenticated users are redirected from /dashboard to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthenticated users are redirected from a nested dashboard route", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("the public home page does not require authentication", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});
