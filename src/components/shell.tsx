import Link from 'next/link';
import {
  Guitar,
  LayoutDashboard,
  BookOpen,
  AudioLines,
  Music2,
  Library,
  GraduationCap,
  ArrowUpRight,
  LockKeyhole,
} from 'lucide-react';
import type { ReactNode } from 'react';
const links = [
  { href: '/painel', label: 'Meu espaço', icon: LayoutDashboard },
  { href: '/curso', label: 'Trilha de aprendizado', icon: BookOpen },
  { href: '/laboratorio', label: 'Laboratório musical', icon: AudioLines },
  { href: '/repertorio', label: 'Nosso repertório', icon: Music2 },
  { href: '/materiais', label: 'Biblioteca', icon: Library },
];
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Violão Vivo — início">
      <span className="brand-mark">
        <Guitar size={23} aria-hidden="true" />
      </span>
      <span>
        violão<span className="brand-light">vivo</span>
        <small>MÚSICA & PROPÓSITO</small>
      </span>
    </Link>
  );
}
export function Shell({
  children,
  active,
  teacher = false,
  courseAccess = false,
}: {
  children: ReactNode;
  active?: string;
  teacher?: boolean;
  courseAccess?: boolean;
}) {
  const unlocked = teacher || courseAccess;
  return (
    <div className="app-shell">
      <a className="skip" href="#conteudo">
        Pular para conteúdo
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="nav-caption">SEU APRENDIZADO</div>
        <nav aria-label="Principal">
          {links.map(({ href, label, icon: Icon }) => {
            const locked = !unlocked && href !== '/painel';
            return (
              <Link
                key={href}
                href={locked ? '/painel' : href}
                aria-current={active === href ? 'page' : undefined}
                aria-describedby={locked ? 'course-access-hint' : undefined}
                className={`nav-link${active === href ? ' active' : ''}${locked ? ' locked' : ''}`}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
                {locked && <LockKeyhole size={14} aria-hidden="true" />}
              </Link>
            );
          })}
          {teacher && (
            <Link
              className={active === '/professor' ? 'nav-link active' : 'nav-link'}
              href="/professor"
              aria-current={active === '/professor' ? 'page' : undefined}
            >
              <GraduationCap size={19} aria-hidden="true" />
              Área do professor
            </Link>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">
            {unlocked ? 'UM POUCO, TODOS OS DIAS' : 'SEU PRÓXIMO PASSO'}
          </span>
          <p>{unlocked ? 'A música cresce com você.' : 'Uma turma. Um novo começo.'}</p>
          <small id="course-access-hint">
            {unlocked
              ? 'Reserve um momento para ouvir, experimentar e tocar.'
              : 'O curso é liberado após confirmar o código enviado pelo professor.'}
          </small>
          <Link href={unlocked ? '/laboratorio' : '/painel'}>
            {unlocked ? 'Começar a praticar' : 'Confirmar matrícula'}{' '}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Do básico ao intermediário
          <small>13 módulos · 39 encontros</small>
          <Link href="/privacidade">Privacidade</Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <span>Do primeiro acorde à liberdade de adorar.</span>
          <Link className="account-link" href="/painel">
            <span className="avatar">
              <Guitar size={18} aria-hidden="true" />
            </span>
            Minha conta
          </Link>
        </header>
        <main id="conteudo">{children}</main>
        <footer className="app-footer">
          <span>Violão Vivo · Música que faz parte da vida.</span>
          <Link href="/privacidade">Privacidade e dados</Link>
        </footer>
      </div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
