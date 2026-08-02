-- M5 taxonomy: fill OSA Schedule 7 gaps and split merged categories
--
-- Schedule 7 of the Online Safety Act 2023 defines 17 illegal harm categories.
-- This migration brings the tags table into 1:1 alignment with the Act.
--
-- Changes:
--   • Add 6 missing categories: controlling-coercive, extreme-pornography,
--     unlawful-immigration, proceeds-of-crime, foreign-interference, animal-cruelty
--   • Split trafficking-exploitation → trafficking + sexual-exploitation-adults (OSA #8/#9)
--   • Split illegal-goods → drugs-psychoactive + weapons (OSA #13/#14)
--   • Migrate existing report_tags and submission_tags to new split slugs
--   • Deactivate the two merged slugs (kept for FK integrity, excluded from UI)

-- ── 1. New categories ─────────────────────────────────────────────────────────

insert into tags (slug, label, kind, description, is_blocked, redirect_url, redirect_copy, sort_order, is_active) values

  -- OSA #5 — controlling or coercive behaviour (sits between harassment and hate)
  ('controlling-coercive',
   'Controlling or coercive behaviour',
   'category',
   'Sites facilitating controlling or coercive behaviour in intimate or family relationships.',
   false, null, null, 32, true),

  -- OSA #7 — extreme pornography
  ('extreme-pornography',
   'Extreme pornography',
   'category',
   'Pornographic material that is grossly offensive, disgusting or otherwise of an obscene character as defined by the Criminal Justice and Immigration Act 2008.',
   false, null, null, 92, true),

  -- OSA #10 — unlawful immigration
  ('unlawful-immigration',
   'Unlawful immigration and people smuggling',
   'category',
   'Content facilitating unlawful immigration, people smuggling, or associated exploitation offences.',
   false, null, null, 112, true),

  -- OSA #12 — proceeds of crime
  ('proceeds-of-crime',
   'Money laundering and proceeds of crime',
   'category',
   'Sites facilitating money laundering, acquisition or use of criminal proceeds, or related offences.',
   false, null, null, 114, true),

  -- OSA #16 — foreign interference
  ('foreign-interference',
   'Foreign interference',
   'category',
   'Content that constitutes a foreign interference offence under the National Security Act 2023.',
   false, null, null, 132, true),

  -- OSA #17 — animal cruelty
  ('animal-cruelty',
   'Animal cruelty',
   'category',
   'Content depicting, promoting, or facilitating cruelty to animals.',
   false, null, null, 134, true);

-- ── 2. Split: trafficking-exploitation → trafficking + sexual-exploitation-adults ──

insert into tags (slug, label, kind, description, is_blocked, redirect_url, redirect_copy, sort_order, is_active) values

  -- OSA #9 — human trafficking
  ('trafficking',
   'Human trafficking and forced labour',
   'category',
   'Sites facilitating human trafficking, people smuggling for exploitation, forced labour, or modern slavery.',
   false, null, null, 80, true),

  -- OSA #8 — sexual exploitation of adults
  ('sexual-exploitation-adults',
   'Sexual exploitation of adults',
   'category',
   'Sites facilitating the sexual exploitation of adults.',
   false, null, null, 81, true);

-- ── 3. Split: illegal-goods → drugs-psychoactive + weapons ───────────────────

insert into tags (slug, label, kind, description, is_blocked, redirect_url, redirect_copy, sort_order, is_active) values

  -- OSA #13 — drugs and psychoactive substances
  ('drugs-psychoactive',
   'Drugs and psychoactive substances',
   'category',
   'Sites selling or facilitating the supply of controlled drugs or psychoactive substances.',
   false, null, null, 70, true),

  -- OSA #14 — firearms, knives and other weapons
  ('weapons',
   'Firearms, knives and other weapons',
   'category',
   'Sites selling or facilitating the acquisition of firearms, knives, or other prohibited weapons.',
   false, null, null, 71, true);

-- ── 4. Migrate existing report_tags to the new split slugs ───────────────────
-- Any report tagged with a merged category gets both constituent tags added.
-- ON CONFLICT DO NOTHING is safe — idempotent if re-run.

insert into report_tags (report_id, tag_id)
  select rt.report_id, t_new.id
  from   report_tags rt
  join   tags t_old on t_old.id = rt.tag_id and t_old.slug = 'trafficking-exploitation'
  cross join tags t_new
  where  t_new.slug in ('trafficking', 'sexual-exploitation-adults')
on conflict do nothing;

insert into report_tags (report_id, tag_id)
  select rt.report_id, t_new.id
  from   report_tags rt
  join   tags t_old on t_old.id = rt.tag_id and t_old.slug = 'illegal-goods'
  cross join tags t_new
  where  t_new.slug in ('drugs-psychoactive', 'weapons')
on conflict do nothing;

-- ── 5. Migrate existing submission_tags to the new split slugs ────────────────

insert into submission_tags (submission_id, tag_id, report_count)
  select st.submission_id, t_new.id, st.report_count
  from   submission_tags st
  join   tags t_old on t_old.id = st.tag_id and t_old.slug = 'trafficking-exploitation'
  cross join tags t_new
  where  t_new.slug in ('trafficking', 'sexual-exploitation-adults')
on conflict (submission_id, tag_id) do nothing;

insert into submission_tags (submission_id, tag_id, report_count)
  select st.submission_id, t_new.id, st.report_count
  from   submission_tags st
  join   tags t_old on t_old.id = st.tag_id and t_old.slug = 'illegal-goods'
  cross join tags t_new
  where  t_new.slug in ('drugs-psychoactive', 'weapons')
on conflict (submission_id, tag_id) do nothing;

-- ── 6. Deactivate the merged slugs ───────────────────────────────────────────
-- Rows are kept for FK integrity. is_active = false hides them from the UI
-- and API; the reporting form will not offer them to new reporters.

update tags
set    is_active = false
where  slug in ('trafficking-exploitation', 'illegal-goods');
