export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === '23505') throw new AppError(409, 'CONFLICT', 'Este registro já existe.');
  if (error.code === '23503' || error.code === '23514' || error.code === '22P02')
    throw new AppError(400, 'INVALID_REFERENCE', 'Confira os dados e os vínculos informados.');
  if (error.code === '42501')
    throw new AppError(403, 'FORBIDDEN', 'Você não tem acesso a esta operação.');
  if (error.code === 'P0001')
    throw new AppError(
      400,
      'INVALID_OPERATION',
      'Código inválido, limite de tentativas atingido ou operação indisponível.',
    );
  throw new AppError(
    503,
    'DATABASE_UNAVAILABLE',
    'Não foi possível salvar ou carregar os dados. Tente novamente.',
  );
}
