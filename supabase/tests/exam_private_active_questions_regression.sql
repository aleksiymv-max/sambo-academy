-- Disposable PostgreSQL/Supabase test database ONLY.
-- Apply foundation, immutability and version_guard migrations first.
-- All fixture changes are rolled back. Never execute on production.
begin;
do $$
declare
  v uuid;
  blocked boolean;
  course text;
begin
  foreach course in array array['athlete','judge'] loop
    insert into exam_private.versions(course_key, version_key)
    values (course, 'regression-activated-question-mutations')
    returning id into v;

    insert into exam_private.questions(version_id,question_id,correct_option,explanation,source_ref,option_count)
    values (v,'first',0,'synthetic explanation','synthetic reference',2);

    -- Before activation, draft questions may be edited.
    update exam_private.questions set explanation='revised fixture'
    where version_id=v and question_id='first';

    update exam_private.versions set activated_at=now() where id=v;

    blocked := false;
    begin
      insert into exam_private.questions(version_id,question_id,correct_option,explanation,source_ref)
      values (v,'late',1,'fixture','fixture');
    exception when raise_exception then blocked := true;
    end;
    if not blocked then raise exception 'FAIL: % activated exam accepted a new question',course; end if;

    blocked := false;
    begin
      delete from exam_private.questions where version_id=v and question_id='first';
    exception when raise_exception then blocked := true;
    end;
    if not blocked then raise exception 'FAIL: % activated exam lost a question',course; end if;

    blocked := false;
    begin
      update exam_private.questions set explanation='tampered'
      where version_id=v and question_id='first';
    exception when raise_exception then blocked := true;
    end;
    if not blocked then raise exception 'FAIL: % activated exam explanation changed',course; end if;

    if (select count(*) from exam_private.questions where version_id=v) <> 1 then
      raise exception 'FAIL: % activated exam question count changed',course;
    end if;
  end loop;
end $$;
rollback;
