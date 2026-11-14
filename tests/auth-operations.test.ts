import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  logoutCurrentSession,
  revokeAllSessions,
  updatePasswordAndRevokeSessions,
} from '../src/lib/auth-operations';
import { endpoint } from '../src/lib/endpoint';
import { AppError } from '../src/lib/errors';

test('logout ends only the caller session without accessing a profile or another user', async () => {
  const scopes: string[] = [];
  const auth = {
    async signOut({ scope }: { scope: 'local' | 'global' }) {
      scopes.push(scope);
      return { error: null };
    },
    async getUser() {
      throw new Error('Auth lookup is unavailable');
    },
  };
  assert.deepEqual(await logoutCurrentSession(auth), { signedOut: true });
  assert.deepEqual(scopes, ['local']);
});

test('logout preserves the error contract when revocation returns or throws an error', async () => {
  for (const throws of [false, true]) {
    await assert.rejects(
      logoutCurrentSession({
        async signOut() {
          if (throws) throw new Error('private-provider-detail');
          return { error: new Error('private-provider-detail') };
        },
      }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'SIGNOUT_FAILED');
        assert.equal(error.status, 503);
        assert.equal(error.message.includes('private-provider-detail'), false);
        return true;
      },
    );
  }
});

test('logout request boundary rejects foreign origins before touching a session', async (t) => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://curso.example';
  t.mock.method(console, 'info', () => undefined);
  let calls = 0;
  const handler = endpoint(async () =>
    logoutCurrentSession({
      async signOut() {
        calls++;
        return { error: null };
      },
    }),
  );
  try {
    const rejected = await handler(
      new Request('https://curso.example/api/auth/logout', {
        method: 'POST',
        headers: { Origin: 'https://curso.example.evil.test' },
      }),
    );
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).error.code, 'INVALID_ORIGIN');
    assert.equal(calls, 0);

    const accepted = await handler(
      new Request('https://curso.example/api/auth/logout', {
        method: 'POST',
        headers: { Origin: 'https://curso.example' },
      }),
    );
    assert.equal(accepted.status, 200);
    assert.deepEqual(await accepted.json(), { data: { signedOut: true } });
    assert.equal(calls, 1);
    for (const response of [rejected, accepted]) {
      assert.match(response.headers.get('cache-control') || '', /private, no-store/);
      assert.ok(response.headers.get('x-request-id'));
    }
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test('a successful password change with failed revocation retries only the revocation', async () => {
  let updates = 0;
  let revocations = 0;
  const auth = {
    async updateUser({ password }: { password: string }) {
      updates++;
      assert.equal(password, 'a-test-password');
      return { error: null };
    },
    async signOut({ scope }: { scope: 'local' | 'global' }) {
      assert.equal(scope, 'global');
      revocations++;
      return { error: revocations === 1 ? new Error('provider unavailable') : null };
    },
  };
  assert.equal(
    await updatePasswordAndRevokeSessions(auth, 'a-test-password'),
    'revocation-pending',
  );
  assert.equal(updates, 1);
  assert.equal(await revokeAllSessions(auth), 'done');
  assert.equal(updates, 1, 'retry must never update the password a second time');
  assert.equal(revocations, 2);
});

test('a thrown revocation error still records that the password has already changed', async () => {
  let updated = false;
  assert.equal(
    await updatePasswordAndRevokeSessions(
      {
        async updateUser() {
          updated = true;
          return { error: null };
        },
        async signOut() {
          throw new Error('network unavailable');
        },
      },
      'a-test-password',
    ),
    'revocation-pending',
  );
  assert.equal(updated, true);
});

test('password update failures do not pretend success or revoke the recovery session', async () => {
  const updateError = new Error('expired recovery');
  let revocations = 0;
  await assert.rejects(
    updatePasswordAndRevokeSessions(
      {
        async updateUser() {
          return { error: updateError };
        },
        async signOut() {
          revocations++;
          return { error: null };
        },
      },
      'a-test-password',
    ),
    updateError,
  );
  assert.equal(revocations, 0);
});
