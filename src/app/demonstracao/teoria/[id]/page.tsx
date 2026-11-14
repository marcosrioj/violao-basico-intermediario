import { requireCourseProfile } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { TheoryExercise } from '@/components/course/theory-exercise';
import { TheoryLab } from '@/components/theory-lab';
import { getDemoTheory } from '@/content/demo';
import { Hint } from '@/components/ui/hint';

export const dynamic = 'force-dynamic';

export default async function DemoTheoryPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
  const { id } = await params;
  const content = getDemoTheory(id);
  if (!content) notFound();
  const { reference, occurrences } = content;
  const rich = (text: string, field: string) => (
    <RichText text={text} theoryId={reference.id} field={field} demo />
  );
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link className="back-link" href="/demonstracao">
        <ArrowLeft size={15} /> Voltar à aula demonstrativa
      </Link>
      <div className="banner">
        Esta consulta acompanha a primeira aula do curso.{' '}
        <Link href="/curso">Ver a trilha completa.</Link>
      </div>
      <PageHeading
        eyebrow={'CONSULTA MUSICAL · TEORIA ' + reference.id}
        title={reference.title}
        description="Leia uma ideia, experimente no instrumento e volte à sua primeira música."
      />
      <nav className="lesson-jumps" aria-label="Nesta consulta">
        <a href="#laboratorio">Experimentar no laboratório</a>
        <a href="#retornar">Retornar à música</a>
      </nav>
      <div className="stack">
        <section className="card prose">
          <p className="large-quote">{rich(reference.lead, 'lead')}</p>
          {reference.blocks.map((block, i) => (
            <section key={block.heading}>
              <h2>{rich(block.heading, 'heading-' + i)}</h2>
              <p>{rich(block.text, 'block-' + i)}</p>
            </section>
          ))}
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={'Tabela: ' + reference.title}
          >
            <table>
              <thead>
                <tr>
                  {reference.table.headers.map((heading, i) => (
                    <th scope="col" key={i}>
                      {rich(heading, 'head-' + i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reference.table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{rich(cell, 'cell-' + i + '-' + j)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <TheoryLab referenceId={reference.id} />
        <TheoryExercise
          exercise={rich(reference.exercise, 'exercise')}
          answer={rich(reference.answer, 'answer')}
        />
        <section className="card" id="retornar">
          <p className="eyebrow">DA IDEIA À PRÁTICA</p>
          <div className="section-title">
            <h2>Retornar ao ponto de estudo</h2>
            <Hint label="Voltar à aula demonstrativa">
              Cada link volta à menção exata desta teoria na aula demonstrativa.
            </Hint>
          </div>
          <div className="review-list">
            {occurrences.map((item) => (
              <Link key={item.anchor} href={item.href}>
                {item.label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </section>
        <section className="card">
          <p className="eyebrow">CONTINUE EXPLORANDO</p>
          <h2>Fontes desta consulta</h2>
          {reference.sources.map((source) =>
            source.url ? (
              <a
                className="resource-link"
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.title}
                <ExternalLink size={15} />
              </a>
            ) : (
              <p key={source.title}>{source.title}</p>
            ),
          )}
        </section>
      </div>
    </Shell>
  );
}
