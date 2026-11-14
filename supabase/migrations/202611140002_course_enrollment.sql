-- Enrollment is required in the application and in direct PostgREST operations.
-- Existing memberships remain valid. Removing a membership preserves personal
-- progress and practice records, but the last removal revokes student access.
create function private.has_course_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_teacher() or exists (
    select 1 from public.memberships
    where student_id = (select auth.uid())
  );
$$;
revoke all on function private.has_course_access() from public, anon;
grant execute on function private.has_course_access() to authenticated;

alter policy progress_read on public.lesson_progress
  using (
    (student_id = (select auth.uid()) and (select private.has_course_access()))
    or private.teaches_student(student_id)
  );
alter policy progress_insert on public.lesson_progress
  with check (student_id = (select auth.uid()) and (select private.has_course_access()));
alter policy progress_update on public.lesson_progress
  using (student_id = (select auth.uid()) and (select private.has_course_access()))
  with check (student_id = (select auth.uid()) and (select private.has_course_access()));

alter policy practice_read on public.practice_logs
  using (
    (student_id = (select auth.uid()) and (select private.has_course_access()))
    or private.teaches_student(student_id)
  );
alter policy practice_insert on public.practice_logs
  with check (student_id = (select auth.uid()) and (select private.has_course_access()));
