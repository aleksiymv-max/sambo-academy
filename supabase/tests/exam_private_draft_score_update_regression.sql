-- Disposable PostgreSQL/Supabase test database only.
-- Run foundation and immutability migrations first; never run against production.
-- Tests the draft-result invariant on UPDATE, not server grading or RLS.
begin;
do $$
declare
  u uuid := gen_random_uuid();
  v uuid;
  a uuid;
  rejected boolean := false;
begin
  insert into auth.users(id, instance_id, aud, role, email, encrypted_password)
  values (u, '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated',
          'draft-score-fixture@example.invalid', '');
  insert into exam_private.versions(course_key, version_key)
  values ('athlete', 'regression-draft-score-20261122') returning id into v;
  insert into exam_private.attempts(user_id, version_id)
  values (u, v) returning id into a;
  begin
    update exam_private.attempts set score = 1, total = 1 where id = a;
  exception when others then
    rejected := true;
  end;
  if not rejected then
    raise exception 'FAIL: draft attempt accepted precomputed score';
  end if;
  if exists (
    select 1 from exam_private.attempts
    where id = a and (submitted_at is not null or score is not null or total is not null)
  ) then
    raise exception 'FAIL: rejected draft mutation persisted';
  end if;
  update exam_private.attempts set started_at = started_at where id = a;
end $$;
rollback;
