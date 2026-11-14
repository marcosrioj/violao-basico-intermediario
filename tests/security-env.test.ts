import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  isSupabaseConfigured,
  siteUrl,
  supabaseEnvironment,
  validatePublicEnvironment,
} from '../src/lib/env';

const environmentNames = [
  'NODE_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];
const publicKey = 'sb_publishable_test_public_key';
const configured = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
  NEXT_PUBLIC_SITE_URL: 'https://curso.example',
} as const;

function withEnvironment(values: Record<string, string | undefined>, run: () => void): void {
  const previous = Object.fromEntries(environmentNames.map((name) => [name, process.env[name]]));
  try {
    for (const name of environmentNames) {
      if (values[name] === undefined) delete process.env[name];
      else process.env[name] = values[name];
    }
    run();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

function legacyKey(role: string): string {
  return [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url'),
    'test-signature',
  ].join('.');
}

test('demo mode works without Supabase; partially configured authentication fails closed', () => {
  withEnvironment({ NODE_ENV: 'production' }, () => {
    assert.equal(isSupabaseConfigured(), false);
    assert.doesNotThrow(validatePublicEnvironment);
    assert.throws(supabaseEnvironment, { message: 'SUPABASE_NOT_CONFIGURED' });
  });
  for (const missing of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
    withEnvironment({ ...configured, [missing]: undefined }, () => {
      assert.throws(validatePublicEnvironment, { message: 'SUPABASE_NOT_CONFIGURED' });
    });
  }
});

test('both publishable keys and legacy anon keys remain supported', () => {
  for (const key of [publicKey, legacyKey('anon')]) {
    withEnvironment({ ...configured, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }, () => {
      assert.doesNotThrow(validatePublicEnvironment);
      assert.deepEqual(supabaseEnvironment(), { url: configured.NEXT_PUBLIC_SUPABASE_URL, key });
    });
  }
});

test('administrative and malformed credentials never pass the public configuration boundary', () => {
  for (const key of [
    'sb_secret_private_test_key',
    legacyKey('service_role'),
    legacyKey('authenticated'),
    'not-a-public-key',
    'e30.not-json.signature',
    'sb_publishable_',
  ]) {
    withEnvironment({ ...configured, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }, () => {
      assert.throws(supabaseEnvironment, { message: 'INVALID_SUPABASE_PUBLIC_KEY' });
      assert.throws(validatePublicEnvironment, (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, 'INVALID_SUPABASE_PUBLIC_KEY');
        assert.equal(error.message.includes(key), false);
        return true;
      });
    });
  }
});

test('production authentication requires an explicit callback and CSRF origin', () => {
  withEnvironment({ ...configured, NEXT_PUBLIC_SITE_URL: undefined }, () => {
    assert.throws(siteUrl, { message: 'SITE_URL_REQUIRED' });
    assert.throws(validatePublicEnvironment, { message: 'SITE_URL_REQUIRED' });
  });
  withEnvironment({ ...configured, NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: undefined }, () => {
    assert.equal(siteUrl(), 'http://localhost:3000');
  });
});

test('auth origins require HTTPS, allowing local HTTP for development and local Supabase', () => {
  for (const origin of [
    'https://curso.example',
    'https://curso.example:444/',
    'http://localhost:3000',
    'http://127.0.0.1:54321',
    'http://[::1]:3000',
  ]) {
    withEnvironment(
      { ...configured, NEXT_PUBLIC_SITE_URL: origin, NEXT_PUBLIC_SUPABASE_URL: origin },
      () => {
        assert.doesNotThrow(validatePublicEnvironment);
        assert.equal(siteUrl(), new URL(origin).origin);
        assert.equal(supabaseEnvironment().url, new URL(origin).origin);
      },
    );
  }
});

test('unsafe or ambiguous origins are rejected without exposing configuration values', () => {
  for (const origin of [
    'http://curso.example',
    'http://localhost.evil.example',
    'javascript:alert(1)',
    '/relative',
    'https://name:private-password@curso.example',
    'https://curso.example/auth/callback',
    'https://curso.example?token=private-token',
    'https://curso.example#fragment',
    ' https://curso.example ',
  ]) {
    withEnvironment({ ...configured, NEXT_PUBLIC_SITE_URL: origin }, () => {
      assert.throws(validatePublicEnvironment, { message: 'INVALID_SITE_URL' });
    });
    withEnvironment({ ...configured, NEXT_PUBLIC_SUPABASE_URL: origin }, () => {
      assert.throws(validatePublicEnvironment, { message: 'INVALID_SUPABASE_URL' });
    });
  }
});

test('Next configuration rejects a secret key before browser bundle compilation begins', () => {
  const secret = 'sb_secret_do_not_expose_this_test_value';
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '-e', "import('./next.config.ts')"],
    {
      cwd: process.cwd(),
      env: { ...process.env, ...configured, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret },
      encoding: 'utf8',
      timeout: 15000,
    },
  );
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /INVALID_SUPABASE_PUBLIC_KEY/);
  assert.equal((result.stdout + result.stderr).includes(secret), false);
});
