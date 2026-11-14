import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { assertSameOrigin } from '@/lib/request';

// Response and request boundary only. Protected application operations use api(),
// which adds authenticated profile authorization before calling their handlers.
export function endpoint(handler: (request: Request) => Promise<unknown>) {
  return async (request: Request) => {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    let status = 200;
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) assertSameOrigin(request);
      const data = await handler(request);
      return NextResponse.json(
        { data },
        { headers: { 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId } },
      );
    } catch (error) {
      const known =
        error instanceof AppError
          ? error
          : error instanceof z.ZodError
            ? new AppError(
                400,
                'VALIDATION_ERROR',
                error.issues[0]?.message || 'Revise os dados informados.',
              )
            : new AppError(500, 'INTERNAL_ERROR', 'Algo deu errado. Tente novamente.');
      status = known.status;
      return NextResponse.json(
        { error: { code: known.code, message: known.message, requestId } },
        { status, headers: { 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId } },
      );
    } finally {
      console.info(
        JSON.stringify({
          event: 'api_request',
          requestId,
          path: new URL(request.url).pathname,
          method: request.method,
          status,
          durationMs: Date.now() - started,
        }),
      );
    }
  };
}
