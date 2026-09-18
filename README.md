# Harm Watch

A lightweight public reporting service for websites that may breach the **Online Safety Act 2023**.

Anyone can submit a URL in under 30 seconds. Approved organisations — charities, regulators, ISPs, legal teams — get structured read access to the resulting feed via a web portal and a JSON API.

> **This is a reporting and signal service, not a verdict.** Every submission is an allegation only. Nothing in this codebase should imply guilt, confirmation, or removal.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + RLS) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Bot protection | Cloudflare Turnstile |
| Email | Resend |
| Tests | Vitest (unit) · Playwright (E2E) |

---

## Local setup

**Prerequisites:** Node 22, a Supabase project, a Cloudflare Turnstile site key.

```bash
git clone https://github.com/petetrainor80/harm-watch.git
cd harm-watch
npm install
cp .env.example .env.local
# fill in .env.local — see comments in that file
npm run dev
```

The app runs at `http://localhost:3000`.

### Supabase

Apply migrations from `supabase/migrations/` to your local or hosted Supabase project. The schema includes RLS policies, helper functions (`is_super_admin`, `is_approved_org_user`), and triggers for `submission_tags`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E (requires running server) |

All five checks (lint → typecheck → test → build → bundle security scan) must pass in CI before a PR can merge.

---

## Architecture notes

- **Server components by default.** Client components only where interactivity demands it.
- **All mutations go through Route Handlers.** Every privileged write: explicit role check → DB write → `audit_log` entry.
- **RLS on every table.** The service role key is server-side only. CI verifies it never appears in the client bundle.
- **Blocked categories (CSAM, terrorism) never reach the database.** The form redirects client-side; the Route Handler rejects server-side. Both paths are required.
- **No hard deletes.** Submissions have a `status` column; `removed` is not a deletion.
- **Reported URLs are never rendered as live links.** Always defanged (`hxxps://example[.]com`) in admin views.

Full context: [`CLAUDE.md`](CLAUDE.md) · Full PRD: `/Users/pete/Downloads/harm-watch-prd.md`

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Security

See [`SECURITY.md`](SECURITY.md) for the responsible disclosure policy.

---

## Licence

Private repository. All rights reserved.
