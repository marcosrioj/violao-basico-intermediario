import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authContext, type AuthContext } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { assertSameOrigin } from '@/lib/request';
export { readJson } from '@/lib/request';
export function api(handler: (request: Request, context: AuthContext) => Promise<unknown>) {
  return async (request: Request) => {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    let status = 200;
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) assertSameOrigin(request);
      const context = await authContext();
      const data = await handler(request, context);
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
