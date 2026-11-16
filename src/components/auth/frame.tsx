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
          <h2 className="auth-title">
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
          <p className="auth-privacy muted">
            Seus registros acompanham sua jornada.{' '}
            <Link className="inline-link" href="/privacidade">
              Saiba como cuidamos dos seus dados.
            </Link>{' '}
            <a
              className="inline-link"
              href="https://github.com/marcosrioj/violao-basico-intermediario"
            >
              Repositório no GitHub
            </a>
          </p>
        </main>
      </div>
    </div>
  );
}
