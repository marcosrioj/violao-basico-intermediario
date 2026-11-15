import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { TheoryExercise } from './theory-exercise';
import { getLessonTechniqueEntries, techniqueSources } from '@/content/curriculum';
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
        <Link key={study.id} href={`/tecnica/${study.id}`}>
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
            <a
              className="resource-link"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.author} · {source.title} <ExternalLink size={15} aria-hidden="true" />
            </a>
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
}: {
  study: TechniqueStudy;
  sources: ResearchSource[];
}) {
  return (
    <div className="learning-reading integrated-study-content">
      <p>{study.goal}</p>
      <details>
        <summary>O que preparar antes</summary>
        <ul>
          {study.prerequisites.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </details>
      {study.explanation.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      <div className="learning-example section">
        <p className="eyebrow">EXEMPLO AUTORAL</p>
        <h4>{study.workedExample.title}</h4>
        <p>{study.workedExample.text}</p>
      </div>
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
      <h4 className="section">Experimente no violão</h4>
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
      <h4 className="section">O que observar</h4>
      <ul>
        {study.checks.map((check, i) => (
          <li key={i}>{check}</li>
        ))}
      </ul>
      <details className="section">
        <summary>Testar o que aprendi e planejar a retomada</summary>
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
      <p className="hint">
        Siga o foco de cada estudo nesta aula. As explicações completas ficam disponíveis para
        consultar e retomar.
      </p>
      {entries.map(({ study, stage, focus }) => (
        <details
          className="integrated-study"
          id={`estudo-${study.id}`}
          key={study.id}
          suppressHydrationWarning
        >
          <summary>
            <h3>
              <span className="integrated-study-stage">
                {stage === 'introducao' ? 'Começar' : 'Retomar'}
              </span>
              <span className="integrated-study-title">{study.title}</span>
              <span className="integrated-study-focus">{focus}</span>
            </h3>
          </summary>
          <TechniqueStudyContent study={study} sources={techniqueSources} />
        </details>
      ))}
      <Link href="/laboratorio" className="resource-link section">
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
      <div>
        <h3>Escuta diagnóstica</h3>
        <p>{content.diagnosis}</p>
      </div>
      <div>
        <h3>Demonstre e convide à tentativa</h3>
        <p>{content.demonstration}</p>
      </div>
      <details open>
        <summary>Plano integrado de 60 minutos</summary>
        <ol className="learning-week">
          {content.sequence.map((stage, i) => (
            <li key={i}>
              <h3>
                {stage.minutes} min · {stage.title}
              </h3>
              <p>{stage.action}</p>
            </li>
          ))}
        </ol>
      </details>
      <div className="learning-example">
        <h3>Se a dificuldade aparecer</h3>
        <p>{content.commonDifficulty}</p>
        <p>{content.intervention}</p>
      </div>
      <div>
        <h3>Reduzir o desafio</h3>
        <p>{content.easier}</p>
      </div>
      <div>
        <h3>Ampliar quando estiver pronto</h3>
        <p>{content.extension}</p>
      </div>
      <div>
        <h3>Observar e devolver</h3>
        <p>{content.observation}</p>
        <p>{content.feedbackPrompt}</p>
      </div>
      <div>
        <h3>Conferir retenção e transferência</h3>
        <p>{content.transferCheck}</p>
      </div>
      <ResearchSources
        sources={sources.filter((source) => content.sourceIds.includes(source.id))}
      />
    </div>
  );
}
