import type { ApiResponse } from '@/lib/contracts';
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiClientError(
      'Resposta indisponível. Tente novamente.',
      response.status,
      'INVALID_RESPONSE',
    );
  }
  if ('error' in body)
    throw new ApiClientError(body.error.message, response.status, body.error.code);
  if (!response.ok)
    throw new ApiClientError(
      'Não foi possível concluir a operação.',
      response.status,
      'HTTP_ERROR',
    );
  return body.data;
}
