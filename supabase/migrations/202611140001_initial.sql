-- Violão Vivo: every browser/database operation runs with the user's JWT.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role text not null default 'student' check (role in ('student', 'teacher')),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 3 and 100),
  created_at timestamptz not null default now()
);
create index classrooms_teacher on public.classrooms(teacher_id);
create table public.classroom_invites (
  class_id uuid primary key references public.classrooms(id) on delete cascade,
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  check (code ~ '^[A-F0-9]{12}$')
);
create table public.memberships (
  class_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);
create index memberships_student on public.memberships(student_id);
create table private.join_attempts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  attempts integer not null default 1
);
create table public.lesson_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m([1-9]|1[0-3])-a[1-3]$'),
  status text not null check (status in ('in_progress','completed')),
  notes text not null default '' check (char_length(notes) <= 2000),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);
create table public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m([1-9]|1[0-3])-a[1-3]$'),
  minutes smallint not null check (minutes between 1 and 240),
  bpm smallint check (bpm between 30 and 240),
  notes text not null default '' check (char_length(notes) <= 2000),
  practiced_at timestamptz not null default now()
);
create index practice_student_date on public.practice_logs(student_id, practiced_at desc);
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  lesson_id text not null check (lesson_id ~ '^m([1-9]|1[0-3])-a[1-3]$'),
  body text not null check (char_length(body) between 3 and 4000),
  validated boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (class_id,student_id) references public.memberships(class_id,student_id) on delete cascade
);
create index feedback_student_date on public.feedback(student_id,created_at desc);
create index feedback_class_date on public.feedback(class_id,created_at desc);
create table public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^m([1-9]|1[0-3])-a[1-3]$'),
  starts_at timestamptz not null,
  title text not null check (char_length(title) between 3 and 140),
  meeting_url text check (meeting_url is null or (char_length(meeting_url) <= 1000 and meeting_url ~ '^https://')),
  created_at timestamptz not null default now()
);
create index sessions_class_date on public.lesson_sessions(class_id,starts_at);

create function private.is_teacher() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'teacher');
$$;
create function private.owns_class(class_uuid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.classrooms where id = class_uuid and teacher_id = (select auth.uid())) and private.is_teacher();
$$;
create function private.is_member(class_uuid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.memberships where class_id = class_uuid and student_id = (select auth.uid()));
$$;
create function private.teaches_student(student_uuid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_teacher() and exists(select 1 from public.memberships m join public.classrooms c on c.id = m.class_id where m.student_id = student_uuid and c.teacher_id = (select auth.uid()));
$$;
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, role) values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Aluno'), 100), 'student');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function private.touch_progress() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger touch_progress before update on public.lesson_progress for each row execute function private.touch_progress();

-- Transactional command: classroom and its invitation are created together.
create function public.create_classroom(class_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare created_id uuid;
begin
  if not private.is_teacher() then raise insufficient_privilege; end if;
  insert into public.classrooms(teacher_id,name) values(auth.uid(),trim(class_name)) returning id into created_id;
  insert into public.classroom_invites(class_id) values(created_id);
  return created_id;
end; $$;
-- Invalid attempts return NULL so the rate limiter commits, rather than rolling back.
create function public.join_classroom(invite_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare found_id uuid; count_attempts integer;
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise insufficient_privilege; end if;
  insert into private.join_attempts(user_id) values(auth.uid())
  on conflict (user_id) do update set attempts=case when private.join_attempts.attempted_at < now()-interval '15 minutes' then 1 else private.join_attempts.attempts+1 end,
    attempted_at=case when private.join_attempts.attempted_at < now()-interval '15 minutes' then now() else private.join_attempts.attempted_at end
  returning attempts into count_attempts;
  if count_attempts > 10 then return null; end if;
  select class_id into found_id from public.classroom_invites where code=upper(trim(invite_code));
  if found_id is null then return null; end if;
  insert into public.memberships(class_id,student_id) values(found_id,auth.uid()) on conflict do nothing;
  return found_id;
end; $$;

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_invites enable row level security;
alter table public.memberships enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.practice_logs enable row level security;
alter table public.feedback enable row level security;
alter table public.lesson_sessions enable row level security;
alter table private.join_attempts enable row level security;

create policy profile_read on public.profiles for select to authenticated using (id=(select auth.uid()) or private.teaches_student(id));
create policy profile_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check(id=(select auth.uid()));
create policy classroom_read on public.classrooms for select to authenticated using (private.owns_class(id) or private.is_member(id));
create policy classroom_update on public.classrooms for update to authenticated using (private.owns_class(id)) with check(private.owns_class(id));
create policy invitation_read on public.classroom_invites for select to authenticated using (private.owns_class(class_id));
create policy membership_read on public.memberships for select to authenticated using(student_id=(select auth.uid()) or private.owns_class(class_id));
create policy membership_delete on public.memberships for delete to authenticated using(student_id=(select auth.uid()) or private.owns_class(class_id));
create policy progress_read on public.lesson_progress for select to authenticated using(student_id=(select auth.uid()) or private.teaches_student(student_id));
create policy progress_insert on public.lesson_progress for insert to authenticated with check(student_id=(select auth.uid()));
create policy progress_update on public.lesson_progress for update to authenticated using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()));
create policy practice_read on public.practice_logs for select to authenticated using(student_id=(select auth.uid()) or private.teaches_student(student_id));
create policy practice_insert on public.practice_logs for insert to authenticated with check(student_id=(select auth.uid()));
create policy feedback_read on public.feedback for select to authenticated using(student_id=(select auth.uid()) or private.owns_class(class_id));
create policy feedback_insert on public.feedback for insert to authenticated with check(teacher_id=(select auth.uid()) and private.owns_class(class_id));
create policy session_read on public.lesson_sessions for select to authenticated using(private.owns_class(class_id) or private.is_member(class_id));
create policy session_insert on public.lesson_sessions for insert to authenticated with check(private.owns_class(class_id));
create policy session_delete on public.lesson_sessions for delete to authenticated using(private.owns_class(class_id));

-- Column grants stop self-promotion and forged author/timestamp updates even via REST.
revoke all on public.profiles, public.classrooms, public.classroom_invites, public.memberships, public.lesson_progress, public.practice_logs, public.feedback, public.lesson_sessions from anon, authenticated;
grant select on public.profiles, public.classrooms, public.classroom_invites, public.memberships, public.lesson_progress, public.practice_logs, public.feedback, public.lesson_sessions to authenticated;
grant update(display_name,timezone) on public.profiles to authenticated;
grant update(name) on public.classrooms to authenticated;
grant delete on public.memberships,public.lesson_sessions to authenticated;
grant insert(student_id,lesson_id,status,notes,confidence) on public.lesson_progress to authenticated;
grant update(student_id,lesson_id,status,notes,confidence) on public.lesson_progress to authenticated;
grant insert(id,student_id,lesson_id,minutes,bpm,notes) on public.practice_logs to authenticated;
grant insert(class_id,student_id,teacher_id,lesson_id,body,validated) on public.feedback to authenticated;
grant insert(class_id,lesson_id,starts_at,title,meeting_url) on public.lesson_sessions to authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.is_teacher(),private.owns_class(uuid),private.is_member(uuid),private.teaches_student(uuid) to authenticated;
revoke all on function public.create_classroom(text), public.join_classroom(text) from public;
grant execute on function public.create_classroom(text), public.join_classroom(text) to authenticated;
