import { z } from "zod";

// Shared schema used by both the client (for live validation) and the Route
// Handler (for server-side validation). Zod is the single source of truth.
//
// M2: categories field active for blocked-category routing.
// M3: url, turnstile_token, and remaining fields enforced end-to-end.

export const reportSchema = z.object({
  url: z.string().url("Enter a valid URL starting with https://"),

  // At least one category required. Blocked slugs are rejected by the Route
  // Handler after this schema passes — schema only validates shape, not content.
  categories: z
    .array(z.string().min(1))
    .min(1, "Select at least one category"),

  descriptors: z.array(z.string()).default([]),

  suggested_tag: z.string().max(40).optional(),

  context: z.string().max(500).optional(),

  // Optional — only collected with explicit consent.
  reporter_email: z.string().email().optional(),

  // Cloudflare Turnstile widget response token. Verified server-side.
  turnstile_token: z.string().min(1, "Complete the security check"),

  // Honeypot — must be absent or empty. Any value = silent fake success.
  company_url: z.string().optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
