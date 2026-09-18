## What does this PR do?

<!-- One paragraph. What changed and why. Link to a GitHub Issue if there is one. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / chore
- [ ] Documentation

## How was this tested?

<!-- Describe what you tested and how. For UI changes, include a screenshot. -->

---

## Security checklist

_All boxes must be checked or explicitly marked N/A._

- [ ] No secrets, API keys, or `.env` values committed
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not referenced in any client-side file
- [ ] Reported URLs are not rendered as live hyperlinks anywhere (defanged in admin views)
- [ ] No submission or tag is described as "confirmed", "proven", or "illegal"
- [ ] Any new table has RLS policies (check with `is_super_admin()` / `is_approved_org_user()`)
- [ ] Any privileged mutation writes to `audit_log`
- [ ] Blocked category routing (CSAM / terrorism) is untouched or tested if modified

## CI checklist

_All must be green before merging._

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Build succeeds with no bundle-security warnings
