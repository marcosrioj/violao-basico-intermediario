import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('course RLS requires teacher-created enrollment and revokes access without deleting history', async () => {
  const db = new PGlite();
  const teacher = '10000000-0000-4000-8000-000000000001';
  const student = '20000000-0000-4000-8000-000000000001';
  const otherStudent = '20000000-0000-4000-8000-000000000002';
  const login = async (id: string) => {
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  };
  const allowed = async () =>
    (await db.query<{ allowed: boolean }>('select private.has_course_access() as allowed')).rows[0]
      .allowed;
  const count = async (table: 'lesson_progress' | 'practice_logs') =>
    Number(
      (await db.query<{ total: string }>(`select count(*) as total from public.${table}`)).rows[0]
        .total,
    );
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
      $$;
      grant usage on schema auth,public to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
    `);
    const migrations = new URL('../supabase/migrations/', import.meta.url);
    for (const migration of (await readdir(migrations))
      .filter((name) => name.endsWith('.sql'))
      .sort())
      await db.exec(await readFile(new URL(migration, migrations), 'utf8'));
    await db.query('insert into auth.users(id) values ($1),($2),($3)', [
      teacher,
      student,
      otherStudent,
    ]);
    await db.query("update public.profiles set role='teacher' where id=$1", [teacher]);

    await login(student);
    assert.equal(await allowed(), false, 'signup alone does not unlock course access');
    await assert.rejects(
      db.query("select public.create_classroom('Student forged classroom')"),
      /permission denied|insufficient_privilege/i,
    );
    await assert.rejects(
      db.query(
        "insert into public.lesson_progress(student_id,lesson_id,status) values ($1,'m1-a1','completed')",
        [student],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query(
        "insert into public.practice_logs(student_id,lesson_id,minutes) values ($1,'m1-a1',15)",
        [student],
      ),
      /row-level security/,
    );
    await login(teacher);
    assert.equal(await allowed(), true, 'teacher can prepare course without a classroom');
    const classA = (
      await db.query<{ id: string }>("select public.create_classroom('Turma semanal A') as id")
    ).rows[0].id;
    const classB = (
      await db.query<{ id: string }>("select public.create_classroom('Turma semanal B') as id")
    ).rows[0].id;
    const invites = (
      await db.query<{ class_id: string; code: string }>(
        'select class_id,code from public.classroom_invites',
      )
    ).rows;
    const codeA = invites.find((invite) => invite.class_id === classA)!.code;
    const codeB = invites.find((invite) => invite.class_id === classB)!.code;
    await login(student);
    assert.equal(
      await allowed(),
      false,
      'teacher creating a class does not automatically enroll students',
    );
    assert.equal(
      (await db.query<{ id: string | null }>("select public.join_classroom('000000000000') as id"))
        .rows[0].id,
      null,
    );
    assert.equal(await allowed(), false, 'invalid invitation cannot unlock the course');
    await assert.rejects(
      db.query('insert into public.memberships(class_id,student_id) values ($1,$2)', [
        classA,
        student,
      ]),
      /permission denied/,
    );
    assert.equal(
      (await db.query<{ id: string }>('select public.join_classroom($1) as id', [codeA])).rows[0]
        .id,
      classA,
    );
    assert.equal(await allowed(), true, 'confirming the teacher code unlocks the course');
    await db.query(
      "insert into public.lesson_progress(student_id,lesson_id,status) values ($1,'m1-a1','completed')",
      [student],
    );
    await db.query(
      "insert into public.practice_logs(student_id,lesson_id,minutes) values ($1,'m1-a1',15)",
      [student],
    );
    assert.equal(await count('lesson_progress'), 1);
    await login(otherStudent);
    assert.equal(await allowed(), false, 'another student does not inherit enrollment');
    assert.equal(await count('lesson_progress'), 0);
    assert.equal(await count('practice_logs'), 0);
    await login(student);
    await db.query('select public.join_classroom($1)', [codeB]);
    await db.query('delete from public.memberships where class_id=$1 and student_id=$2', [
      classA,
      student,
    ]);
    assert.equal(await allowed(), true, 'one remaining membership still authorizes the course');
    await login(teacher);
    await db.query('delete from public.memberships where class_id=$1 and student_id=$2', [
      classB,
      student,
    ]);
    await login(student);
    assert.equal(await allowed(), false, 'removal of final membership revokes access immediately');
    assert.equal(await count('lesson_progress'), 0);
    assert.equal(await count('practice_logs'), 0);
    const updated = await db.query(
      "update public.lesson_progress set notes='forged after removal' where student_id=$1 returning student_id",
      [student],
    );
    assert.equal(updated.rows.length, 0, 'former students cannot update prior progress');
    await assert.rejects(
      db.query(
        "insert into public.practice_logs(student_id,lesson_id,minutes) values ($1,'m1-a2',15)",
        [student],
      ),
      /row-level security/,
    );
    await db.exec('reset role');
    assert.equal(
      await count('lesson_progress'),
      1,
      'revocation preserves progress for later enrollment',
    );
    assert.equal(await count('practice_logs'), 1, 'revocation preserves the practice journal');
    await login(student);
    await db.query('select public.join_classroom($1)', [codeA]);
    assert.equal(await allowed(), true);
    assert.equal(await count('lesson_progress'), 1, 'a confirmed new enrollment restores history');
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select private.has_course_access()'), /permission denied/);
  } finally {
    await db.close();
  }
});
