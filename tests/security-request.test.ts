import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { assertSameOrigin, readJson } from '../src/lib/request';
import { AppError } from '../src/lib/errors';

test('cookie mutations require the exact configured Origin, not Host or prefix matches', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://curso.example';
  try {
    assert.doesNotThrow(() =>
      assertSameOrigin(
        new Request('https://curso.example/api/progress', {
          method: 'PUT',
          headers: { Origin: 'https://curso.example' },
        }),
      ),
    );
    for (const origin of [
      undefined,
      'null',
      'http://curso.example',
      'https://curso.example.evil.test',
      'https://evil.test',
      'https://curso.example:444',
    ]) {
      const request = new Request('https://curso.example/api/progress', {
        method: 'PUT',
        headers: {
          ...(origin ? { Origin: origin } : {}),
          Host: 'curso.example',
          'X-Forwarded-Host': 'curso.example',
        },
      });
      assert.throws(
        () => assertSameOrigin(request),
        (error: unknown) =>
          error instanceof AppError && error.status === 403 && error.code === 'INVALID_ORIGIN',
      );
    }
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
test('JSON boundary rejects invalid formats, unknown fields, and streamed oversized bodies', async () => {
  const schema = z.object({ notes: z.string() }).strict();
  const request = (body: string, contentType = 'application/json') =>
    new Request('https://curso.example/api/progress', {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType },
    });
  assert.deepEqual(
    await readJson(request('{"notes":"Meu ajuste"}', 'application/json; charset=utf-8'), schema),
    { notes: 'Meu ajuste' },
  );
  await assert.rejects(
    readJson(request('{"notes":"x"}', 'text/plain'), schema),
    (error: unknown) => error instanceof AppError && error.status === 415,
  );
  await assert.rejects(
    readJson(request('{"notes":"x"}', 'application/json-malformed'), schema),
    (error: unknown) => error instanceof AppError && error.status === 415,
  );
  await assert.rejects(
    readJson(request('{broken'), schema),
    (error: unknown) => error instanceof AppError && error.status === 400,
  );
  await assert.rejects(readJson(request('{"notes":"x","role":"teacher"}'), schema), z.ZodError);
  await assert.rejects(
    readJson(request(JSON.stringify({ notes: 'á'.repeat(9000) })), schema),
    (error: unknown) => error instanceof AppError && error.status === 413,
    'limit counts bytes, not characters',
  );
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(9000));
    },
    cancel() {
      cancelled = true;
    },
  });
  const streamed = new Request('https://curso.example/api/progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: stream,
    duplex: 'half',
  } as RequestInit);
  await assert.rejects(
    readJson(streamed, schema),
    (error: unknown) => error instanceof AppError && error.status === 413,
  );
  assert.equal(cancelled, true, 'reader stops receiving data after crossing the byte limit');
});
