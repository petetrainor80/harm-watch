import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js script bundles are served from /_next/static/ (same origin).
  // Turnstile runs in a sandboxed iframe — no script source needed for it.
  "script-src 'self'",
  // Tailwind v4 generates a static CSS file in production; no inline styles needed.
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  // Supabase Auth and Realtime connections.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  // Turnstile embeds in an iframe from Cloudflare.
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        // Apply to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
