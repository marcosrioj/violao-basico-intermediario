import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { TheoryExercise } from './theory-exercise';
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

export function LessonDeepening({
  content,
  studies,
}: {
  content: LessonEnrichment;
  studies: TechniqueStudy[];
}) {
  return (
    <section className="stack learning-reading" aria-label="Aprofundamento da aula">
      <CollapsibleCard
        id="aprofundar"
        title="Compreender, experimentar e aplicar"
        description="Estude uma ideia por vez e leve-a ao trecho da sua música."
      >
        {content.understanding.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        <div className="learning-example section">
          <p className="eyebrow">EXEMPLO TRABALHADO</p>
          <h3>{content.workedExample.title}</h3>
          <p>{content.workedExample.text}</p>
        </div>
        <h3 className="section">Experimente no violão</h3>
        <ol className="steps">
          {content.guidedPractice.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <h3 className="section">A técnica por trás desta aula</h3>
        <StudyLinks studies={studies} />
      </CollapsibleCard>
      <TheoryExercise exercise={content.retrieval.question} answer={content.retrieval.answer} />
      <CollapsibleCard
        title="Consolidar durante a semana"
        description="Quatro momentos flexíveis. Retome em outro dia e ajuste o desafio com seu professor."
      >
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
      </CollapsibleCard>
    </section>
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
