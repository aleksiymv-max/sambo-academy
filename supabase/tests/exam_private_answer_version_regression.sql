-- Disposable Supabase test database ONLY. Run foundation + immutability + version guard first.
-- Uses a synthetic auth.users row and rolls back all changes. NEVER run on production.
begin;
do $$
declare
  synthetic_user uuid := gen_random_uuid();
  athlete_version uuid;
  judge_version uuid;
  athlete_attempt uuid;
  rejected boolean := false;
begin
  insert into auth.users(id, instance_id, aud, role, email, encrypted_password)
  values (synthetic_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
          'authenticated', 'exam-integrity-fixture@example.invalid', '');

  insert into exam_private.versions(course_key, version_key)
  values ('athlete','regression-answer-integrity') returning id into athlete_version;
  insert into exam_private.versions(course_key, version_key)
  values ('judge','regression-answer-integrity') returning id into judge_version;
  insert into exam_private.questions(version_id, question_id, correct_option, explanation, source_ref)
  values (athlete_version,'athlete-q',0,'fixture','fixture'),
         (judge_version,'judge-q',0,'fixture','fixture');
  insert into exam_private.attempts(user_id,version_id)
  values (synthetic_user,athlete_version) returning id into athlete_attempt;

  -- Correct question ID within the attempt's version must be accepted.
  insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
  values (athlete_attempt,'athlete-q',0,true);

  -- A valid question from a different course must not be accepted.
  begin
    insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
    values (athlete_attempt,'judge-q',0,true);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: cross-version answer was accepted'; end if;

  rejected := false;
  begin
    insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
    values (athlete_attempt,'nonexistent-q',0,true);
  exception when raise_exception then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: nonexistent question was accepted'; end if;
  if (select count(*) from exam_private.answers where attempt_id=athlete_attempt) <> 1 then
    raise exception 'FAIL: invalid answers persisted';
  end if;
end $$;
rollback;
