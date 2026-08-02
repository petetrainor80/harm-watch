-- M3: helper functions for atomic submission upsert and throttle increment

-- Wraps the full report creation in a single transaction:
-- upsert submission → insert report → insert report_tags (triggers submission_tags)
-- → optionally insert tag_suggestion
create or replace function create_report(
  p_url_original      text,
  p_url_normalised    text,
  p_url_hash          text,
  p_domain            text,
  p_category_slugs    text[],
  p_descriptor_slugs  text[],
  p_context           text,
  p_reporter_email    text,
  p_ip_hash           text,
  p_country_code      text,
  p_user_agent_hash   text,
  p_suggested_tag     text
)
returns void
language plpgsql
security definer
as $$
declare
  v_submission_id uuid;
  v_report_id     uuid;
  v_tag_id        uuid;
begin
  -- Upsert submission; on duplicate URL increment count and update timestamp
  insert into submissions
    (url_original, url_normalised, url_hash, domain, status, report_count, first_reported_at, last_reported_at)
  values
    (p_url_original, p_url_normalised, p_url_hash, p_domain, 'live', 1, now(), now())
  on conflict (url_hash)
  do update set
    report_count     = submissions.report_count + 1,
    last_reported_at = now()
  returning id into v_submission_id;

  -- Insert the individual report (metadata only, no URL)
  insert into reports
    (submission_id, context, reporter_email, ip_hash, country_code, user_agent_hash)
  values
    (v_submission_id, p_context, p_reporter_email, p_ip_hash, p_country_code, p_user_agent_hash)
  returning id into v_report_id;

  -- Insert report_tags for all selected categories and descriptors
  -- The trg_maintain_submission_tags trigger keeps submission_tags in sync
  for v_tag_id in
    select id from tags
    where slug = any(p_category_slugs || p_descriptor_slugs)
      and is_active = true
  loop
    insert into report_tags (report_id, tag_id) values (v_report_id, v_tag_id);
  end loop;

  -- Optionally record a tag suggestion
  if p_suggested_tag is not null and length(trim(p_suggested_tag)) > 0 then
    insert into tag_suggestions (report_id, raw_text)
    values (v_report_id, trim(p_suggested_tag));
  end if;
end;
$$;

-- Atomic hourly throttle increment
create or replace function increment_submission_throttle(
  p_ip_hash      text,
  p_window_start timestamptz
)
returns void
language plpgsql
security definer
as $$
begin
  insert into submission_throttle (ip_hash, window_start, count)
  values (p_ip_hash, p_window_start, 1)
  on conflict (ip_hash, window_start)
  do update set count = submission_throttle.count + 1;
end;
$$;
