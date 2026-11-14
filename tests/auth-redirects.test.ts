import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authCallbackUrl, legacyPkceCallbackUrl } from '../src/lib/auth-redirects';

test('new confirmation and recovery links exchange PKCE before entering the app', () => {
  const origin = 'https://course.example';
  assert.equal(authCallbackUrl(origin), `${origin}/auth/callback`);
  const recovery = new URL(authCallbackUrl(origin, '/redefinir-senha'));
  assert.equal(recovery.pathname, '/auth/callback');
  assert.equal(recovery.searchParams.get('next'), '/redefinir-senha');
  assert.equal(
    new URL(authCallbackUrl(origin, 'https://outside.example')).searchParams.get('next'),
    '/painel',
  );
});

test('legacy email codes are relayed on the original origin without unrelated parameters', () => {
  for (const origin of [
    'https://course.example',
    'https://preview.example',
    'http://localhost:3000',
  ]) {
    for (const pathname of ['/', '/auth/confirm']) {
      const incoming = new URL(pathname, origin);
      incoming.searchParams.set('code', 'fixture-pkce-code');
      incoming.searchParams.set('next', '/aulas/m1-a1');
      incoming.searchParams.set('redirect_to', 'https://outside.example');
      incoming.hash = 'unrelated';
      const callback = legacyPkceCallbackUrl(incoming);
      assert.ok(callback);
      assert.equal(callback.origin, origin, 'PKCE verifier cookies are scoped to this origin');
      assert.equal(callback.pathname, '/auth/callback');
      assert.equal(callback.searchParams.get('code'), 'fixture-pkce-code');
      assert.equal(callback.searchParams.get('next'), '/aulas/m1-a1');
      assert.equal(callback.searchParams.has('redirect_to'), false);
      assert.equal(callback.hash, '');
    }
  }
});

test('legacy recovery links keep their destination and unsafe next URLs are rejected', () => {
  const recovery = legacyPkceCallbackUrl(
    new URL(
      'https://course.example/redefinir-senha?code=fixture-code&next=https://outside.example',
    ),
  );
  assert.equal(recovery?.searchParams.get('next'), '/redefinir-senha');
  for (const next of ['https://outside.example', '//outside.example', '/\\outside.example']) {
    const incoming = new URL('https://course.example/?code=fixture-code');
    incoming.searchParams.set('next', next);
    const callback = legacyPkceCallbackUrl(incoming);
    assert.equal(callback?.origin, 'https://course.example');
    assert.equal(callback?.searchParams.get('next'), '/painel');
  }
});

test('ordinary pages, callback requests and OTP links are never relayed again', () => {
  for (const path of [
    '/',
    '/?code=',
    '/?code=one&code=two',
    '/auth/callback?code=fixture-code',
    '/curso?code=fixture-code',
    '/auth/confirm?token_hash=fixture-hash&type=signup',
    '/auth/confirm?token_hash=fixture-hash&type=recovery&code=unrelated',
  ])
    assert.equal(legacyPkceCallbackUrl(new URL(path, 'https://course.example')), null);
});
