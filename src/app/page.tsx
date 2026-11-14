import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Check,
  Music2,
  BookOpen,
  AudioLines,
  Heart,
  MoveUpRight,
} from 'lucide-react';
import { Shell } from '@/components/shell';
import { courseModules } from '@/content/course';
export default function Home() {
  return (
    <Shell active="/painel">
      <div className="home-heading">
        <div>
          <p className="eyebrow">BEM-VINDO AO VIOLÃO VIVO</p>
          <h1>
            O seu próximo acorde
            <br />
            começa aqui<span className="green">.</span>
          </h1>
          <p className="muted">Um caminho de aprendizado, uma música de cada vez.</p>
        </div>
        <span className="edition-pill">
          <span className="status-dot" /> DO BÁSICO AO INTERMEDIÁRIO
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span /> MÚSICA COM PROPÓSITO
          </span>
          <h2>
            Encontre a sua voz.
            <br />
            <em>Toque a sua fé.</em>
          </h2>
          <p>
            Aprenda violão com músicas que fazem parte da sua vida. Teoria que faz sentido, prática
            que dá vontade de continuar.
          </p>
          <div className="hero-actions">
            <Link className="button cream" href="/entrar">
              Começar minha jornada <ArrowRight size={18} />
            </Link>
            <Link className="hero-demo" href="/demonstracao">
              <Play size={16} /> Conhecer uma aula
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Check size={14} /> No seu ritmo
            </span>
            <span>
              <Check size={14} /> Acompanhamento de professor
            </span>
          </div>
        </div>
        <div className="guitar-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-spark spark-one">✦</div>
          <div className="art-spark spark-two">♪</div>
          <div className="guitar">
            <div className="guitar-head">
              <i />
              <i />
              <i />
            </div>
            <div className="guitar-neck" />
            <div className="guitar-body">
              <div className="guitar-hole" />
              <div className="guitar-bridge" />
            </div>
            <div className="guitar-strings" />
          </div>
          <div className="floating-chord">
            <span>SEU PRIMEIRO ACORDE</span>
            <strong>
              D <small>Ré maior</small>
            </strong>
            <div className="mini-strings">
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="art-caption">CADA NOTA, UM NOVO COMEÇO.</span>
        </div>
      </section>
      <section className="stat-strip" aria-label="O curso">
        <div>
          <BookOpen />
          <strong>
            13 <span>módulos</span>
          </strong>
          <small>Uma trilha com direção</small>
        </div>
        <div>
          <Music2 />
          <strong>
            39 <span>aulas práticas</span>
          </strong>
          <small>Músicas desde o início</small>
        </div>
        <div>
          <AudioLines />
          <strong>
            1h <span>por semana</span>
          </strong>
          <small>Consistência que transforma</small>
        </div>
        <div>
          <Heart />
          <strong>
            Seu <span>próprio ritmo</span>
          </strong>
          <small>Pequenos passos, novas conquistas</small>
        </div>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">PASSO A PASSO, ACORDE A ACORDE</p>
            <h2>Uma jornada feita para você</h2>
          </div>
          <Link className="text-link" href="/curso">
            Explorar a trilha <ArrowRight size={17} />
          </Link>
        </div>
        <div className="module-preview-grid">
          {courseModules.slice(0, 3).map((m, i) => (
            <Link href={i === 0 ? '/demonstracao' : '/curso'} className="preview-card" key={m.n}>
              <div className={`module-cover cover-${i}`}>
                <span>MÓDULO {String(m.n).padStart(2, '0')}</span>
                <div className="cover-symbol">{['♬', '♩', '♫'][i]}</div>
                <span className="cover-arrow">
                  <MoveUpRight size={20} />
                </span>
              </div>
              <div className="preview-body">
                <small>3 AULAS · PRÁTICA + TEORIA</small>
                <h3>{m.title}</h3>
                <p>{m.goal}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="practice-callout">
        <span className="round-icon">
          <AudioLines />
        </span>
        <div>
          <p className="eyebrow">OUÇA. EXPERIMENTE. TOQUE.</p>
          <h2>Seu laboratório está sempre aberto.</h2>
          <p>Metrônomo, acordes com áudio e braço interativo para transformar teoria em som.</p>
        </div>
        <Link className="button secondary" href="/laboratorio">
          Explorar ferramentas <ArrowRight size={17} />
        </Link>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">UM CAMINHO COMPARTILHADO</p>
            <h2>Aprender também é caminhar junto.</h2>
          </div>
        </div>
        <div className="feature-grid">
          <article className="card">
            <span className="number-label">01</span>
            <h3>Entenda com os olhos e os ouvidos</h3>
            <p>
              Diagramas, notas no braço e cifras por compasso aproximam a explicação do instrumento.
            </p>
          </article>
          <article className="card">
            <span className="number-label">02</span>
            <h3>Pratique com intenção</h3>
            <p>
              Escolha um trecho, ajuste o andamento e registre o que melhorou e o seu próximo passo.
            </p>
          </article>
          <article className="card">
            <span className="number-label">03</span>
            <h3>Receba uma direção</h3>
            <p>
              Seu professor acompanha a turma, organiza encontros e comenta suas conquistas e
              desafios.
            </p>
          </article>
        </div>
      </section>
    </Shell>
  );
}
