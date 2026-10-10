-- Run once in Supabase Dashboard > SQL Editor. User progress is private via RLS.
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_key text not null check (course_key in ('athlete','judge')),
  lesson_index integer not null check (lesson_index between 0 and 99),
  completed_at timestamptz not null default now(),
  primary key (user_id, course_key, lesson_index)
);
alter table public.lesson_progress enable row level security;
revoke all on public.lesson_progress from anon;
grant select, insert on public.lesson_progress to authenticated;
drop policy if exists "Read own lesson progress" on public.lesson_progress;
create policy "Read own lesson progress" on public.lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own lesson progress" on public.lesson_progress;
create policy "Insert own lesson progress" on public.lesson_progress for insert to authenticated with check ((select auth.uid()) = user_id);
