import { test, expect } from "@playwright/test";

// Critical path 3: Read-only JSON API
// Requires:
//   E2E_API_KEY — a valid hw_live_* key issued to an approved organisation
// Without this, all API tests are skipped.

const API_BASE = process.env.PLAYWRIGHT_BASE_URL
  ? `${process.env.PLAYWRIGHT_BASE_URL}/api/v1`
  : "http://localhost:3000/api/v1";

test.describe("Public API — /api/v1", () => {
  test("returns 401 with no Authorization header", async ({ request }) => {
    const res = await request.get(`${API_BASE}/submissions`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");
  });

  test("returns 401 with an invalid key", async ({ request }) => {
    const res = await request.get(`${API_BASE}/submissions`, {
      headers: { Authorization: "Bearer hw_live_definitely_not_valid_00000000000000" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /tags returns 401 without a key", async ({ request }) => {
    const res = await request.get(`${API_BASE}/tags`);
    expect(res.status()).toBe(401);
  });

  test.describe("with a valid API key", () => {
    test.skip(!process.env.E2E_API_KEY, "E2E_API_KEY not set — skipping authenticated API tests");

    test("GET /submissions returns paginated data", async ({ request }) => {
      const res = await request.get(`${API_BASE}/submissions`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.has_more).toBe("boolean");
    });

    test("response does not contain reporter data", async ({ request }) => {
      const res = await request.get(`${API_BASE}/submissions`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      const body = await res.json();
      const text = JSON.stringify(body);
      expect(text).not.toContain("reporter_email");
      expect(text).not.toContain("ip_hash");
      expect(text).not.toContain("context");
      expect(text).not.toContain("admin_notes");
      expect(text).not.toContain("status_note");
    });

    test("includes rate limit headers", async ({ request }) => {
      const res = await request.get(`${API_BASE}/submissions`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      expect(res.headers()["x-ratelimit-limit"]).toBeDefined();
      expect(res.headers()["x-ratelimit-remaining"]).toBeDefined();
      expect(res.headers()["x-ratelimit-reset"]).toBeDefined();
    });

    test("GET /tags returns active taxonomy", async ({ request }) => {
      const res = await request.get(`${API_BASE}/tags`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      // Blocked tags (csam, terrorism) must not appear in the API response.
      const slugs = body.data.map((t: { slug: string }) => t.slug);
      expect(slugs).not.toContain("csam");
      expect(slugs).not.toContain("terrorism");
    });

    test("GET /submissions/:id returns 404 for unknown id", async ({ request }) => {
      const res = await request.get(`${API_BASE}/submissions/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      expect(res.status()).toBe(404);
    });

    test("cursor-based pagination works", async ({ request }) => {
      const first = await request.get(`${API_BASE}/submissions?limit=2`, {
        headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` },
      });
      const firstBody = await first.json();

      if (firstBody.has_more && firstBody.next_cursor) {
        const second = await request.get(
          `${API_BASE}/submissions?limit=2&cursor=${firstBody.next_cursor}`,
          { headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` } }
        );
        expect(second.status()).toBe(200);
        const secondBody = await second.json();
        // IDs on page 2 should not appear on page 1.
        const firstIds = new Set(firstBody.data.map((s: { id: string }) => s.id));
        for (const s of secondBody.data) {
          expect(firstIds.has(s.id)).toBe(false);
        }
      }
    });
  });
});
