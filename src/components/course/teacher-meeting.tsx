import type { TeacherCue } from '@/content/curriculum-types';
import type { PracticeVisual as Diagram } from './practice-visual-types';
import { PracticeVisual } from './practice-visual';

/** Server-rendered only in the authorized teacher plan. */
export function TeacherMeeting({
  cue,
  goal,
  visual,
}: {
  cue: TeacherCue;
  goal: string;
  visual?: Diagram;
}) {
  return (
    <section className="teacher-meeting" aria-label="Roteiro essencial do encontro">
      <div className="teacher-meeting-goal">
        <h3>Foco de hoje</h3>
        <p>{goal}</p>
      </div>
      <ol className="teacher-meeting-flow" role="list">
        {cue.sequence.map((step, index) => {
          const start = cue.sequence
            .slice(0, index)
            .reduce((sum, previous) => sum + previous.minutes, 0);
          const end = start + step.minutes;
          return (
            <li key={step.title}>
              <span className="teacher-meeting-number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h4>
                  {step.title}{' '}
                  <span>
                    {start}–{end} min
                  </span>
                </h4>
                <p>{step.action}</p>
                {index === 1 && visual && cue.lessonId !== 'm13-a3' && (
                  <details className="teacher-meeting-visual">
                    <summary>Ver apoio para demonstrar</summary>
                    <PracticeVisual visual={visual} />
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="hint">
        60 minutos como referência. Ajuste o apoio e preserve o tempo de fazer música.
      </p>
      <dl className="teacher-meeting-decisions">
        <div>
          <dt>O que observar</dt>
          <dd>{cue.watchFor}</dd>
        </div>
        <div>
          <dt>Se travar</dt>
          <dd>{cue.adjust}</dd>
        </div>
      </dl>
      <details className="teacher-meeting-extension">
        <summary>Se já estiver seguro</summary>
        <p>{cue.extend}</p>
      </details>
      <div className="teacher-meeting-followup">
        <h4>Até o próximo encontro</h4>
        <p>{cue.followUp}</p>
      </div>
      <p className="hint">
        Se houver dor, interrompa a execução e reveja apoio e esforço com o aluno.
      </p>
    </section>
  );
}
