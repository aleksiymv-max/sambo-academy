-- STAGING ONLY. Apply after the existing four exam_private migrations.
-- NULL preserves legacy draft rows until their option counts are audited.
-- No published question keys, answers or attempt history are rewritten.
begin;
alter table exam_private.questions
  add column if not exists option_count integer;
alter table exam_private.questions
  drop constraint if exists exam_question_option_count_valid;
alter table exam_private.questions
  add constraint exam_question_option_count_valid
  check (option_count is null or option_count between 2 and 20);
alter table exam_private.questions
  drop constraint if exists exam_question_correct_option_in_range;
alter table exam_private.questions
  add constraint exam_question_correct_option_in_range
  check (option_count is null or correct_option < option_count);

-- Enforce the selected answer range when a question's option count is known.
-- Existing question-version membership and immutability guards remain in place.
create or replace function exam_private.guard_answer_option_range()
returns trigger language plpgsql set search_path = '' as $$
declare v_version uuid;
declare v_count integer;
begin
  select a.version_id into v_version
    from exam_private.attempts a where a.id = new.attempt_id;
  if not found then raise exception 'exam attempt missing'; end if;
  select q.option_count into v_count
    from exam_private.questions q
    where q.version_id = v_version and q.question_id = new.question_id;
  if not found then raise exception 'question outside exam version'; end if;
  if v_count is not null and new.selected_option >= v_count then
    raise exception 'selected option outside question range';
  end if;
  return new;
end $$;
drop trigger if exists exam_answer_option_range on exam_private.answers;
create trigger exam_answer_option_range before insert on exam_private.answers
for each row execute function exam_private.guard_answer_option_range();
commit;
