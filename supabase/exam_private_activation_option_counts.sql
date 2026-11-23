-- STAGING ONLY: enforce complete option metadata for newly activated exam versions.
-- Existing active versions are not modified. Backfill legacy drafts before activation.
begin;
create or replace function exam_private.require_option_counts_on_activation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.activated_at is null and new.activated_at is not null and exists (
    select 1 from exam_private.questions q
    where q.version_id = old.id and q.option_count is null
  ) then
    raise exception 'all exam questions require audited option_count before activation';
  end if;
  return new;
end $$;
drop trigger if exists exam_activation_option_counts on exam_private.versions;
create trigger exam_activation_option_counts before update on exam_private.versions
for each row execute function exam_private.require_option_counts_on_activation();
commit;
