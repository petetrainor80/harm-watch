import { parse as parseTld } from "tldts";
import { createHash, createHmac } from "crypto";

export interface NormaliseResult {
  normalised: string;
  domain: string;
  hash: string;
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "mc_eid",
  "igshid",
]);

// Private IPv4 ranges to reject
const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.0\.0\.0|169\.254\.)/;

export function normaliseUrl(raw: string): NormaliseResult {
  const trimmed = raw.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are accepted");
  }

  const hostname = url.hostname.toLowerCase();

  // Reject localhost, IP literals, and private ranges
  if (
    hostname === "localhost" ||
    hostname === "::1" ||
    PRIVATE_IP_RE.test(hostname) ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname) // any IPv4 literal
  ) {
    throw new Error("Private and local addresses are not accepted");
  }

  // Validate public suffix — rejects made-up TLDs
  const tld = parseTld(hostname);
  if (!tld.domain) {
    throw new Error("URL must have a valid public suffix");
  }

  // Canonicalize: always https, strip www. prefix so http://www.x.com ≡ https://x.com
  const canonHostname = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // Drop default ports (port 80 on http treated as https after canonicalization)
  const port = url.port === "80" || url.port === "443" ? "" : url.port;

  // Strip credentials
  const host = port ? `${canonHostname}:${port}` : canonHostname;

  // Remove tracking params; sort the rest alphabetically
  const params = new URLSearchParams(url.searchParams);
  for (const key of [...params.keys()]) {
    if (TRACKING_PARAMS.has(key) || key.startsWith("utm_")) {
      params.delete(key);
    }
  }
  params.sort();

  // Remove fragment
  // Build normalised URL manually to control trailing-slash behaviour:
  // strip the trailing slash only when the path is empty (just "/")
  const path = url.pathname === "/" ? "" : url.pathname;
  const search = params.size > 0 ? `?${params.toString()}` : "";
  const normalised = `https://${host}${path}${search}`;

  // Registrable domain via public suffix list (e.g. a.b.example.co.uk → example.co.uk)
  const domain = tld.domain;

  const hash = createHash("sha256").update(normalised).digest("hex");

  return { normalised, domain, hash };
}

// Defang a URL for display in admin views — never render reported URLs as
// live hyperlinks. Replaces scheme and dots in hostname so the URL cannot
// be clicked or auto-linked.
export function defangUrl(url: string): string {
  try {
    const u = new URL(url);
    const scheme = u.protocol.replace("http", "hxxp");
    const host = u.hostname.replace(/\./g, "[.]");
    const port = u.port ? `:${u.port}` : "";
    return `${scheme}//${host}${port}${u.pathname}${u.search}`;
  } catch {
    return url.replace(/^https?:\/\//, (m) => m.replace("http", "hxxp"));
  }
}

// HMAC of an IP address with a server-side pepper. Rotating the pepper resets
// throttle continuity by design — see PRD section 10.
export function hashIp(ip: string): string {
  const pepper = process.env.IP_HMAC_PEPPER;
  if (!pepper) throw new Error("IP_HMAC_PEPPER is not set");
  return createHmac("sha256", pepper).update(ip).digest("hex");
}
