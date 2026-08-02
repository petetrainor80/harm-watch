import { test, expect } from "@playwright/test";

// Critical path 2: Organisation approval flow
// Requires:
//   E2E_ADMIN_EMAIL — super_admin email
//   E2E_ADMIN_PASSWORD — super_admin password
// These must be set in CI environment variables or a local .env.test file.

test.describe("Organisation approval flow", () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, "E2E_ADMIN_EMAIL not set — skipping admin tests");

  test("admin can log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test("admin submissions list is accessible after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);

    await page.goto("/admin/submissions");
    await expect(page.getByRole("heading", { name: /submissions/i })).toBeVisible();
  });

  test("admin organisations page shows pending queue", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);

    await page.goto("/admin/organisations");
    await expect(page.getByRole("heading", { name: /pending/i })).toBeVisible();
  });

  test("unapproved user is redirected from /org", async ({ page }) => {
    // Access /org without a session — should redirect to /login.
    await page.goto("/org");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("unauthenticated user is redirected from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
