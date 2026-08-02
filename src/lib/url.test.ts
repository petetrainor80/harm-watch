import { describe, it, expect } from "vitest";
import { normaliseUrl } from "./url";

describe("normaliseUrl", () => {
  it("throws until M3 implementation is in place", () => {
    expect(() => normaliseUrl("https://example.com")).toThrow("Not implemented");
  });
});
