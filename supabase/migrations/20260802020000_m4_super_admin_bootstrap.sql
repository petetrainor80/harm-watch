-- M4: Super admin bootstrap
-- Run this AFTER creating the super admin user in the Supabase Auth dashboard.
--
-- Steps:
-- 1. Go to Supabase dashboard → Authentication → Users → Add user
-- 2. Enter the super admin email and a temporary password (they use magic link, but
--    a password is required to create the account). Mark email as confirmed.
-- 3. Copy the UUID from the user row.
-- 4. Replace the placeholder UUID and email below, then run this migration.
--
-- You MUST run this before the super admin can log in and access /admin.

do $$
declare
  v_user_id uuid;
begin
  -- Look up the super admin user by email.
  -- Replace this email with the actual super admin email.
  select id into v_user_id
  from auth.users
  where email = 'petetrainor80@gmail.com'
  limit 1;

  if v_user_id is null then
    raise exception 'Super admin user not found. Create the user in Supabase Auth first.';
  end if;

  -- Create or update the profile row.
  insert into profiles (id, role, full_name, work_email, is_active)
  values (
    v_user_id,
    'super_admin',
    'Pete Trainor',
    'petetrainor80@gmail.com',
    true
  )
  on conflict (id) do update set
    role = 'super_admin',
    is_active = true;

  raise notice 'Super admin profile created for user %', v_user_id;
end $$;
