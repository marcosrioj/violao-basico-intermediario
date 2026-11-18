import Link from '@/components/ui/page-link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { TheoryExercise } from './theory-exercise';
import { getLessonTechniqueEntries, techniqueSources } from '@/content/curriculum';
import { getTechniqueVisuals } from '@/content/technique-visuals';
import { PracticeVisual } from './practice-visual';
import type {
  LessonEnrichment,
  ResearchSource,
  TechniqueStudy,
  TeacherEnrichment,
} from '@/content/curriculum-types';

export function StudyLinks({
  studies,
}: {
  studies: Pick<TechniqueStudy, 'id' | 'title' | 'goal'>[];
}) {
  return (
    <div className="review-list">
      {studies.map((study) => (
        <Link purpose="reference" key={study.id} href={`/tecnica/${study.id}`}>
          <span>
            <strong>{study.title}</strong>
            <small className="learning-link-description">{study.goal}</small>
          </span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

export function ResearchSources({ sources }: { sources: ResearchSource[] }) {
  return (
    <details className="section learning-reading">
      <summary>Fontes e aprofundamento</summary>
      <div className="stack">
        {sources.map((source) => (
          <div key={source.id}>
            <Link className="resource-link" href={source.url} rel="noopener noreferrer">
              {source.author} · {source.title} <ExternalLink size={15} aria-hidden="true" />
            </Link>
            <p>{source.scope}</p>
            <p className="hint">{source.limitation}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

export function LessonUnderstanding({ content }: { content: LessonEnrichment }) {
  return (
    <details id="aprofundar" className="section learning-reading">
      <summary>Entender com mais detalhes e acompanhar um exemplo</summary>
      {content.understanding.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      <div className="learning-example section">
        <p className="eyebrow">EXEMPLO TRABALHADO</p>
        <h3>{content.workedExample.title}</h3>
        <p>{content.workedExample.text}</p>
      </div>
    </details>
  );
}

export function LessonWeeklyPractice({ content }: { content: LessonEnrichment }) {
  return (
    <details className="section learning-reading" id="pratica-semanal">
      <summary>Minha prática durante a semana</summary>
      <p>Quatro momentos flexíveis. Retome em outro dia e ajuste o desafio com seu professor.</p>
      <ol className="learning-week">
        {content.weeklyPlan.map((day) => (
          <li key={day.day}>
            <h3>
              Dia {day.day} · {day.title}
            </h3>
            <p>{day.task}</p>
          </li>
        ))}
      </ol>
      <h3 className="section">O que observar na execução</h3>
      <ul>
        {content.successCriteria.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <p className="learning-example">
        <strong>Próximo passo:</strong> {content.nextStep}
      </p>
    </details>
  );
}

/** Full study content stays on the server and is available without leaving the lesson. */
export function TechniqueStudyContent({
  study,
  sources,
  standalone = false,
}: {
  study: TechniqueStudy;
  sources: ResearchSource[];
  standalone?: boolean;
}) {
  return (
    <div className="learning-reading integrated-study-content">
      <div className="technique-visuals" id={standalone ? 'compreender' : undefined}>
        {getTechniqueVisuals(study.id).map((visual, i) =>
          i === 0 ? (
            <PracticeVisual key={`${study.id}-${i}`} visual={visual} />
          ) : (
            <details key={`${study.id}-${i}`}>
              <summary>{visual.title}</summary>
              <PracticeVisual visual={visual} />
            </details>
          ),
        )}
      </div>
      <details>
        <summary>Preparação e explicação completa</summary>
        <p>{study.goal}</p>
        <h4>Antes de começar</h4>
        <ul>
          {study.prerequisites.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        {study.explanation.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        <div className="learning-example section">
          <p className="eyebrow">EXEMPLO AUTORAL</p>
          <h4>{study.workedExample.title}</h4>
          <p>{study.workedExample.text}</p>
        </div>
      </details>
      {study.workedExample.tab && (
        <pre
          className="learning-tab"
          tabIndex={0}
          role="region"
          aria-label={`Tablatura: ${study.title}`}
        >
          <code>{study.workedExample.tab}</code>
        </pre>
      )}
      <h4 className="section" id={standalone ? 'experimentar' : undefined}>
        Pratique
      </h4>
      {standalone && study.id === 't1-e2' && (
        <Link purpose="reference" href="/laboratorio#afinador" className="resource-link">
          Abrir afinador do laboratório <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
      <ol className="steps">
        {study.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <details className="section">
        <summary>Ajustar a dificuldade e corrigir o som</summary>
        <h4 className="section">Se precisar de apoio</h4>
        <p>{study.easier}</p>
        <h4 className="section">Quando estiver estável</h4>
        <p>{study.harder}</p>
        {study.mistakes.map((mistake, i) => (
          <div className="section" key={i}>
            <h4>{mistake.symptom}</h4>
            <p>{mistake.adjustment}</p>
          </div>
        ))}
      </details>
      <details
        className="section"
        id={standalone ? 'recuperar' : undefined}
        suppressHydrationWarning
      >
        <summary>Conferir o resultado e revisar</summary>
        <h4 className="section">O que observar</h4>
        <ul>
          {study.checks.map((check, i) => (
            <li key={i}>{check}</li>
          ))}
        </ul>

        <TheoryExercise
          exercise={study.retrieval.question}
          answer={study.retrieval.answer}
          compact
          headingLevel={4}
        />
        <h4 className="section">Volte ao estudo em outro dia</h4>
        <ol className="steps">
          {study.spacing.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </details>
      <ResearchSources sources={sources.filter((source) => study.sourceIds.includes(source.id))} />
    </div>
  );
}

export function LessonTechniques({ lessonId }: { lessonId: string }) {
  const entries = getLessonTechniqueEntries(lessonId);
  return (
    <div className="integrated-studies">
      {entries.map(({ study, stage, focus }) => (
        <details
          className="integrated-study"
          id={`estudo-${study.id}`}
          key={study.id}
          name={`techniques-${lessonId}`}
          suppressHydrationWarning
        >
          <summary>
            <h3>
              <span className="integrated-study-stage">
                {stage === 'introducao' ? 'Começar' : 'Retomar'}
              </span>
              <span className="integrated-study-title">{study.title}</span>
            </h3>
          </summary>
          <p className="integrated-study-focus">{focus}</p>
          <TechniqueStudyContent study={study} sources={techniqueSources} />
        </details>
      ))}
      <Link purpose="reference" href="/laboratorio" className="resource-link section">
        Explorar sons e ritmo no laboratório <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Only compose this on an authorized teacher page. */
export function TeacherDeepening({
  content,
  sources,
}: {
  content: TeacherEnrichment;
  sources: ResearchSource[];
}) {
  return (
    <div className="stack learning-reading">
      <details>
        <summary>Preparar e demonstrar</summary>
        <h3>Escuta diagnóstica</h3>
        <p>{content.diagnosis}</p>
        <h3 className="section">Demonstração</h3>
        <p>{content.demonstration}</p>
      </details>
      <details>
        <summary>Adaptar à dificuldade do aluno</summary>
        <h3>Se a dificuldade aparecer</h3>
        <p>{content.commonDifficulty}</p>
        <p>{content.intervention}</p>
        <h3 className="section">Reduzir o desafio</h3>
        <p>{content.easier}</p>
        <h3 className="section">Ampliar o desafio</h3>
        <p>{content.extension}</p>
      </details>
      <details>
        <summary>Observar e dar retorno</summary>
        <p>{content.observation}</p>
        <p>{content.feedbackPrompt}</p>
        <h3 className="section">Conferir retenção e transferência</h3>
        <p>{content.transferCheck}</p>
      </details>
      <ResearchSources
        sources={sources.filter((source) => content.sourceIds.includes(source.id))}
      />
    </div>
  );
}
