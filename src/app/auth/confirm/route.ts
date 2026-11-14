import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/validation';
import { isSupabaseConfigured, siteUrl } from '@/lib/env';
import { legacyPkceCallbackUrl } from '@/lib/auth-redirects';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callback = legacyPkceCallbackUrl(url);
  if (callback)
    // Route Handler request.url can contain the internal server host behind a proxy.
    // A relative Location preserves the browser origin and its PKCE verifier cookie.
    return new NextResponse(null, {
      status: 307,
      headers: {
        Location: `${callback.pathname}${callback.search}`,
        'Cache-Control': 'private, no-store',
      },
    });
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (
    tokenHash &&
    (type === 'signup' || type === 'recovery' || type === 'email_change') &&
    isSupabaseConfigured()
  ) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) {
        const next =
          type === 'recovery' ? '/redefinir-senha' : safeRedirect(url.searchParams.get('next'));
        return NextResponse.redirect(new URL(next, siteUrl()), {
          headers: { 'Cache-Control': 'private, no-store' },
        });
      }
    } catch {
      /* Authentication failure is intentionally generic. */
    }
  }
  return NextResponse.redirect(new URL('/entrar?erro=link', siteUrl()), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
