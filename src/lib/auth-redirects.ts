import { safeRedirect } from './validation';

/** Both default email links and OAuth must exchange the PKCE code before entering the app. */
export function authCallbackUrl(origin: string, next?: string): string {
  const callback = new URL('/auth/callback', origin);
  if (next) callback.searchParams.set('next', safeRedirect(next));
  return callback.toString();
}

/** Compatibility for already-issued links. Keep the exchange on the cookie's original host. */
export function legacyPkceCallbackUrl(requestUrl: URL): URL | null {
  if (!['/', '/auth/confirm', '/redefinir-senha'].includes(requestUrl.pathname)) return null;
  if (requestUrl.searchParams.has('token_hash')) return null;
  const codes = requestUrl.searchParams.getAll('code');
  if (codes.length !== 1 || !codes[0]) return null;

  const next =
    requestUrl.pathname === '/redefinir-senha'
      ? '/redefinir-senha'
      : safeRedirect(requestUrl.searchParams.get('next'));
  const callback = new URL(authCallbackUrl(requestUrl.origin, next));
  callback.searchParams.set('code', codes[0]);
  return callback;
}
