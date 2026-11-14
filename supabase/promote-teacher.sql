-- Run in the Supabase SQL Editor as project owner, AFTER this user has signed in.
-- Replace the fictitious email with the teacher's verified account.
-- Never expose this operation in public signup, API keys, or user metadata.
update public.profiles
set role = 'teacher'
where id = (select id from auth.users where email = 'professor@example.com' and email_confirmed_at is not null)
returning id, display_name, role;
