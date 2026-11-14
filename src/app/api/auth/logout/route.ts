import { endpoint } from '@/lib/endpoint';
import { logoutCurrentSession } from '@/lib/auth-operations';
import { isSupabaseConfigured } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export const POST = endpoint(async () => {
  if (!isSupabaseConfigured())
    throw new AppError(503, 'SETUP_REQUIRED', 'A autenticação ainda precisa ser configurada.');
  // The SSR client operates only on the caller's cookie session. Signing out
  // must also work when that user's application profile is unavailable.
  const supabase = await createClient();
  return logoutCurrentSession(supabase.auth);
});
