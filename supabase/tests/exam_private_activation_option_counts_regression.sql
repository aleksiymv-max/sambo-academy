-- Disposable PostgreSQL regression: incomplete option metadata cannot be activated.
begin;
do $$
declare v uuid := gen_random_uuid();
begin
  insert into exam_private.versions(id,course_key,version_key)
    values(v,'judge','activation-option-fixture');
  insert into exam_private.questions(version_id,question_id,correct_option,explanation,source_ref)
    values(v,'legacy-question',0,'fixture','fixture');
  begin
    update exam_private.versions set activated_at = now() where id = v;
    raise exception 'activation with NULL option_count was accepted';
  exception when others then
    if sqlerrm = 'activation with NULL option_count was accepted' then raise; end if;
    if sqlerrm not like '%audited option_count%' then raise; end if;
  end;
  update exam_private.questions set option_count=3 where version_id=v;
  update exam_private.versions set activated_at=now() where id=v;
  if not exists(select 1 from exam_private.versions where id=v and activated_at is not null) then
    raise exception 'complete exam failed to activate';
  end if;
end $$;
rollback;
