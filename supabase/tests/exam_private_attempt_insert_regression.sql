-- Disposable test database only. Apply foundation and attempt_insert_guard first.
-- This fixture uses a synthetic auth user and rolls back all changes.
begin;
do $$
declare
  u uuid := gen_random_uuid();
  v uuid;
  rejected boolean := false;
begin
  insert into auth.users(id, instance_id, aud, role, email, encrypted_password)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'attempt-insert-fixture@example.invalid', '');
  insert into exam_private.versions(course_key,version_key)
  values ('athlete','regression-insert-guard') returning id into v;
  begin
    insert into exam_private.attempts(user_id,version_id,submitted_at,score,total)
    values (u,v,now(),1,1);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: pre-scored attempt inserted'; end if;
  if exists(select 1 from exam_private.attempts where user_id=u) then
    raise exception 'FAIL: forged attempt persisted';
  end if;
  insert into exam_private.attempts(user_id,version_id) values(u,v);
  if (select count(*) from exam_private.attempts where user_id=u) <> 1 then
    raise exception 'FAIL: normal draft attempt rejected';
  end if;
end $$;
rollback;
