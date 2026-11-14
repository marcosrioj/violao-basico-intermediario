import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnvironment } from '@/lib/env';
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnvironment();
  return createServerClient(url, key, {
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Components are read-only; proxy refreshes the session. */
        }
      },
    },
  });
}
