import type { NextConfig } from 'next';
const dev = process.env.NODE_ENV !== 'production';
let supabaseOrigin = 'https://*.supabase.co';
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL)
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
} catch {
  /* The auth environment validates configuration separately. */
}
const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: { '/api/materials/*': ['./materials/*.pdf'] },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${supabaseOrigin}${dev ? ' ws://localhost:* ws://127.0.0.1:*' : ''}; frame-src https://www.youtube-nocookie.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default nextConfig;
