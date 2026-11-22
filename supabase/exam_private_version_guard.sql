-- STAGING ONLY. Apply after exam_private_foundation.sql and exam_private_immutability.sql.
-- Activated versions are permanently identified by their original keys and activation time.
-- Retirement is monotonic. Never reset activated_at to edit an exam in place.
begin;
create or replace function exam_private.guard_version_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.activated_at is not null then
      raise exception 'activated exam versions cannot be deleted';
    end if;
    return old;
  end if;
  if new.id is distinct from old.id
     or new.course_key is distinct from old.course_key
     or new.version_key is distinct from old.version_key
     or new.created_at is distinct from old.created_at then
    raise exception 'exam version identity is immutable';
  end if;
  -- Never activate an empty exam: a version with no questions cannot be graded.
  -- Locking the version row serializes activation with question mutations.
  if old.activated_at is null and new.activated_at is not null
     and not exists (select 1 from exam_private.questions q where q.version_id = old.id) then
    raise exception 'cannot activate exam version without questions';
  end if;
  if old.activated_at is not null
     and new.activated_at is distinct from old.activated_at then
    raise exception 'exam activation cannot be changed or reset';
  end if;
  if old.retired_at is not null
     and new.retired_at is distinct from old.retired_at then
    raise exception 'exam retirement cannot be changed or reset';
  end if;
  if new.activated_at is not null and new.activated_at > statement_timestamp() then
    raise exception 'exam activation cannot be future-dated';
  end if;
  if new.retired_at is not null and
     (new.activated_at is null or new.retired_at < new.activated_at) then
    raise exception 'invalid exam retirement timestamp';
  end if;
  return new;
end $$;
drop trigger if exists exam_version_immutable on exam_private.versions;
create trigger exam_version_immutable before update or delete
on exam_private.versions for each row
execute function exam_private.guard_version_mutation();
-- No new grants, policies, or client access.
commit;
