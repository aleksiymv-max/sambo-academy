-- Run only on disposable PostgreSQL/Supabase test database after the three staged migrations.
-- Never run against production. All fixtures roll back.
begin;
do $$
declare v uuid; blocked boolean;
begin
  insert into exam_private.versions(course_key,version_key)
  values ('athlete','regression-activation-guard') returning id into v;
  -- Empty versions must never become active.
  blocked := false;
  begin
    update exam_private.versions set activated_at=now() where id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: empty version activated'; end if;
  insert into exam_private.questions(version_id,question_id,correct_option,explanation,source_ref)
  values (v,'regression-q',0,'fixture','fixture');
  update exam_private.versions set activated_at=now() where id=v;
  blocked := false;
  begin
    update exam_private.versions set activated_at=null where id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: activation reset allowed'; end if;
  blocked := false;
  begin
    update exam_private.questions set correct_option=1 where version_id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: activated question changed'; end if;
  blocked := false;
  begin
    update exam_private.versions set version_key='regression-renamed' where id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: version key changed'; end if;
  blocked := false;
  begin
    delete from exam_private.versions where id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: activated version deleted'; end if;
  update exam_private.versions set retired_at=now() where id=v;
  blocked := false;
  begin
    update exam_private.versions set retired_at=null where id=v;
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'FAIL: retirement reset allowed'; end if;
end $$;
rollback;
