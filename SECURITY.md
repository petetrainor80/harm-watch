# Security Policy

## Reporting a vulnerability

If you find a security vulnerability in Harm Watch, **do not open a public GitHub issue**.

Email **pete@harm.watch** with:

- A description of the vulnerability
- Steps to reproduce it
- Your assessment of the impact
- Any suggested mitigation (optional but appreciated)

We will acknowledge your report within 2 working days and aim to resolve critical issues within 7 days. We will keep you updated on progress.

We do not currently run a bug bounty programme, but we will credit researchers in release notes unless they prefer to remain anonymous.

---

## Scope

In scope:
- Authentication and authorisation bypasses
- RLS policy gaps that would allow unauthenticated or under-privileged reads or writes
- Submission flow issues that allow blocked categories (CSAM, terrorism) to reach the database
- API key exposure or privilege escalation
- Data exposure of reporter details or submission content beyond intended access controls
- XSS, CSRF, or injection vulnerabilities in the web application

Out of scope:
- Rate limiting (we have intentional limits — report only if they can be bypassed entirely)
- Clickjacking on pages without sensitive actions
- Self-XSS
- Denial-of-service via large submissions
- Issues in third-party services (Supabase, Vercel, Cloudflare) — report those directly to the vendor

---

## Key security requirements

These are codified in [`CLAUDE.md`](CLAUDE.md) and must be maintained by all contributors:

1. **Blocked categories never reach the database.** `csam` and `terrorism` slugs are intercepted client-side (redirect interstitial) and server-side (422 before any persistence). Only a counter is recorded.

2. **The service role key is server-side only.** `SUPABASE_SERVICE_ROLE_KEY` must never appear in any client bundle. CI enforces this with a grep check on the build output.

3. **RLS on every table.** No anonymous or under-privileged writes reach Postgres directly.

4. **Reported URLs are never rendered as live links.** Defanged form (`hxxps://example[.]com`) in all admin views.

5. **No hard deletes.** Submissions cannot be permanently erased. Status transitions are audited.

6. **Audit log is append-only.** No UPDATE or DELETE policy exists for the `audit_log` table, including for super admins.
