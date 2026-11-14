import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  feedbackInput,
  lessonId,
  practiceInput,
  profileInput,
  progressInput,
  safeRedirect,
  sessionInput,
} from '../src/lib/validation';
test('the 39 lesson identifiers and progress states have bounded valid contracts', () => {
  for (let moduleNumber = 1; moduleNumber <= 13; moduleNumber++)
    for (let lesson = 1; lesson <= 3; lesson++)
      assert.equal(lessonId.parse(`m${moduleNumber}-a${lesson}`), `m${moduleNumber}-a${lesson}`);
  for (const value of ['m0-a1', 'm14-a1', 'm1-a4', 'm01-a1', '../../secret'])
    assert.equal(lessonId.safeParse(value).success, false);
  assert.equal(
    progressInput.safeParse({ lessonId: 'm1-a1', status: 'validated' }).success,
    false,
    'student cannot claim instructor validation',
  );
  assert.equal(
    progressInput.safeParse({ lessonId: 'm1-a1', status: 'completed', studentId: 'forged' })
      .success,
    false,
  );
});
test('redirects cannot leave this origin', () => {
  for (const value of ['//evil.test', 'https://evil.test', '/\\evil.test', '/\nevil.test'])
    assert.equal(safeRedirect(value), '/painel');
  assert.equal(safeRedirect('/aulas/m1-a1?tab=pratica'), '/aulas/m1-a1?tab=pratica');
});
test('forms enforce practice, feedback, URL and profile boundaries', () => {
  assert.equal(practiceInput.safeParse({ lessonId: 'm1-a1', minutes: -1 }).success, false);
  assert.equal(practiceInput.safeParse({ lessonId: 'm1-a1', minutes: 241 }).success, false);
  assert.equal(practiceInput.safeParse({ lessonId: 'm1-a1', minutes: 15, bpm: 60 }).success, true);
  assert.equal(
    profileInput.safeParse({ displayName: 'Ana', timezone: 'Not/AZone' }).success,
    false,
  );
  assert.equal(
    profileInput.safeParse({ displayName: 'Ana', timezone: 'America/Sao_Paulo', role: 'teacher' })
      .success,
    false,
  );
  assert.equal(
    feedbackInput.safeParse({ classId: 'bad', studentId: 'bad', lessonId: 'm1-a1', body: 'ok' })
      .success,
    false,
  );
  assert.equal(
    sessionInput.safeParse({
      classId: '10000000-0000-4000-8000-000000000001',
      lessonId: 'm1-a1',
      startsAt: '2026-11-15T19:00:00-03:00',
      title: 'Aula',
      meetingUrl: 'javascript:alert(1)',
    }).success,
    false,
  );
});
