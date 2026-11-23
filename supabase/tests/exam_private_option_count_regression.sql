-- Rollback-only regression for staged option-count constraints.
begin;
do $$
declare v uuid := gen_random_uuid();
declare u uuid := gen_random_uuid();
declare a uuid := gen_random_uuid();
begin
  insert into auth.users(id) values(u);
  insert into exam_private.versions(id,course_key,version_key)
    values(v,'athlete','option-range-fixture');
  insert into exam_private.questions(version_id,question_id,correct_option,option_count,explanation,source_ref)
    values(v,'range-1',2,3,'fixture','fixture');
  insert into exam_private.attempts(id,user_id,version_id) values(a,u,v);
  begin
    insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
      values(a,'range-1',3,false);
    raise exception 'out-of-range answer was accepted';
  exception when check_violation then
    raise exception 'unexpected check violation';
  when others then
    if sqlerrm = 'out-of-range answer was accepted' then raise; end if;
  end;
  insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
    values(a,'range-1',2,true);
  begin
    insert into exam_private.questions(version_id,question_id,correct_option,option_count,explanation,source_ref)
      values(v,'invalid',3,3,'fixture','fixture');
    raise exception 'out-of-range correct answer was accepted';
  exception when check_violation then null;
  end;
end $$;
rollback;
