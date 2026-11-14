import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, supabaseEnvironment } from '@/lib/env';
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnvironment();
  const supabase = createServerClient(url, key, {
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  // Refresh only; each page and API checks the authenticated user independently.
  await supabase.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: [
    '/painel/:path*',
    '/professor/:path*',
    '/aulas/:path*',
    '/curso/:path*',
    '/repertorio/:path*',
    '/materiais/:path*',
    '/teoria/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/entrar',
    '/redefinir-senha',
  ],
};
