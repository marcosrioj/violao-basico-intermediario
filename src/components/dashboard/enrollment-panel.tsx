import { CheckCircle2, KeyRound, LockKeyhole, Users } from 'lucide-react';
import type { Profile } from '@/lib/contracts';
import { AccountPanel } from './shared';
import { EnrollmentForm } from './enrollment-form';

export function EnrollmentPanel({ profile }: { profile: Profile }) {
  return (
    <div className="dashboard-surface">
      <AccountPanel profile={profile} />
      <section className="enrollment-panel" aria-labelledby="enrollment-title">
        <div>
          <span className="access-badge">
            <LockKeyhole size={16} aria-hidden="true" /> Aguardando matrícula
          </span>
          <h2 id="enrollment-title">Sua jornada começa com a sua turma.</h2>
          <p>
            Sua conta está pronta. Para abrir as aulas, confirme o código da turma que seu professor
            compartilhou com você.
          </p>
          <ol className="enrollment-steps" aria-label="Etapas para liberar o curso">
            <li>
              <CheckCircle2 size={22} aria-hidden="true" />
              <div>
                <strong>1. Conta criada</strong>
                <p>Você já tem seu espaço no Violão Vivo.</p>
              </div>
            </li>
            <li>
              <Users size={22} aria-hidden="true" />
              <div>
                <strong>2. Convite do professor</strong>
                <p>O professor cria a turma e envia o código diretamente a você.</p>
              </div>
            </li>
            <li aria-current="step">
              <KeyRound size={22} aria-hidden="true" />
              <div>
                <strong>3. Confirme a matrícula</strong>
                <p>Com o código validado, o curso e suas ferramentas são liberados.</p>
              </div>
            </li>
          </ol>
        </div>
        <div className="enrollment-card">
          <span className="enrollment-lock" aria-hidden="true">
            <KeyRound size={28} />
          </span>
          <h3>Já recebeu seu código?</h3>
          <EnrollmentForm />
          <p className="hint">
            Ainda não recebeu? Fale com seu professor pelo canal em que vocês combinaram as aulas.
          </p>
        </div>
      </section>
    </div>
  );
}
