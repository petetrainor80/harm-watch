# Contributing to Harm Watch

This project deals with harmful content reporting. Please read the [security principles](#security-principles) section before writing any code.

---

## Getting started

```bash
git clone https://github.com/petetrainor80/harm-watch.git
cd harm-watch
npm install
cp .env.example .env.local
# Fill in .env.local — every variable is documented in that file
npm run dev
```

See [README.md](README.md) for a full list of scripts and Supabase setup notes.

---

## Branch conventions

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Deps, CI, tooling, refactors |
| `docs/` | Documentation only |

Branch off `main`. Keep branches focused — one logical change per PR.

---

## Commit messages

One-line summary of **what and why**, not how. 50 characters or fewer for the subject.

```
fix: prevent blocked category from reaching DB on server retry

feature: add keyset pagination to v1 submissions endpoint

chore: upgrade Next.js to 16.3.1
```

No ticket numbers in commit messages. Put them in the PR description instead.

---

## Pull requests

1. Open a PR against `main`.
2. Fill in the PR template — every checkbox matters.
3. All CI checks must be green: `lint` → `typecheck` → `test` → `build` → bundle security scan.
4. At least one review from a maintainer before merging.
5. Squash merge preferred for feature/fix branches. Merge commit for long-lived branches.

---

## Code standards

### TypeScript
- Strict mode is on. No `any`, no `@ts-ignore` without an explanation comment.
- Shared validation lives in Zod schemas. Client and server share the same schema file.

### React / Next.js
- **Server components by default.** Add `"use client"` only when you genuinely need browser APIs, event handlers, or React state.
- All data mutations go through **Route Handlers**, never direct client-to-Postgres calls.
- Every Route Handler follows this sequence: auth check → role check → Zod validation → DB write → audit log entry.

### Database
- **RLS on every new table.** No exceptions. Use the existing helper functions: `is_super_admin()` and `is_approved_org_user()`.
- **No hard deletes.** Use a `status` column. `removed` is a valid status; `DELETE` is not.
- Every privileged action must write a row to `audit_log` (append-only; no UPDATE or DELETE policy).
- The `service role key` (`SUPABASE_SERVICE_ROLE_KEY`) is server-side only. CI will fail the build if it appears in the client bundle.

### Styling
- Tailwind CSS v4 utility classes. No inline styles.
- shadcn/ui for components. Match the existing visual language before reaching for a custom component.

### Comments
- Write comments only when the **why** is non-obvious. Do not explain what the code does.
- Leave `// PRD-Q:` comments where a requirement is genuinely ambiguous, with the conservative reading implemented.

---

## Security principles

These come from the [product brief](CLAUDE.md) and are non-negotiable.

### Blocked categories (CSAM, terrorism)
- These **must never reach the database**. The two-layer defence (client redirect + server 422) must remain intact and tested.
- Check `tags.is_blocked` data-driven routing before touching anything in the submission flow.

### Reported URLs
- **Never render a reported URL as a live hyperlink** anywhere in the product.
- Admin views must display defanged form: `hxxps://example[.]com`.
- Provide a copy button; use a click-through confirmation if navigation is ever needed.

### Secrets
- Never commit `.env.local` or any real credentials.
- Never add `SUPABASE_SERVICE_ROLE_KEY` or any secret to client-side code, even temporarily.
- If you accidentally commit a secret, revoke it immediately and tell a maintainer.

### Submissions are allegations only
- Never use "confirmed", "proven", "illegal", or "verified" against any submission record — in the UI, database columns, API responses, or log messages.

---

## Testing

| What | Tool | Required before PR |
|---|---|---|
| Unit tests | `npm run test` | Yes — all must pass |
| Types | `npm run typecheck` | Yes |
| Lint | `npm run lint` | Yes |
| E2E (submission, approval, API) | `npm run test:e2e` | Yes for changes to those three paths |

Write a test for any non-trivial logic change. The three E2E paths (submission flow, admin approval, API read) are the most important — do not break them.

---

## Asking questions

Open a GitHub Discussion rather than an issue for questions or design ideas. Issues are for confirmed bugs and tracked work.
