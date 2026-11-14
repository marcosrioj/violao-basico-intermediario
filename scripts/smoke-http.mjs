import assert from 'node:assert/strict';

// Starts no server and uses no credentials. Run against an existing local preview.
const base = new URL(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000');
const origin =
  process.env.SMOKE_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (base.hostname === '127.0.0.1'
    ? `${base.protocol}//localhost:${base.port || '3000'}`
    : base.origin);
let checks = 0;
const results = [];
async function request(path, options = {}) {
  return fetch(new URL(path, base), {
    redirect: 'manual',
    credentials: 'omit',
    signal: AbortSignal.timeout(30000),
    ...options,
  });
}
function passed(label) {
  checks++;
  results.push(label);
  console.log(`PASS ${label}`);
}
function privateHeaders(response) {
  assert.match(response.headers.get('cache-control') || '', /no-store/);
}
async function run() {
  for (const path of ['/', '/entrar', '/privacidade']) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path}: status`);
    const body = await response.text();
    assert.match(body, /violão|Violão/i, `${path}: course brand`);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
    if (path === '/') {
      assert.match(body, /Confirme sua matrícula/);
      assert.doesNotMatch(body, /plano-professor|Material completo da aula|private note A/);
      const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      assert.equal(new Set(ids).size, ids.length, 'home: duplicate element IDs');
      for (const [, target] of body.matchAll(/href="#([^"]+)"/g)) {
        assert.ok(ids.includes(target), `home: missing anchor ${target}`);
      }
    }
    if (path === '/entrar') {
      assert.match(body, /Continuar com Google/);
      assert.match(body, /type="password"/);
    }
    passed(`${path} renders public content and security headers`);
  }
  for (const path of [
    '/painel',
    '/professor',
    '/professor/turmas/10000000-0000-4000-8000-000000000001',
    '/curso',
    '/aulas/m1-a1',
    '/materiais',
    '/repertorio',
    '/teoria/R1',
    '/laboratorio',
    '/demonstracao',
    '/demonstracao/teoria/R1',
  ]) {
    const response = await request(path);
    if ([303, 307, 308].includes(response.status))
      assert.equal(new URL(response.headers.get('location'), base).pathname, '/entrar');
    else {
      assert.equal(response.status, 200);
      assert.match(await response.text(), /NEXT_REDIRECT[^<]*entrar|content="[^\"]*url=\/entrar/);
    }
    passed(`${path} denies anonymous access`);
  }
  for (const path of [
    '/api/me',
    '/api/progress',
    '/api/practice',
    '/api/classes',
    '/api/feedback',
    '/api/sessions',
    '/api/materials/aluno',
    '/api/materials/professor',
    '/api/classes/10000000-0000-4000-8000-000000000001/students/20000000-0000-4000-8000-000000000001/practice',
  ]) {
    const response = await request(path);
    assert.ok(
      [401, 503].includes(response.status),
      `${path}: expected unauthenticated or setup status, got ${response.status}`,
    );
    privateHeaders(response);
    const body = await response.json();
    assert.ok(['UNAUTHENTICATED', 'SETUP_REQUIRED'].includes(body.error?.code));
    assert.equal(typeof body.error?.requestId, 'string');
    assert.equal(body.data, undefined);
    passed(`${path} returns no private data without a session`);
  }
  for (const badOrigin of [
    undefined,
    'null',
    'https://untrusted.example',
    `${origin}.untrusted.example`,
  ]) {
    const response = await request('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(badOrigin ? { Origin: badOrigin } : {}) },
      body: '{}',
    });
    assert.equal(response.status, 403);
    privateHeaders(response);
    assert.equal((await response.json()).error.code, 'INVALID_ORIGIN');
    passed(`mutation rejects ${badOrigin || 'missing'} Origin`);
  }
  const sameOrigin = await request('/api/progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: '{}',
  });
  assert.ok(
    [401, 503].includes(sameOrigin.status),
    `same-origin request still requires auth (${sameOrigin.status})`,
  );
  privateHeaders(sameOrigin);
  assert.ok(['UNAUTHENTICATED', 'SETUP_REQUIRED'].includes((await sameOrigin.json()).error.code));
  passed('same-origin mutation still requires an authenticated session');
  // Synthetic codes are only relayed: redirect: 'manual' prevents exchanging them with Auth.
  for (const [path, next] of [
    ['/?code=smoke-fixture-code&next=https://untrusted.example', '/painel'],
    ['/auth/confirm?code=smoke-fixture-code&next=/aulas/m1-a1', '/aulas/m1-a1'],
    ['/redefinir-senha?code=smoke-fixture-code&next=//untrusted.example', '/redefinir-senha'],
  ]) {
    const response = await request(path);
    assert.equal(response.status, 307);
    privateHeaders(response);
    const location = new URL(response.headers.get('location'), base);
    assert.equal(location.origin, base.origin, 'legacy code must stay on its cookie origin');
    assert.equal(location.pathname, '/auth/callback');
    assert.equal(location.searchParams.get('code'), 'smoke-fixture-code');
    assert.equal(location.searchParams.get('next'), next);
    passed(`${path.split('?')[0]} relays legacy PKCE codes on the same origin`);
  }
  for (const [path, code] of [
    ['/auth/callback?next=https://untrusted.example', 'autenticacao'],
    ['/auth/confirm?type=invalid&next=//untrusted.example', 'link'],
  ]) {
    const response = await request(path);
    assert.ok([303, 307, 308].includes(response.status));
    privateHeaders(response);
    const location = new URL(response.headers.get('location'), origin);
    assert.equal(location.origin, new URL(origin).origin);
    assert.equal(location.pathname, '/entrar');
    assert.equal(location.searchParams.get('erro'), code);
    passed(`${path.split('?')[0]} fails safely without external redirects`);
  }
  console.log(
    `\n${checks} HTTP smoke checks passed. No authenticated user or external Supabase service was simulated.`,
  );
}
run().catch((error) => {
  console.error(`FAIL after ${checks} checks: ${error.message}`);
  process.exitCode = 1;
});
