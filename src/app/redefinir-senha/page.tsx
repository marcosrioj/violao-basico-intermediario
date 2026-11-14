import type { Metadata } from 'next';
import { AuthFrame } from '@/components/auth/frame';
import { ResetPasswordForm } from '@/components/auth/reset-form';
import { isSupabaseConfigured } from '@/lib/env';
export const metadata: Metadata = { title: 'Redefinir senha · Violão Vivo' };
export default function ResetPasswordPage() {
  return (
    <AuthFrame>
      <ResetPasswordForm configured={isSupabaseConfigured()} />
    </AuthFrame>
  );
}
