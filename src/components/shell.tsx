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
        <Guitar size={23} />
      </span>
      <span>
        violão<span className="brand-light">vivo</span>
        <small>ESCOLA DE MÚSICA & PROPÓSITO</small>
      </span>
    </Link>
  );
}
export function Shell({
  children,
  active,
  teacher = false,
}: {
  children: ReactNode;
  active?: string;
  teacher?: boolean;
}) {
  return (
    <div className="app-shell">
      <a className="skip" href="#conteudo">
        Pular para conteúdo
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="nav-caption">SEU APRENDIZADO</div>
        <nav aria-label="Principal">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active === href ? 'page' : undefined}
              className={active === href ? 'nav-link active' : 'nav-link'}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
          {teacher && (
            <Link
              className={active === '/professor' ? 'nav-link active' : 'nav-link'}
              href="/professor"
            >
              <GraduationCap size={19} />
              Área do professor
            </Link>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">UM POUCO, TODOS OS DIAS</span>
          <p>A música cresce com você.</p>
          <small>Reserve um momento para ouvir, experimentar e tocar.</small>
          <Link href="/laboratorio">
            Começar a praticar <ArrowUpRight size={15} />
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
              <Guitar size={18} />
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
