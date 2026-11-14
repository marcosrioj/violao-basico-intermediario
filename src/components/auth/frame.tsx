import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, AudioLines } from 'lucide-react';
import { Brand } from '@/components/shell';
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <a className="skip" href="#autenticacao">
        Pular para formulário
      </a>
      <aside className="auth-visual" aria-label="Violão Vivo">
        <div>
          <Brand />
        </div>
        <div>
          <AudioLines size={38} aria-hidden="true" />
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(32px,4vw,54px)',
              fontWeight: 400,
              marginTop: 24,
            }}
          >
            Um acorde hoje.
            <br />
            Um novo caminho
            <br />
            amanhã.
          </h2>
          <p>O seu lugar para aprender, praticar e acompanhar cada pequena conquista.</p>
          <blockquote>Do primeiro acorde à liberdade de adorar.</blockquote>
        </div>
        <small>13 módulos · 39 encontros · Uma jornada com propósito</small>
      </aside>
      <div className="auth-content">
        <main id="autenticacao" className="auth-card" style={{ padding: 0 }}>
          <Link className="back-link" href="/">
            <ArrowLeft size={15} /> Voltar ao início
          </Link>
          {children}
          <p className="muted" style={{ fontSize: 11, marginTop: 26 }}>
            Seus registros acompanham sua jornada.{' '}
            <Link className="inline-link" href="/privacidade">
              Saiba como cuidamos dos seus dados.
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
