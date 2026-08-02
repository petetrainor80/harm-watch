import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the service client before importing the module under test
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import {
  checkForBlockedCategories,
  recordBlockedRoutingEvent,
} from "./blocked-categories";

function mockClient(rowData: Record<string, unknown> | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: rowData, error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  return { from: vi.fn().mockReturnValue(chain), _chain: chain };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkForBlockedCategories", () => {
  it("returns blocked: true for csam", async () => {
    const client = mockClient({
      slug: "csam",
      redirect_url: "https://www.iwf.org.uk/report/",
      redirect_copy: "Please report to the IWF.",
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const result = await checkForBlockedCategories(["csam"]);

    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.slug).toBe("csam");
      expect(result.redirect_url).toBe("https://www.iwf.org.uk/report/");
    }
  });

  it("returns blocked: true for terrorism", async () => {
    const client = mockClient({
      slug: "terrorism",
      redirect_url: "https://www.gov.uk/report-terrorism",
      redirect_copy: "Please report to the government.",
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const result = await checkForBlockedCategories(["terrorism"]);

    expect(result.blocked).toBe(true);
  });

  it("returns blocked: false for a valid category", async () => {
    const client = mockClient(null);
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const result = await checkForBlockedCategories(["fraud"]);

    expect(result.blocked).toBe(false);
  });

  it("detects a blocked slug mixed in with valid ones", async () => {
    const client = mockClient({
      slug: "csam",
      redirect_url: "https://www.iwf.org.uk/report/",
      redirect_copy: "Please report to the IWF.",
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const result = await checkForBlockedCategories(["fraud", "csam"]);

    expect(result.blocked).toBe(true);
  });
});

describe("recordBlockedRoutingEvent", () => {
  it("inserts a row with the tag slug and nothing else", async () => {
    const client = mockClient(null);
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    await recordBlockedRoutingEvent("csam");

    expect(client.from).toHaveBeenCalledWith("blocked_routing_events");
    expect(client._chain.insert).toHaveBeenCalledWith({ tag_slug: "csam" });
    // Must not include URL, IP, or any other payload
    const insertArg = client._chain.insert.mock.calls[0][0];
    expect(Object.keys(insertArg)).toEqual(["tag_slug"]);
  });
});
