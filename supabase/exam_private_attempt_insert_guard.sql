-- STAGING ONLY. Apply after exam_private_foundation.sql.
-- Prevent inserting pre-scored attempts, bypassing the UPDATE-only immutability guard.
-- This is a defense-in-depth constraint; trusted server grading is still required.
begin;
create or replace function exam_private.guard_attempt_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.submitted_at is not null or new.score is not null or new.total is not null then
    raise exception 'exam attempts must start unsubmitted and unscored';
  end if;
  return new;
end $$;
drop trigger if exists exam_attempt_insert_guard on exam_private.attempts;
create trigger exam_attempt_insert_guard before insert
on exam_private.attempts for each row
execute function exam_private.guard_attempt_insert();
commit;
