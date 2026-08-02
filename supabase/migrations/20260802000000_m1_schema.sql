-- M1: Schema, triggers, helper functions, RLS policies, and taxonomy seed
-- All tables: snake_case, UUID PKs, created_at timestamptz default now()
-- PRD section 7

-- ============================================================
-- ENUMS
-- ============================================================

create type submission_status as enum (
  'pending_review',
  'live',
  'removed',
  'rejected',
  'duplicate'
);

create type organisation_type as enum (
  'charity',
  'government',
  'isp',
  'legal',
  'other'
);

create type organisation_status as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type user_role as enum (
  'super_admin',
  'org_admin',
  'org_member'
);

create type tag_kind as enum (
  'category',
  'descriptor'
);

create type suggestion_status as enum (
  'pending',
  'approved',
  'rejected'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Contact details (contact_name, contact_email, contact_job_title) are held on
-- this row until approval, at which point a profiles row is created. Retained
-- for audit purposes after approval.
create table organisations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  type                organisation_type,
  website             text not null,
  registration_number text,
  status              organisation_status not null default 'pending',
  justification       text not null,
  api_enabled         boolean not null default false,
  approved_by         uuid references auth.users(id),
  approved_at         timestamptz,
  rejection_reason    text,
  contact_name        text not null,
  contact_email       text not null,
  contact_job_title   text,
  created_at          timestamptz not null default now()
);

-- One-to-one with auth.users. organisation_id is null for super_admin.
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id),
  role            user_role not null,
  full_name       text not null,
  work_email      text not null,
  job_title       text,
  is_active       boolean not null default true,
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- is_blocked and redirect_* make blocked category routing data-driven.
-- See PRD section 5.
create table tags (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  label         text not null,
  kind          tag_kind not null,
  description   text,
  parent_id     uuid references tags(id),
  is_blocked    boolean not null default false,
  redirect_url  text,
  redirect_copy text,
  sort_order    int not null default 0,
  is_active     boolean not null default true
);

-- One row per unique normalised URL. New submissions default to 'live' per the
-- brief (PRD-Q: open question 1 — organisations see unreviewed allegations).
create table submissions (
  id                uuid primary key default gen_random_uuid(),
  url_original      text not null,
  url_normalised    text not null,
  url_hash          text not null unique,
  domain            text not null,
  status            submission_status not null default 'live',
  report_count      integer not null default 1,
  first_reported_at timestamptz not null default now(),
  last_reported_at  timestamptz not null default now(),
  status_changed_at timestamptz,
  status_changed_by uuid references auth.users(id),
  status_note       text,
  admin_notes       text,
  created_at        timestamptz not null default now()
);

-- One row per individual public report. Many-to-one with submissions.
-- Sensitive columns (reporter_email, ip_hash, user_agent_hash) are never
-- exposed through the API or org portal — enforced at the application layer.
create table reports (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references submissions(id),
  context         text check (char_length(context) <= 500),
  reporter_email  text,
  ip_hash         text,
  country_code    text,
  user_agent_hash text,
  created_at      timestamptz not null default now()
);

create table report_tags (
  report_id uuid not null references reports(id),
  tag_id    uuid not null references tags(id),
  primary key (report_id, tag_id)
);

-- Maintained by trigger on report_tags insert. report_count accumulates the
-- weight of a tag across all corroborating reports for a submission.
create table submission_tags (
  submission_id uuid not null references submissions(id),
  tag_id        uuid not null references tags(id),
  report_count  int not null default 1,
  primary key (submission_id, tag_id)
);

create table tag_suggestions (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid not null references reports(id),
  raw_text         text not null check (char_length(raw_text) <= 40),
  status           suggestion_status not null default 'pending',
  resolved_tag_id  uuid references tags(id),
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- Plaintext key displayed once at creation, never stored or recoverable.
-- key_hash is SHA-256 of the full key, computed in the application layer.
create table api_keys (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations(id),
  label               text not null,
  key_prefix          text not null,
  key_hash            text not null,
  scopes              text[] not null default '{submissions:read}',
  rate_limit_per_hour int not null default 1000,
  created_by          uuid not null references auth.users(id),
  last_used_at        timestamptz,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now()
);

-- Append-only. No UPDATE or DELETE policies exist for any role.
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id),
  actor_role  user_role,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

-- Counter only. No URL, no IP, no payload ever. See PRD section 5.
create table blocked_routing_events (
  id         uuid primary key default gen_random_uuid(),
  tag_slug   text not null,
  created_at timestamptz not null default now()
);

-- Rate limiting fallback if Upstash Redis is unavailable. Cleaned up nightly.
create table submission_throttle (
  ip_hash      text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (ip_hash, window_start)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on submissions (domain);
create index on submissions (status);
create index on submissions (last_reported_at desc);
create index on submissions (status, last_reported_at desc);

create index on reports (submission_id);

create index on submission_tags (tag_id);
create index on submission_tags (submission_id, tag_id);

create index on report_tags (tag_id);

create index on organisations (status);

create index on profiles (organisation_id);
create index on profiles (role) where is_active = true;

create index on api_keys (organisation_id);
create index on api_keys (key_prefix) where revoked_at is null;

create index on audit_log (entity_type, entity_id);
create index on audit_log (actor_id);
create index on audit_log (created_at desc);

create index on blocked_routing_events (tag_slug);

create index on submission_throttle (ip_hash, window_start);

-- ============================================================
-- TRIGGER: maintain submission_tags from report_tags inserts
-- ============================================================

create or replace function maintain_submission_tags()
returns trigger
language plpgsql
security definer
as $$
declare
  v_submission_id uuid;
begin
  select submission_id into v_submission_id
  from reports
  where id = new.report_id;

  insert into submission_tags (submission_id, tag_id, report_count)
  values (v_submission_id, new.tag_id, 1)
  on conflict (submission_id, tag_id)
  do update set report_count = submission_tags.report_count + 1;

  return new;
end;
$$;

create trigger trg_maintain_submission_tags
after insert on report_tags
for each row execute function maintain_submission_tags();

-- ============================================================
-- TRIGGER: enforce append-only audit_log
-- ============================================================

create or replace function prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only and cannot be modified or deleted';
end;
$$;

create trigger trg_audit_log_immutable
before update or delete on audit_log
for each row execute function prevent_audit_log_mutation();

-- ============================================================
-- TRIGGER: prevent deactivating the last active super_admin
-- ============================================================

create or replace function check_super_admin_count()
returns trigger
language plpgsql
as $$
begin
  if old.role = 'super_admin' and new.is_active = false then
    if (
      select count(*) from profiles
      where role = 'super_admin' and is_active = true and id != old.id
    ) = 0 then
      raise exception 'Cannot deactivate the last active super_admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_super_admin_count
before update on profiles
for each row execute function check_super_admin_count();

-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'super_admin'
      and is_active = true
  );
$$;

create or replace function is_approved_org_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles p
    join organisations o on o.id = p.organisation_id
    where p.id = auth.uid()
      and p.is_active = true
      and o.status = 'approved'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organisations          enable row level security;
alter table profiles               enable row level security;
alter table submissions            enable row level security;
alter table reports                enable row level security;
alter table report_tags            enable row level security;
alter table submission_tags        enable row level security;
alter table tags                   enable row level security;
alter table tag_suggestions        enable row level security;
alter table api_keys               enable row level security;
alter table audit_log              enable row level security;
alter table blocked_routing_events enable row level security;
alter table submission_throttle    enable row level security;

-- ── organisations ─────────────────────────────────────────────

create policy "super_admin: all"
  on organisations for all
  using (is_super_admin())
  with check (is_super_admin());

-- Approved org members see their own organisation only
create policy "org_user: read own organisation"
  on organisations for select
  using (
    id = (select organisation_id from profiles where id = auth.uid())
    and is_approved_org_user()
  );

-- ── profiles ──────────────────────────────────────────────────

create policy "super_admin: all"
  on profiles for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "user: read own profile"
  on profiles for select
  using (id = auth.uid());

-- ── submissions ───────────────────────────────────────────────

create policy "super_admin: all"
  on submissions for all
  using (is_super_admin())
  with check (is_super_admin());

-- PRD-Q: open question 1 — new submissions are live immediately, so
-- unreviewed allegations are visible to approved orgs. Intentional per brief.
create policy "org_user: read non-rejected submissions"
  on submissions for select
  using (
    is_approved_org_user()
    and status != 'rejected'
  );

-- ── reports ───────────────────────────────────────────────────
-- Super admin only. No org user ever reads this table.

create policy "super_admin: all"
  on reports for all
  using (is_super_admin())
  with check (is_super_admin());

-- ── report_tags ───────────────────────────────────────────────

create policy "super_admin: all"
  on report_tags for all
  using (is_super_admin())
  with check (is_super_admin());

-- ── submission_tags ───────────────────────────────────────────

create policy "super_admin: all"
  on submission_tags for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "org_user: read submission_tags for non-rejected submissions"
  on submission_tags for select
  using (
    is_approved_org_user()
    and exists (
      select 1 from submissions s
      where s.id = submission_id
        and s.status != 'rejected'
    )
  );

-- ── tags ──────────────────────────────────────────────────────
-- Anon needs read access for the public submission form.

create policy "super_admin: all"
  on tags for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "public: read active tags"
  on tags for select
  using (is_active = true);

-- ── tag_suggestions ───────────────────────────────────────────

create policy "super_admin: all"
  on tag_suggestions for all
  using (is_super_admin())
  with check (is_super_admin());

-- ── api_keys ──────────────────────────────────────────────────

create policy "super_admin: all"
  on api_keys for all
  using (is_super_admin())
  with check (is_super_admin());

-- org_admin can view their own organisation's keys
create policy "org_admin: read own org keys"
  on api_keys for select
  using (
    is_approved_org_user()
    and (select role from profiles where id = auth.uid()) = 'org_admin'
    and organisation_id = (select organisation_id from profiles where id = auth.uid())
  );

-- ── audit_log ─────────────────────────────────────────────────
-- Append-only enforced by trigger. No UPDATE or DELETE policies exist.
-- INSERT is via service role in Route Handlers (bypasses RLS).

create policy "super_admin: read"
  on audit_log for select
  using (is_super_admin());

-- ── blocked_routing_events ────────────────────────────────────

create policy "super_admin: read"
  on blocked_routing_events for select
  using (is_super_admin());

-- ── submission_throttle ───────────────────────────────────────
-- No authenticated user reads this. Service role only via Route Handlers.
-- (Intentionally no SELECT policy.)

-- ============================================================
-- TAXONOMY SEED
-- PRD section 8
-- ============================================================

insert into tags
  (slug, label, kind, description, is_blocked, redirect_url, redirect_copy, sort_order, is_active)
values
  -- Blocked — routed away client-side AND server-side, never stored as submissions
  ('csam', 'Child sexual abuse material', 'category',
   'Images or videos showing the sexual abuse of a child.',
   true,
   'https://www.iwf.org.uk/report/',
   'Please report this directly to the Internet Watch Foundation (IWF) at iwf.org.uk/report. If you are concerned about a child in immediate danger, contact CEOP at ceop.police.uk.',
   1, true),

  ('terrorism', 'Terrorist content or material', 'category',
   'Content that promotes, glorifies, or facilitates terrorism.',
   true,
   'https://www.gov.uk/report-terrorism',
   'Please report this directly to the government reporting route at gov.uk/report-terrorism.',
   2, true),

  -- Accepted categories
  ('fraud', 'Fraud, scams and financial crime', 'category',
   'Websites facilitating fraud, investment scams, phishing, or other financial crime.',
   false, null, null, 10, true),

  ('intimate-image-abuse', 'Non-consensual intimate images', 'category',
   'Sites hosting or distributing intimate images shared without consent.',
   false, null, null, 20, true),

  ('harassment', 'Harassment, stalking, threats or coercion', 'category',
   'Sites facilitating targeted harassment, stalking, threats, or coercive behaviour.',
   false, null, null, 30, true),

  ('hate', 'Hate speech targeting a protected characteristic', 'category',
   'Content targeting individuals or groups on the basis of protected characteristics.',
   false, null, null, 40, true),

  ('suicide-self-harm', 'Encouraging or assisting suicide or self-harm', 'category',
   'Content that encourages, promotes, or provides methods for suicide or self-harm.',
   false, null, null, 50, true),

  ('eating-disorder', 'Content promoting eating disorders', 'category',
   'Content that promotes or glorifies disordered eating behaviours.',
   false, null, null, 60, true),

  ('illegal-goods', 'Drugs, weapons or other controlled goods', 'category',
   'Sites selling or facilitating the sale of controlled drugs, weapons, or other illegal goods.',
   false, null, null, 70, true),

  ('trafficking-exploitation', 'Human trafficking or sexual exploitation', 'category',
   'Sites facilitating human trafficking, forced labour, or sexual exploitation.',
   false, null, null, 80, true),

  ('extreme-violence', 'Extreme or gratuitous violence', 'category',
   'Content depicting extreme or gratuitous violence.',
   false, null, null, 90, true),

  ('adult-no-age-check', 'Pornography without age assurance', 'category',
   'Pornography accessible without adequate age assurance measures.',
   false, null, null, 100, true),

  ('child-inappropriate', 'Content harmful to children', 'category',
   'Content harmful or inappropriate for children, not covered by other categories.',
   false, null, null, 110, true),

  ('impersonation', 'Impersonation of a person, brand or public body', 'category',
   'Sites impersonating a real person, company, brand, or public institution.',
   false, null, null, 120, true),

  ('disinformation', 'Coordinated or harmful false information', 'category',
   'Sites engaged in coordinated or harmful disinformation campaigns.',
   false, null, null, 130, true),

  ('other', 'Other harm', 'category',
   'Other harmful content not covered by the above categories. Please describe in the context field.',
   false, null, null, 140, true),

  -- Descriptors
  ('targets-children',       'Targets children',              'descriptor', null, false, null, null, 200, true),
  ('uk-audience',            'UK audience',                   'descriptor', null, false, null, null, 210, true),
  ('paid-advertising',       'Via paid advertising',          'descriptor', null, false, null, null, 220, true),
  ('app-store-listed',       'Listed in an app store',        'descriptor', null, false, null, null, 230, true),
  ('search-result',          'Appearing in search results',   'descriptor', null, false, null, null, 240, true),
  ('social-platform-hosted', 'Hosted on a social platform',   'descriptor', null, false, null, null, 250, true),
  ('repeat-offender-domain', 'Repeat offender domain',        'descriptor', null, false, null, null, 260, true),
  ('age-check-absent',       'No age check present',          'descriptor', null, false, null, null, 270, true),
  ('contact-details-hidden', 'Contact details hidden',        'descriptor', null, false, null, null, 280, true);
