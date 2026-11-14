export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function supabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED');
  return { url, key };
}
export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('INVALID_SITE_URL');
  return url.origin;
}
