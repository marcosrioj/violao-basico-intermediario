import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertCourseAccess, evaluateCourseAccess } from '../src/lib/course-access';
import { endpoint } from '../src/lib/endpoint';
import { AppError } from '../src/lib/errors';

test('student access follows persisted enrollment and is revoked after the last membership', async () => {
  let membershipExists = false;
  const readMembership = async () => membershipExists;
  const student = { role: 'student' as const };
  assert.deepEqual(await evaluateCourseAccess(student, readMembership), {
    allowed: false,
    reason: 'enrollment_required',
  });
  membershipExists = true;
  assert.deepEqual(await evaluateCourseAccess(student, readMembership), {
    allowed: true,
    reason: 'enrolled',
  });
  membershipExists = false;
  assert.throws(() => assertCourseAccess({ allowed: false, reason: 'enrollment_required' }), {
    code: 'ENROLLMENT_REQUIRED',
    status: 403,
  });
  assert.equal((await evaluateCourseAccess(student, readMembership)).allowed, false);
});

test('protected teacher role can prepare lessons before creating any classroom', async () => {
  assert.deepEqual(
    await evaluateCourseAccess({ role: 'teacher' }, async () => {
      throw new Error('Teachers do not depend on a student membership lookup');
    }),
    { allowed: true, reason: 'teacher' },
  );
});

test('enrollment errors fail closed and the HTTP boundary never runs a protected operation', async (t) => {
  t.mock.method(console, 'info', () => undefined);
  let operations = 0;
  for (const unavailable of [false, true]) {
    const handler = endpoint(async () => {
      const access = await evaluateCourseAccess({ role: 'student' }, async () => {
        if (unavailable)
          throw new AppError(
            503,
            'DATABASE_UNAVAILABLE',
            'Não foi possível consultar a matrícula.',
          );
        return false;
      });
      assertCourseAccess(access);
      operations++;
      return { privateCourseData: 'never-returned' };
    });
    const response = await handler(new Request('https://course.example/api/progress'));
    assert.equal(response.status, unavailable ? 503 : 403);
    const payload = await response.json();
    assert.equal(payload.error.code, unavailable ? 'DATABASE_UNAVAILABLE' : 'ENROLLMENT_REQUIRED');
    assert.equal(payload.data, undefined);
    assert.equal(typeof payload.error.requestId, 'string');
    assert.match(response.headers.get('cache-control') || '', /private, no-store/);
  }
  assert.equal(operations, 0);
});
