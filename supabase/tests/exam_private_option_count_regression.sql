-- Rollback-only regression for staged option-count constraints.
begin;
do $$
declare v uuid := gen_random_uuid();
declare u uuid := gen_random_uuid();
declare a uuid := gen_random_uuid();
declare jv uuid := gen_random_uuid();
declare ja uuid := gen_random_uuid();
declare rejected boolean;
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
  -- The judge course must enforce the same limits as the athlete course.
  insert into exam_private.versions(id,course_key,version_key)
    values(jv,'judge','option-range-judge-fixture');
  insert into exam_private.questions(version_id,question_id,correct_option,option_count,explanation,source_ref)
    values(jv,'judge-20',19,20,'fixture','fixture');
  insert into exam_private.attempts(id,user_id,version_id) values(ja,u,jv);
  insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
    values(ja,'judge-20',19,true);

  rejected := false;
  begin
    insert into exam_private.answers(attempt_id,question_id,selected_option,is_correct)
      values(ja,'judge-20',20,false);
  exception when others then
    if sqlstate = 'P0001' and sqlerrm = 'selected option outside question range'
      then rejected := true;
    else raise;
    end if;
  end;
  if not rejected then raise exception 'FAIL: judge out-of-range answer accepted'; end if;

  rejected := false;
  begin
    insert into exam_private.questions(version_id,question_id,correct_option,option_count,explanation,source_ref)
      values(jv,'too-few',0,1,'fixture','fixture');
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: option_count=1 accepted'; end if;

  rejected := false;
  begin
    insert into exam_private.questions(version_id,question_id,correct_option,option_count,explanation,source_ref)
      values(jv,'too-many',0,21,'fixture','fixture');
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'FAIL: option_count=21 accepted'; end if;
end $;
rollback;
