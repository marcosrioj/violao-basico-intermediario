import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { siteUrl } from '@/lib/env';
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = siteUrl();
  if (origin !== allowed)
    throw new AppError(403, 'INVALID_ORIGIN', 'Origem da solicitação inválida.');
}
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  )
    throw new AppError(415, 'JSON_REQUIRED', 'Envie os dados no formato JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, 'INVALID_JSON', 'Envie os dados do formulário.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new AppError(413, 'BODY_TOO_LARGE', 'O conteúdo excede o tamanho permitido.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'Não foi possível ler os dados enviados.');
  }
  return schema.parse(value);
}
