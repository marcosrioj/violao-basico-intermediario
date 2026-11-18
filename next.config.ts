import type { NextConfig } from 'next';
import {
  isSupabaseConfigured,
  supabaseEnvironment,
  validatePublicEnvironment,
} from './src/lib/env';

// NEXT_PUBLIC values are embedded in browser bundles. Reject administrative
// credentials and unsafe auth origins before Next.js can compile those bundles.
validatePublicEnvironment();

const dev = process.env.NODE_ENV !== 'production';
const supabaseOrigin = isSupabaseConfigured() ? supabaseEnvironment().url : 'https://*.supabase.co';
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
          // The lab is also reached by client navigation, which retains the
          // original document policy. Only our own origin may request audio.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${supabaseOrigin}${dev ? ' ws://localhost:* ws://127.0.0.1:*' : ''}; frame-src https://www.youtube-nocookie.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default nextConfig;
