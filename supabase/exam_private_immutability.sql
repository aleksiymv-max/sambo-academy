-- STAGING ONLY: apply after exam_private_foundation.sql, never directly in production.
-- Preserve submitted scores, answer rows, and active exam keys.
-- Does not replace server-side authorization, grading or two-user RLS tests.
begin;

create or replace function exam_private.reject_submitted_attempt_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.submitted_at is not null then
      raise exception 'submitted exam attempts are immutable';
    end if;
    return old;
  end if;
  if old.submitted_at is not null then
    raise exception 'submitted exam attempts are immutable';
  end if;
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.version_id is distinct from old.version_id
     or new.started_at is distinct from old.started_at then
    raise exception 'attempt identity cannot change';
  end if;
  -- A submission is only valid if score/total/submitted_at are set together.
  if new.submitted_at is not null and
     (new.score is null or new.total is null) then
    raise exception 'incomplete exam submission';
  end if;
  return new;
end $$;

drop trigger if exists exam_attempt_immutable on exam_private.attempts;
create trigger exam_attempt_immutable before update or delete
on exam_private.attempts for each row
execute function exam_private.reject_submitted_attempt_mutation();

create or replace function exam_private.guard_answer_mutation()
returns trigger language plpgsql set search_path = '' as $$
declare target_attempt uuid;
declare submission_time timestamptz;
declare attempt_version uuid;
begin
  target_attempt := case when tg_op = 'DELETE' then old.attempt_id else new.attempt_id end;
  select a.submitted_at, a.version_id into submission_time, attempt_version
  from exam_private.attempts a where a.id = target_attempt for update;
  if not found then raise exception 'exam attempt missing'; end if;
  if submission_time is not null then
    raise exception 'submitted exam answers are immutable';
  end if;
  if tg_op = 'UPDATE' then
    raise exception 'answer updates are prohibited; use server-controlled submission';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  -- Reject answers for arbitrary question IDs, even from a different exam version.
  -- Lock the attempt first so concurrent submission cannot bypass this check.
  if not exists (
    select 1 from exam_private.questions q
    where q.version_id = attempt_version and q.question_id = new.question_id
  ) then
    raise exception 'answer question does not belong to attempt exam version';
  end if;
  return new;
end $$;

drop trigger if exists exam_answer_immutable on exam_private.answers;
create trigger exam_answer_immutable before insert or update or delete
on exam_private.answers for each row
execute function exam_private.guard_answer_mutation();

create or replace function exam_private.guard_question_mutation()
returns trigger language plpgsql set search_path = '' as $$
declare exam_version uuid;
declare active_at timestamptz;
begin
  exam_version := case when tg_op = 'DELETE' then old.version_id else new.version_id end;
  select v.activated_at into active_at
  from exam_private.versions v where v.id = exam_version for update;
  if not found then raise exception 'exam version missing'; end if;
  if active_at is not null then
    raise exception 'activated exam questions are immutable; create a new version';
  end if;
  if tg_op = 'UPDATE' and new.version_id is distinct from old.version_id then
    raise exception 'moving questions between versions is prohibited';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists exam_question_version_guard on exam_private.questions;
create trigger exam_question_version_guard before insert or update or delete
on exam_private.questions for each row
execute function exam_private.guard_question_mutation();

-- SQL delimiter fix: every PL/pgSQL body must end with the opening $ tag.
-- No client grants or policies are added by this migration.
commit;
