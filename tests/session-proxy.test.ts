import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { config, proxy } from '../src/proxy';

test('session refresh covers every public entry page as well as protected routes, excluding assets', () => {
  for (const url of [
    '/',
    '/laboratorio',
    '/privacidade',
    '/entrar',
    '/painel',
    '/curso',
    '/aulas/m1-a1',
    '/professor',
    '/api/me',
  ]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), true, url);
  }
  for (const url of ['/_next/static/chunk.js', '/favicon.ico', '/images/guitar.svg']) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), false, url);
  }
});

test('an expired session is renewed before the initial public page renders and persisted for the next tab', async (t) => {
  const environment = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_public_key',
  };
  const previous = Object.fromEntries(
    Object.keys(environment).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, environment);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: '20000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'fixture@example.org',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  };
  const token = (exp: number) =>
    [
      { alg: 'HS256', typ: 'JWT' },
      { sub: user.id, aud: 'authenticated', role: 'authenticated', iat: now - 7200, exp },
    ]
      .map((part) => Buffer.from(JSON.stringify(part)).toString('base64url'))
      .join('.') + '.fixture-signature';
  const session = (exp: number) => ({
    access_token: token(exp),
    refresh_token: 'fixture-refresh',
    expires_at: exp,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  });
  const refreshed = session(now + 3600);
  let refreshes = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    assert.equal(url.origin, environment.NEXT_PUBLIC_SUPABASE_URL);
    if (url.pathname === '/auth/v1/token') {
      assert.equal(url.searchParams.get('grant_type'), 'refresh_token');
      refreshes++;
      return Response.json(refreshed);
    }
    assert.equal(url.pathname, '/auth/v1/user');
    return Response.json(user);
  });
  for (const path of ['/', '/laboratorio', '/privacidade']) {
    const cookie =
      'base64-' + Buffer.from(JSON.stringify(session(now - 3600))).toString('base64url');
    const request = new NextRequest(`https://curso.example${path}`, {
      headers: { Cookie: `sb-project-auth-token=${cookie}` },
    });
    const response = await proxy(request);
    const updated = response.cookies.get('sb-project-auth-token');
    assert.ok(updated, `${path}: the browser must receive the renewed cookie`);
    assert.equal(
      request.cookies.get('sb-project-auth-token')?.value,
      updated.value,
      'the first render must receive the same renewed session',
    );
    const stored = JSON.parse(
      Buffer.from(updated.value.slice('base64-'.length), 'base64url').toString(),
    );
    assert.equal(stored.access_token, refreshed.access_token);
    assert.match(response.headers.get('cache-control') || '', /private, no-store/);
  }
  assert.equal(refreshes, 3);
});
