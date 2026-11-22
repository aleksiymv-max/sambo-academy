-- Staged design only. DO NOT run on production until entitlement, RLS and
-- two-account integration tests have been implemented and reviewed.
-- Never add real exam keys to this public repository.
-- Immutable exam-version and attempt storage for BOTH courses.
begin;
create schema if not exists exam_private;
revoke all on schema exam_private from public, anon, authenticated;
create table if not exists exam_private.versions (
  id uuid primary key default gen_random_uuid(),
  course_key text not null check (course_key in ('athlete','judge')),
  version_key text not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz,
  unique(course_key, version_key),
  check (retired_at is null or activated_at is not null)
);
create table if not exists exam_private.questions (
  version_id uuid not null references exam_private.versions(id) on delete restrict,
  question_id text not null,
  correct_option integer not null check(correct_option >= 0),
  explanation text not null,
  source_ref text not null,
  primary key(version_id, question_id)
);
create table if not exists exam_private.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  version_id uuid not null references exam_private.versions(id) on delete restrict,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer,
  total integer,
  check ((submitted_at is null and score is null and total is null)
      or (submitted_at is not null and score between 0 and total and total >= 0))
);
create table if not exists exam_private.answers (
  attempt_id uuid not null references exam_private.attempts(id) on delete restrict,
  question_id text not null,
  selected_option integer not null check(selected_option >= 0),
  is_correct boolean not null,
  primary key(attempt_id,question_id)
);
create index if not exists exam_attempts_user_idx
  on exam_private.attempts(user_id,started_at desc);
-- Explicitly block client access even if future defaults change.
revoke all on all tables in schema exam_private from public, anon, authenticated;
alter table exam_private.versions enable row level security;
alter table exam_private.questions enable row level security;
alter table exam_private.attempts enable row level security;
alter table exam_private.answers enable row level security;
-- No client policies, no public SECURITY DEFINER RPC, no seed keys.
-- Next migration must implement server-only entitlement verification,
-- locked attempt submission, and idempotent grading in one transaction.
-- A server-side service role must never be shipped to a browser.
commit;
