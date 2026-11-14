'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnvironment } from '@/lib/env';
export function createClient() {
  const { url, key } = supabaseEnvironment();
  return createBrowserClient(url, key, {
    cookieOptions: { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
  });
}
