import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL engine (WASM), with only Supabase's auth.uid() boundary emulated.
// This validates actual grants, policies, triggers and transactions, not string patterns.
test('PostgreSQL RLS isolates students and classrooms and prevents privilege escalation', async () => {
  const db = new PGlite();
  const teacherA = '10000000-0000-4000-8000-000000000001';
  const teacherB = '10000000-0000-4000-8000-000000000002';
  const studentA = '20000000-0000-4000-8000-000000000001';
  const studentB = '20000000-0000-4000-8000-000000000002';
  const studentC = '20000000-0000-4000-8000-000000000003';
  const login = async (id: string) => {
    await db.exec(
      `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
    );
  };
  const count = async (table: string) =>
    Number((await db.query<{ n: string }>(`select count(*) as n from ${table}`)).rows[0].n);
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'::jsonb,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(
      await readFile(
        new URL('../supabase/migrations/202611140001_initial.sql', import.meta.url),
        'utf8',
      ),
    );
    await db.query(
      `insert into auth.users(id,raw_user_meta_data) values ($1,'{"display_name":"Teacher A"}'),($2,'{"display_name":"Teacher B"}'),($3,'{"display_name":"Student A","role":"teacher"}'),($4,'{"display_name":"Student B"}'),($5,'{"display_name":"Student C"}')`,
      [teacherA, teacherB, studentA, studentB, studentC],
    );
    await db.query(`update public.profiles set role='teacher' where id in ($1,$2)`, [
      teacherA,
      teacherB,
    ]);
    await login(studentA);
    assert.equal(
      (await db.query<{ role: string }>(`select role from profiles where id=$1`, [studentA]))
        .rows[0].role,
      'student',
      'signup metadata cannot select teacher',
    );
    await assert.rejects(
      db.query(`update profiles set role='teacher' where id=$1`, [studentA]),
      /permission denied/,
    );
    assert.equal(await count('profiles'), 1, 'student cannot enumerate profiles');
    await assert.rejects(
      db.query(`select public.create_classroom('Forged class')`),
      /insufficient_privilege|permission denied/i,
    );
    await login(teacherA);
    const classA = (
      await db.query<{ id: string }>(`select public.create_classroom('Turma A') as id`)
    ).rows[0].id;
    const codeA = (
      await db.query<{ code: string }>(`select code from classroom_invites where class_id=$1`, [
        classA,
      ])
    ).rows[0].code;
    await login(teacherB);
    const classB = (
      await db.query<{ id: string }>(`select public.create_classroom('Turma B') as id`)
    ).rows[0].id;
    const codeB = (
      await db.query<{ code: string }>(`select code from classroom_invites where class_id=$1`, [
        classB,
      ])
    ).rows[0].code;
    assert.equal(await count('classrooms'), 1, 'teacher sees own classes');
    await login(studentA);
    await assert.rejects(
      db.query(`insert into memberships(class_id,student_id) values($1,$2)`, [classA, studentA]),
      /permission denied/,
    );
    assert.equal(
      (await db.query<{ id: string }>(`select join_classroom($1) as id`, [codeA])).rows[0].id,
      classA,
    );
    await db.query(`select join_classroom($1)`, [codeA]);
    assert.equal(await count('memberships'), 1, 'join is idempotent');
    assert.equal(await count('classroom_invites'), 0, 'student cannot enumerate invitation codes');
    await db.query(
      `insert into lesson_progress(student_id,lesson_id,status,notes,confidence) values($1,'m1-a1','completed','private note A',4) on conflict(student_id,lesson_id) do update set student_id=excluded.student_id,lesson_id=excluded.lesson_id,status=excluded.status,notes=excluded.notes,confidence=excluded.confidence`,
      [studentA],
    );
    await db.query(
      `insert into lesson_progress(student_id,lesson_id,status,notes,confidence) values($1,'m1-a1','in_progress','updated private note A',3) on conflict(student_id,lesson_id) do update set student_id=excluded.student_id,lesson_id=excluded.lesson_id,status=excluded.status,notes=excluded.notes,confidence=excluded.confidence`,
      [studentA],
    );
    await db.query(
      `insert into practice_logs(student_id,lesson_id,minutes,notes) values($1,'m1-a1',15,'practice A')`,
      [studentA],
    );
    await assert.rejects(
      db.query(
        `insert into lesson_progress(student_id,lesson_id,status) values($1,'m1-a1','completed')`,
        [studentB],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query(
        `insert into lesson_progress(student_id,lesson_id,status) values($1,'m14-a1','completed')`,
        [studentA],
      ),
      /check constraint/,
    );
    await login(studentB);
    await db.query(`select join_classroom($1)`, [codeB]);
    assert.equal(await count('lesson_progress'), 0, 'student B cannot read student A progress');
    assert.equal(await count('practice_logs'), 0, 'student B cannot read student A journal');
    await db.query(`update lesson_progress set notes='tampered' where student_id=$1`, [studentA]);
    await db.query(
      `insert into lesson_progress(student_id,lesson_id,status,notes) values($1,'m1-a2','completed','private note B')`,
      [studentB],
    );
    await login(teacherB);
    assert.equal(await count('lesson_progress'), 1, 'teacher B sees only own student');
    assert.equal(await count('practice_logs'), 0, 'teacher B cannot read other classroom journal');
    await assert.rejects(
      db.query(
        `insert into feedback(class_id,student_id,teacher_id,lesson_id,body,validated) values($1,$2,$3,'m1-a1','Forged approval',true)`,
        [classA, studentA, teacherB],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query(
        `insert into feedback(class_id,student_id,teacher_id,lesson_id,body,validated) values($1,$2,$3,'m1-a1','Cross class student',true)`,
        [classB, studentA, teacherB],
      ),
      /foreign key constraint/,
    );
    await login(teacherA);
    const progressA = await db.query<{ notes: string }>(`select notes from lesson_progress`);
    assert.equal(progressA.rows.length, 1);
    assert.equal(
      progressA.rows[0].notes,
      'updated private note A',
      'unauthorized update did not mutate data',
    );
    assert.equal(await count('profiles'), 2, 'teacher sees own and assigned student profiles');
    assert.equal(
      await count('practice_logs'),
      1,
      'teacher can read assigned student practice journal',
    );
    await db.query(`update lesson_progress set notes='teacher forged note' where student_id=$1`, [
      studentA,
    ]);
    assert.equal(
      (
        await db.query<{ notes: string }>(`select notes from lesson_progress where student_id=$1`, [
          studentA,
        ])
      ).rows[0].notes,
      'updated private note A',
      'teacher cannot edit student study notes',
    );
    await db.query(`update profiles set display_name='forged name' where id=$1`, [studentA]);
    assert.equal(
      (
        await db.query<{ display_name: string }>(`select display_name from profiles where id=$1`, [
          studentA,
        ])
      ).rows[0].display_name,
      'Student A',
      'teacher cannot modify student profile',
    );
    await assert.rejects(
      db.query(`insert into practice_logs(student_id,lesson_id,minutes) values($1,'m1-a1',60)`, [
        studentA,
      ]),
      /row-level security/,
      'teacher cannot fabricate student practice',
    );
    await assert.rejects(
      db.query(`update profiles set role='student' where id=$1`, [teacherA]),
      /permission denied/,
      'teacher cannot assign account roles',
    );
    await assert.rejects(
      db.query(`update classrooms set teacher_id=$1 where id=$2`, [teacherB, classA]),
      /permission denied/,
      'class ownership cannot be rewritten by a teacher',
    );
    await assert.rejects(
      db.query(
        `insert into feedback(class_id,student_id,teacher_id,lesson_id,body,validated) values($1,$2,$3,'m1-a1','Forged author',true)`,
        [classA, studentA, teacherB],
      ),
      /row-level security/,
      'teacher cannot impersonate feedback author',
    );
    await db.query(
      `insert into feedback(class_id,student_id,teacher_id,lesson_id,body,validated) values($1,$2,$3,'m1-a1','Troca validada em aula',true)`,
      [classA, studentA, teacherA],
    );
    await db.query(
      `insert into lesson_sessions(class_id,lesson_id,starts_at,title) values($1,'m1-a1',now()+interval '1 day','Próximo encontro')`,
      [classA],
    );
    await login(studentB);
    assert.equal(await count('feedback'), 0, 'other student cannot read feedback');
    assert.equal(await count('lesson_sessions'), 0, 'other student cannot read meetings');
    await login(studentA);
    assert.equal(await count('feedback'), 1);
    assert.equal(await count('lesson_sessions'), 1);
    await db.query(`delete from lesson_sessions where class_id=$1`, [classA]);
    assert.equal(await count('lesson_sessions'), 1, 'student cannot cancel teacher meetings');
    await assert.rejects(
      db.query(`update lesson_progress set student_id=$1 where student_id=$2`, [
        studentB,
        studentA,
      ]),
      /row-level security/,
      'student cannot transfer private progress to another owner',
    );
    await assert.rejects(
      db.query(
        `update lesson_progress set updated_at=now()+interval '1 year' where student_id=$1`,
        [studentA],
      ),
      /permission denied/,
      'student cannot forge server timestamps',
    );
    await assert.rejects(
      db.query(`select * from private.join_attempts`),
      /permission denied/,
      'rate limiter is not readable',
    );
    await assert.rejects(
      db.query(
        `insert into feedback(class_id,student_id,teacher_id,lesson_id,body,validated) values($1,$2,$2,'m1-a1','Self approval',true)`,
        [classA, studentA],
      ),
      /row-level security/,
    );
    await login(studentC);
    for (let i = 0; i < 10; i++)
      assert.equal(
        (await db.query<{ id: string | null }>(`select join_classroom('000000000000') as id`))
          .rows[0].id,
        null,
      );
    assert.equal(
      (await db.query<{ id: string | null }>(`select join_classroom($1) as id`, [codeA])).rows[0]
        .id,
      null,
      'failed attempts are persisted and rate-limited',
    );
    await login(teacherA);
    await db.query(`delete from memberships where class_id=$1 and student_id=$2`, [
      classA,
      studentA,
    ]);
    assert.equal(
      await count('lesson_progress'),
      0,
      'teacher loses student data after membership removal',
    );
    assert.equal(
      await count('practice_logs'),
      0,
      'teacher loses journal access after membership removal',
    );
    await db.exec(
      `reset role; set role anon; select set_config('request.jwt.claim.sub','',false);`,
    );
    await assert.rejects(db.query('select * from lesson_progress'), /permission denied/);
    await assert.rejects(db.query(`select join_classroom($1)`, [codeA]), /permission denied/);
  } finally {
    await db.close();
  }
});
