import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/validation';
import { isSupabaseConfigured, siteUrl } from '@/lib/env';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(
          new URL(safeRedirect(url.searchParams.get('next')), siteUrl()),
          { headers: { 'Cache-Control': 'private, no-store' } },
        );
    } catch {
      /* Never return credentials or provider errors in a redirect. */
    }
  }
  return NextResponse.redirect(new URL('/entrar?erro=autenticacao', siteUrl()), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
