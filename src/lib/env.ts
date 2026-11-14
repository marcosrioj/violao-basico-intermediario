export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function secureOrigin(raw: string, errorCode: string): string {
  try {
    const url = new URL(raw);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (
      raw !== raw.trim() ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(errorCode);
    }
    return url.origin;
  } catch {
    // Configuration values may contain credentials; never include them in errors.
    throw new Error(errorCode);
  }
}

function assertPublicSupabaseKey(key: string): void {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return;

  // Older projects can still use an anon JWT. This checks its purpose only;
  // Supabase remains responsible for validating its signature and permissions.
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    try {
      const segment = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload: unknown = JSON.parse(
        atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')),
      );
      if (
        payload !== null &&
        typeof payload === 'object' &&
        'role' in payload &&
        payload.role === 'anon'
      ) {
        return;
      }
    } catch {
      // A malformed JWT is not a publishable key.
    }
  }
  throw new Error('INVALID_SUPABASE_PUBLIC_KEY');
}

export function supabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED');
  assertPublicSupabaseKey(key);
  return { url: secureOrigin(url, 'INVALID_SUPABASE_URL'), key };
}

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) {
    if (process.env.NODE_ENV === 'production' && isSupabaseConfigured()) {
      throw new Error('SITE_URL_REQUIRED');
    }
    return 'http://localhost:3000';
  }
  return secureOrigin(raw, 'INVALID_SITE_URL');
}

export function validatePublicEnvironment(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    supabaseEnvironment();
  }
  siteUrl();
}
