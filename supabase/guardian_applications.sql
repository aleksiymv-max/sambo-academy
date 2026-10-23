-- Выполнить в Supabase SQL Editor от администратора проекта.
-- Заявки на регистрацию несовершеннолетних. Решение принимает уполномоченный администратор.
create table if not exists public.guardian_applications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 child_last_name text not null,
 child_first_name text not null,
 child_middle_name text,
 child_birth_date date not null,
 guardian_full_name text not null,
 guardian_relation text not null check (guardian_relation in ('parent','guardian','other')),
 declaration_text text,
 consent_version text,
 consent_at timestamptz,
 submitted_at timestamptz not null default now(),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 reviewed_at timestamptz,
 reviewer_note text,
 constraint valid_child_age check (child_birth_date <= current_date - interval '7 years')
);
alter table public.guardian_applications enable row level security;
revoke all on public.guardian_applications from anon, authenticated;
grant select, insert on public.guardian_applications to authenticated;
drop policy if exists "Guardian reads own application" on public.guardian_applications;
create policy "Guardian reads own application" on public.guardian_applications for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "Guardian creates own application" on public.guardian_applications;
drop policy if exists "Guardian creates own pending application" on public.guardian_applications;
create policy "Guardian creates own pending application" on public.guardian_applications for insert to authenticated with check (user_id=(select auth.uid()) and status='pending' and reviewed_at is null and reviewer_note is null);
-- Не выдаём UPDATE/DELETE пользователям: они не могут одобрить собственную заявку.
-- Администратор проверяет документы вне платформы и меняет статус в SQL Editor
-- (или в будущей защищённой административной панели с серверной авторизацией).
-- Пример только после реальной проверки:
-- update public.guardian_applications set status='approved',reviewed_at=now()
-- where user_id='UUID_ПОЛЬЗОВАТЕЛЯ' and status='pending';
-- ВНИМАНИЕ: решение об одобрении НЕ означает, что согласие юридически оформлено;
-- процедура верификации и юридические документы требуют отдельного утверждения.

-- Upgrade previously created application tables to match the browser form.
alter table public.guardian_applications alter column status set default 'pending';
alter table public.guardian_applications add column if not exists declaration_text text;
alter table public.guardian_applications add column if not exists consent_version text;
alter table public.guardian_applications add column if not exists consent_at timestamptz;
