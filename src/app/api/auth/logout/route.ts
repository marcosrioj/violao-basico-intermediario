import { api } from '@/lib/http';
import { AppError } from '@/lib/errors';
export const POST = api(async (_request, { supabase }) => {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new AppError(503, 'SIGNOUT_FAILED', 'Não foi possível sair. Tente novamente.');
  return { signedOut: true };
});
