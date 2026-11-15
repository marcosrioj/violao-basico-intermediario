import { CollapsibleCard } from '@/components/ui/collapsible-card';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, BookOpen, Music2 } from 'lucide-react';
import { Shell } from '@/components/shell';
import { lessons, getChart, getSong } from '@/content/course';
import { defaultPlaybackBpm, formatBpm } from '@/content/tempo';
import type { Lesson } from '@/content/types';
import { ChordDiagram } from '@/components/music/chord-diagram';
import { ChartPlayer } from '@/components/music/chart-player';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { Quiz } from './quiz';
import { LessonProgress, PracticeLog } from './lesson-progress';
import { VideoResource } from './video-resource';
import type { ReactNode } from 'react';
import { Hint } from '@/components/ui/hint';
import { getLessonEnrichment, getLessonStudies } from '@/content/curriculum';
import { LessonDeepening } from './learning-content';
export function LessonView({
  lesson,
  demo = false,
  teacher = false,
  teacherPlan,
}: {
  lesson: Lesson;
  demo?: boolean;
  teacher?: boolean;
  teacherPlan?: ReactNode;
}) {
  const song = getSong(lesson);
  const chart = getChart(lesson);
  const defaultBpm = defaultPlaybackBpm(lesson.bpm, song.tempo);
  const enrichment = getLessonEnrichment(lesson.id);
  const prev = lessons[lesson.n - 2];
  const next = lessons[lesson.n];
  const rich = (text: string, field: string) => (
    <RichText key={`${lesson.id}-${field}`} text={text} lesson={lesson} field={field} demo={demo} />
  );
  return (
    <Shell active="/curso" courseAccess teacher={teacher}>
      <HashReveal />
      <Link className="back-link" href={demo ? '/' : '/curso'}>
        <ArrowLeft size={14} /> {demo ? 'Voltar ao início' : 'Minha trilha de aprendizado'}
      </Link>
      {demo && (
        <div className="banner">
          Prévia da primeira aula · Nenhum progresso é gravado nesta prévia.{' '}
          <Link href={`/aulas/${lesson.id}`}>Abrir a aula e registrar minha prática.</Link>
        </div>
      )}
      <header className="lesson-hero">
        <p className="eyebrow">
          MÓDULO {String(lesson.module).padStart(2, '0')} · AULA {lesson.local_n}
        </p>
        <h1>{lesson.title}</h1>
        <div>{rich(lesson.goal, 'goal')}</div>
        <div className="lesson-meta">
          <span className="badge">{song.title}</span>
          <span className="badge">Tom {chart.key}</span>
          <span className="badge">{formatBpm(defaultBpm)} BPM para praticar</span>
          <span className="badge">Encontro de 60 min</span>
        </div>
      </header>
      <nav className="lesson-jumps" aria-label="Nesta aula">
        <a href="#entender">Entender</a>
        <a href="#acordes">Acordes</a>
        <a href="#tocar">Tocar junto</a>
        <a href="#praticar">Praticar</a>
        {enrichment && !demo && <a href="#aprofundar">Aprofundar</a>}
        <a href="#consulta">Teoria</a>
        {teacher && <a href="#plano-professor">Plano do professor</a>}
      </nav>
      <div className="lesson-layout" key={lesson.id}>
        <div className="lesson-content">
          <CollapsibleCard id="entender" title="A música como ponto de partida">
            <p className="eyebrow">PRIMEIRO, ENTENDA</p>
            {rich(lesson.explain, 'explain')}
            <p className="eyebrow section">NOSSO FOCO</p>
            {rich(lesson.focus, 'focus')}
            <p className="eyebrow section">RETOMADA</p>
            {rich(lesson.review, 'review')}
          </CollapsibleCard>
          <CollapsibleCard id="acordes" title="Os acordes desta aula">
            <p className="eyebrow">MÃOS NO INSTRUMENTO</p>
            <p className="hint">
              × não tocar · ○ corda solta · 1 indicador, 2 médio, 3 anelar, 4 mínimo. Cordas da 6ª à
              1ª, da esquerda para a direita.
            </p>
            <div className="chord-grid">
              {lesson.chords.map((name) => (
                <ChordDiagram key={name} name={name} />
              ))}
            </div>
          </CollapsibleCard>
          <ChartPlayer
            key={`chart-${lesson.id}`}
            chart={chart}
            initialBpm={lesson.bpm}
            tempo={song.tempo}
          />
          <CollapsibleCard id="praticar" title="Da explicação à prática">
            <p className="eyebrow">UM PASSO DE CADA VEZ</p>
            <ol className="steps">
              {lesson.steps.map((s, i) => (
                <li key={i}>{rich(s, `steps-${i}`)}</li>
              ))}
            </ol>
            <h3>Modelo para uma sessão de prática</h3>
            <p className="hint">
              {enrichment && !demo
                ? 'Use este modelo nos momentos de estudo da semana, ajustando o foco ao roteiro de quatro dias abaixo.'
                : 'Use este modelo nos momentos de estudo da semana e ajuste o foco com seu professor.'}{' '}
              Os tempos são sugestões flexíveis.
            </p>
            <ol className="steps">
              {lesson.practice.map((s, i) => (
                <li key={i}>{rich(s, `practice-${i}`)}</li>
              ))}
            </ol>
            <p className="hint">
              Padrão rítmico:{' '}
              {(
                {
                  one: 'Um ataque no início de cada compasso; deixe o acorde soar.',
                  quarters: 'Ataques regulares em semínimas: conte os pulsos em voz alta.',
                  eighths: 'Colcheias: divida cada pulso em duas partes iguais (1 e, 2 e…).',
                  finger4:
                    'Dedilhado em quatro pulsos: observe o baixo e a ordem dos dedos na apostila.',
                  finger6: 'Dedilhado em 6/8: dois grupos de três subdivisões (1 la li, 2 la li).',
                } as Record<string, string>
              )[lesson.pattern] ?? lesson.pattern}
            </p>
          </CollapsibleCard>
          <Quiz
            key={`quiz-${lesson.id}`}
            question={rich(lesson.question, 'question')}
            answer={rich(lesson.answer, 'answer')}
          />
          {enrichment && !demo && (
            <LessonDeepening content={enrichment} studies={getLessonStudies(lesson.id)} />
          )}
          <CollapsibleCard id="consulta" title="Consultas teóricas">
            <div className="section-title">
              <p className="eyebrow">CONECTE AS IDEIAS</p>
              <Hint label="Navegar pelas consultas">
                Cada consulta oferece links para retornar ao ponto em que ela aparece nesta aula.
              </Hint>
            </div>
            <div className="stack">
              {lesson.theory_refs.map((ref, i) => (
                <div key={i}>{rich(ref, `theory_refs-${i}`)}</div>
              ))}
            </div>
          </CollapsibleCard>
          <details>
            <summary>
              Texto integral da base · páginas originais {lesson.studentPages.join(', ')}
            </summary>
            <div className="source-text">{rich(lesson.studentText, 'studentText')}</div>
            <a
              className="resource-link"
              href="/api/materials/aluno"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen size={16} />
              Abrir apostila com acervo integral <ExternalLink size={14} />
            </a>
          </details>
          {teacherPlan}
          <div className="lesson-nav">
            {prev ? (
              <Link className="button secondary" href={`/aulas/${prev.id}`}>
                <ArrowLeft size={15} />
                {prev.display_id} · Anterior
              </Link>
            ) : (
              <Link className="button secondary" href="/curso">
                Ver trilha
              </Link>
            )}
            {next && (
              <Link className="button" href={`/aulas/${next.id}`}>
                {next.display_id} · Próxima <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
        <aside className="lesson-aside">
          <CollapsibleCard title={song.title}>
            <p className="eyebrow">NOSSO REPERTÓRIO</p>
            <p>{song.artist}</p>
            <VideoResource
              key={lesson.id}
              url={song.recording_url ?? song.listen_url}
              title={`${song.title} · ${song.artist}`}
            />
            <a
              className="resource-link"
              href={song.lyrics_chords_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Music2 size={17} />
              Abrir letra e cifra <ExternalLink size={14} />
            </a>
            <p className="hint">
              {song.lyrics_chords_note ??
                'A referência externa pode usar um arranjo diferente da versão didática.'}
            </p>
            <details>
              <summary>Fontes e versão</summary>
              <p className="hint">
                {song.tempo?.recording ?? song.recording ?? song.identity_note}
              </p>
              {song.sources.map((s, i) => (
                <span key={i}>
                  {s.url ? (
                    <a
                      className="resource-link"
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.title}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="hint">{s.title}</span>
                  )}
                </span>
              ))}
            </details>
          </CollapsibleCard>
          <LessonProgress
            key={`progress-${lesson.id}`}
            lesson={lesson}
            demo={demo}
            checkLabels={lesson.checks.map((text, i) => rich(text, `checks-${i}`))}
          />
          <PracticeLog
            key={`practice-${lesson.id}`}
            lessonId={lesson.id}
            initialBpm={Math.round(defaultBpm)}
            demo={demo}
          />
        </aside>
      </div>
    </Shell>
  );
}
