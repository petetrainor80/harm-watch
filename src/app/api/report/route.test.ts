import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/blocked-categories", () => ({
  checkForBlockedCategories: vi.fn(),
  recordBlockedRoutingEvent: vi.fn(),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/url", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/url")>();
  return {
    ...actual,
    hashIp: vi.fn().mockReturnValue("hashed-ip"),
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

import {
  checkForBlockedCategories,
  recordBlockedRoutingEvent,
} from "@/lib/blocked-categories";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  url: "https://example.com/scam",
  categories: ["fraud"],
  turnstile_token: "test-token",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkForBlockedCategories).mockResolvedValue({ blocked: false });
  vi.mocked(recordBlockedRoutingEvent).mockResolvedValue(undefined);
  vi.mocked(verifyTurnstileToken).mockResolvedValue(true);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
});

describe("POST /api/report — blocked category routing", () => {
  it("returns 422 and redirect payload for a blocked category", async () => {
    vi.mocked(checkForBlockedCategories).mockResolvedValue({
      blocked: true,
      slug: "csam",
      redirect_url: "https://www.iwf.org.uk/report/",
      redirect_copy: "Please report to the IWF.",
    });

    const res = await POST(makeRequest({ ...validPayload, categories: ["csam"] }));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe("blocked_category");
    expect(body.error.redirect_url).toBe("https://www.iwf.org.uk/report/");
  });

  it("records a counter event for a blocked category", async () => {
    vi.mocked(checkForBlockedCategories).mockResolvedValue({
      blocked: true,
      slug: "terrorism",
      redirect_url: "https://www.gov.uk/report-terrorism",
      redirect_copy: "Report to the government.",
    });

    await POST(makeRequest({ ...validPayload, categories: ["terrorism"] }));

    expect(recordBlockedRoutingEvent).toHaveBeenCalledOnce();
    expect(recordBlockedRoutingEvent).toHaveBeenCalledWith("terrorism");
  });

  it("does NOT call recordBlockedRoutingEvent for a valid category", async () => {
    await POST(makeRequest(validPayload));

    expect(recordBlockedRoutingEvent).not.toHaveBeenCalled();
  });

  it("returns 202 for a valid payload", async () => {
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(202);
  });

  it("returns 403 when Turnstile verification fails", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 3600 });

    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(429);
  });

  it("returns fake 200 success for a filled honeypot — no DB calls", async () => {
    const res = await POST(
      makeRequest({ ...validPayload, company_url: "https://spam.com" })
    );

    expect(res.status).toBe(200);
    expect(checkForBlockedCategories).not.toHaveBeenCalled();
    expect(recordBlockedRoutingEvent).not.toHaveBeenCalled();
  });

  it("returns 422 for a missing categories field", async () => {
    const res = await POST(
      makeRequest({ url: "https://example.com", turnstile_token: "token" })
    );
    expect(res.status).toBe(422);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/report", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
