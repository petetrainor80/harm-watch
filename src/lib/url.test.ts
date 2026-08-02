import { describe, it, expect } from "vitest";
import { normaliseUrl } from "./url";

describe("normaliseUrl — basic normalisation", () => {
  it("lowercases the scheme and host", () => {
    const { normalised } = normaliseUrl("HTTPS://EXAMPLE.COM/Path");
    expect(normalised).toBe("https://example.com/Path");
  });

  it("strips the trailing slash when the path is empty", () => {
    const { normalised } = normaliseUrl("https://example.com/");
    expect(normalised).toBe("https://example.com");
  });

  it("keeps the trailing slash when the path is non-empty", () => {
    const { normalised } = normaliseUrl("https://example.com/path/");
    expect(normalised).toBe("https://example.com/path/");
  });

  it("canonicalizes http to https", () => {
    const { normalised } = normaliseUrl("http://example.com/path");
    expect(normalised).toBe("https://example.com/path");
  });

  it("strips the www. prefix", () => {
    const { normalised } = normaliseUrl("https://www.example.com/path");
    expect(normalised).toBe("https://example.com/path");
  });

  it("drops the default http port", () => {
    const { normalised } = normaliseUrl("http://example.com:80/path");
    expect(normalised).toBe("https://example.com/path");
  });

  it("drops the default https port", () => {
    const { normalised } = normaliseUrl("https://example.com:443/path");
    expect(normalised).toBe("https://example.com/path");
  });

  it("keeps non-default ports", () => {
    const { normalised } = normaliseUrl("https://example.com:8080/path");
    expect(normalised).toBe("https://example.com:8080/path");
  });

  it("strips credentials from the authority", () => {
    const { normalised } = normaliseUrl("https://user:pass@example.com/path");
    expect(normalised).toBe("https://example.com/path");
  });

  it("removes the fragment", () => {
    const { normalised } = normaliseUrl("https://example.com/page#section");
    expect(normalised).toBe("https://example.com/page");
  });

  it("preserves path case", () => {
    const { normalised } = normaliseUrl("https://example.com/SomePath/File.html");
    expect(normalised).toBe("https://example.com/SomePath/File.html");
  });
});

describe("normaliseUrl — tracking parameter removal", () => {
  it("strips utm_* parameters", () => {
    const { normalised } = normaliseUrl(
      "https://example.com/page?utm_source=google&utm_medium=cpc&q=test"
    );
    expect(normalised).toBe("https://example.com/page?q=test");
  });

  it("strips fbclid", () => {
    const { normalised } = normaliseUrl(
      "https://example.com/?fbclid=abc123&q=test"
    );
    expect(normalised).toBe("https://example.com?q=test");
  });

  it("strips gclid, msclkid, ref, mc_eid, igshid", () => {
    const { normalised } = normaliseUrl(
      "https://example.com/?gclid=a&msclkid=b&ref=c&mc_eid=d&igshid=e"
    );
    expect(normalised).toBe("https://example.com");
  });

  it("sorts remaining query parameters alphabetically", () => {
    const { normalised } = normaliseUrl(
      "https://example.com/?z=last&a=first&m=middle"
    );
    expect(normalised).toBe("https://example.com?a=first&m=middle&z=last");
  });

  it("produces the same hash for URLs that differ only by tracking params", () => {
    const a = normaliseUrl("https://example.com/page?utm_source=email");
    const b = normaliseUrl("https://example.com/page");
    expect(a.hash).toBe(b.hash);
  });
});

describe("normaliseUrl — domain extraction", () => {
  it("extracts the registrable domain", () => {
    const { domain } = normaliseUrl("https://sub.example.com/path");
    expect(domain).toBe("example.com");
  });

  it("handles multi-part TLDs (co.uk)", () => {
    const { domain } = normaliseUrl("https://a.b.example.co.uk/path");
    expect(domain).toBe("example.co.uk");
  });
});

describe("normaliseUrl — deduplication via hash", () => {
  it("produces identical hashes for the same effective URL", () => {
    const a = normaliseUrl("HTTPS://EXAMPLE.COM/?utm_source=x#frag");
    const b = normaliseUrl("https://example.com/");
    expect(a.hash).toBe(b.hash);
  });

  it("treats http and https as the same site", () => {
    const a = normaliseUrl("http://example.com/page");
    const b = normaliseUrl("https://example.com/page");
    expect(a.hash).toBe(b.hash);
  });

  it("treats www and non-www as the same site", () => {
    const a = normaliseUrl("https://www.example.com/page");
    const b = normaliseUrl("https://example.com/page");
    expect(a.hash).toBe(b.hash);
  });

  it("treats http://www and https:// as the same site", () => {
    const a = normaliseUrl("http://www.example.com");
    const b = normaliseUrl("https://example.com");
    expect(a.hash).toBe(b.hash);
  });

  it("produces different hashes for genuinely different URLs", () => {
    const a = normaliseUrl("https://example.com/page-a");
    const b = normaliseUrl("https://example.com/page-b");
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("normaliseUrl — rejection", () => {
  it("rejects non-http schemes", () => {
    expect(() => normaliseUrl("ftp://example.com")).toThrow();
  });

  it("rejects file:// URLs", () => {
    expect(() => normaliseUrl("file:///etc/passwd")).toThrow();
  });

  it("rejects data: URIs", () => {
    expect(() => normaliseUrl("data:text/html,<h1>hi</h1>")).toThrow();
  });

  it("rejects localhost", () => {
    expect(() => normaliseUrl("https://localhost/admin")).toThrow();
  });

  it("rejects IPv4 literals", () => {
    expect(() => normaliseUrl("https://192.168.1.1/")).toThrow();
  });

  it("rejects private ranges", () => {
    expect(() => normaliseUrl("https://10.0.0.1/")).toThrow();
  });

  it("rejects plainly invalid URLs", () => {
    expect(() => normaliseUrl("not a url")).toThrow();
  });
});
