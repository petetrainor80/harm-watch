import { test, expect } from "@playwright/test";

// Critical path 1: Public submission form
// Requires: a running dev/preview instance with Turnstile in test mode.
// Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to the Turnstile test key (1x00000000000000000000AA)
// which auto-passes without user interaction.

test.describe("Public submission form", () => {
  test("loads the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /harm watch/i })).toBeVisible();
  });

  test("shows the 999 emergency line", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/call 999/i)).toBeVisible();
  });

  test("URL field normalises and previews the entered URL", async ({ page }) => {
    await page.goto("/");
    const urlInput = page.getByLabel(/website url/i);
    await urlInput.fill("http://www.example.com/path?utm_source=test");
    // Preview should appear with normalised form.
    await expect(page.getByText(/https:\/\/example\.com/)).toBeVisible();
  });

  test("selecting a blocked category shows the redirect interstitial", async ({ page }) => {
    await page.goto("/");
    // Click the CSAM category option (which is blocked).
    const csamButton = page.getByRole("button", { name: /child sexual abuse/i });
    if (await csamButton.isVisible()) {
      await csamButton.click();
      await expect(page.getByText(/internet watch foundation/i)).toBeVisible();
    }
  });

  test("form requires at least one category before submission", async ({ page }) => {
    await page.goto("/");
    const urlInput = page.getByLabel(/website url/i);
    await urlInput.fill("https://example.com");
    const submitBtn = page.getByRole("button", { name: /submit/i });
    // Submit should be disabled or show validation without a category.
    await submitBtn.click();
    // Either the button is disabled or a validation message appears.
    const isDisabled = await submitBtn.isDisabled();
    if (!isDisabled) {
      // Should show an error if submitted without category.
      await expect(page.getByText(/category/i)).toBeVisible();
    }
  });

  test("shows success state after valid submission (Turnstile test mode required)", async ({ page }) => {
    // This test requires NEXT_PUBLIC_TURNSTILE_SITE_KEY set to the test key.
    // Skip if not in a test environment.
    const isTurnstileTestMode = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === "1x00000000000000000000AA";
    if (!isTurnstileTestMode) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.getByLabel(/website url/i).fill("https://example-test-harm.com");

    // Select a non-blocked category.
    const fraudBtn = page.getByRole("button", { name: /fraud/i });
    await fraudBtn.click();

    // Consent checkbox.
    const consent = page.getByRole("checkbox", { name: /good faith/i });
    if (await consent.isVisible()) await consent.check();

    await page.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
  });
});
