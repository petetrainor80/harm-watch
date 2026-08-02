@AGENTS.md

# The Harm Watch — CLAUDE.md

This file is the canonical context for any AI working in this repo. Read it fully before touching code.

---

## What this product is

A lightweight public reporting front door for websites that may breach the Online Safety Act 2023.
Anyone can submit a URL in under 30 seconds. Approved organisations (charities, regulators, ISPs, legal teams) get structured access to the resulting feed via a portal and read-only JSON API.

The full PRD lives at `/Users/pete/Downloads/harm-watch-prd.md`. Section 5 is the single most important section — read it before touching anything in the submission flow.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript strict) |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + RLS, Supabase Auth) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Bot protection | Cloudflare Turnstile (server-side verification, no exceptions) |
| Validation | Zod (shared client/server schemas) |
| Email | Resend (transactional only) |
| Rate limiting | Upstash Redis (first choice) or Postgres `submission_throttle` table |
| Unit tests | Vitest + @testing-library/react |
| E2E tests | Playwright (three critical paths: submission, approval, API read) |
| Error tracking | Sentry |

---

## Principles (from PRD section 2 — these win over all other requirements)

1. **We are a signal, not a verdict.** A submission is an allegation, nothing more. Never use "confirmed", "proven", or "illegal" against a record anywhere in the UI, DB, or API.
2. **We never host, mirror, cache, screenshot or proxy reported content.** Store URL and metadata only. No automated fetching of target sites.
3. **We do not become a distribution channel for the worst material.** Blocked categories (CSAM, terrorism) are routed away before any DB write. See section 5 of the PRD.
4. **The list is not public in the MVP.** Access is granted, not open.
5. **Deny by default.** RLS on every table. No anonymous writes direct to Postgres. No service role key in any client bundle.
6. **Minimal personal data.** Collect nothing we cannot justify.

---

## Hard safety requirement (PRD section 5)

Two categories must **never** reach the database: `csam` and `terrorism`.

- Client-side: selecting a blocked category replaces the form with a redirect interstitial.
- Server-side: the Route Handler rejects any payload carrying a blocked category slug with a 422 before any persistence.
- Only a counter is recorded (`blocked_routing_events` table: slug + timestamp, nothing else).
- This logic must exist and be tested before the form is capable of writing anything.

Blocked categories are data-driven: `tags.is_blocked = true`, with `redirect_url` and `redirect_copy` on the row.

---

## Key conventions

### Server components by default
Reach for client components only where interactivity demands it (form interactions, admin filters).

### Route Handlers for all mutations
Every privileged mutation: Route Handler → explicit role check → DB write → audit log entry, in a transaction where possible.

### URL display
**Never render a reported URL as a live hyperlink** anywhere in the product. Display defanged (`hxxps://example[.]com`) in admin views. Provide a copy button and a click-through confirmation if a link is ever needed.

### No hard deletes
Nothing in this product hard-deletes a submission. `removed` is a status, not a deletion.

### Audit log
Append-only (`audit_log` table). Write on every status change, approval, rejection, role change, key issue or revoke. No update or delete policy for anyone including super admin.

### `// PRD-Q:` comments
When a requirement is ambiguous, implement the more conservative reading and leave a `// PRD-Q:` comment explaining the ambiguity. Do not guess expansively.

---

## RLS helper functions

These are defined in the DB migration and used across all RLS policies:

```sql
-- Returns true if the calling user is a super_admin
create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql security definer;

-- Returns true if the calling user belongs to an approved organisation and their profile is active
create or replace function is_approved_org_user()
returns boolean as $$
  select exists (
    select 1 from profiles p
    join organisations o on o.id = p.organisation_id
    where p.id = auth.uid()
      and p.is_active = true
      and o.status = 'approved'
  );
$$ language sql security definer;
```

---

## Data model summary

All tables use snake_case, UUID PKs, `created_at timestamptz default now()`. Full schema in PRD section 7.

Key tables:
- `submissions` — one row per unique normalised URL (deduped by `url_hash`)
- `reports` — one row per individual public report (many-to-one with submissions)
- `report_tags` / `submission_tags` — tag joins; `submission_tags` maintained by trigger
- `tags` — taxonomy (categories + descriptors), data-driven blocked category routing
- `organisations` / `profiles` — org model, one-to-one with `auth.users`
- `api_keys` — hashed, prefix shown in UI, plaintext displayed exactly once
- `audit_log` — append-only privileged action log
- `blocked_routing_events` — counter only, no payload
- `submission_throttle` — rate limit table (if not using Redis)

---

## Roles

| Role | Who |
|---|---|
| `public` | Anonymous reporter — submit only via Route Handler |
| `org_member` | Approved org staff — read portal |
| `org_admin` | Approved org lead — read portal + API key management |
| `super_admin` | Operator — full access, TOTP MFA required |

---

## Build milestones

M0 Foundation → M1 Schema → **M2 Category routing (before form can write)** → M3 Submission → M4 Auth → M5 Admin → M6 Portal + API → M7 Hardening

Do not start the next milestone until the acceptance criteria pass.

---

## Environment variables

All secrets in environment variables. See `.env.example`. Never commit `.env.local`.

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-side only. CI has a step that greps the client bundle for it and fails the build if found.

---

## URL normalisation

Lives in `src/lib/url.ts`. Deterministic and comprehensively unit-tested. See PRD section 9.2 for the full algorithm.

---

## Security headers (M7)

Strict CSP (no `unsafe-inline`), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

---

## Public API

Base: `https://www.harm.watch/api/v1`
Auth: `Authorization: Bearer hw_live_<random>`
Read-only. Never exposes reporter data. Keyset pagination. 1000 req/hour default per key.
See PRD section 9.7 for full spec.
