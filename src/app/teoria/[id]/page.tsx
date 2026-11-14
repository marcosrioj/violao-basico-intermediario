import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { TheoryExercise } from '@/components/course/theory-exercise';
import { TheoryLab } from '@/components/theory-lab';
import { theoryReferences } from '@/content/course';
import { getReferenceOccurrences } from '@/content/navigation';
import { requireProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export default async function TheoryPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const reference = theoryReferences.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (!reference) notFound();
  const occurrences = [
    ...getReferenceOccurrences(reference.id),
    ...(profile.role === 'teacher'
      ? (await import('@/content/teacher-navigation')).getTeacherReferenceOccurrences(reference.id)
      : []),
  ];
  const index = theoryReferences.indexOf(reference);
  return (
    <Shell active="/materiais" teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link className="back-link" href="/materiais">
        <ArrowLeft size={15} /> Voltar à biblioteca
      </Link>
      <PageHeading
        eyebrow={`CONSULTA MUSICAL · TEORIA ${reference.id}`}
        title={reference.title}
        description="Leia uma ideia, experimente no instrumento e volte à sua música."
      />
      <nav className="lesson-jumps" aria-label="Nesta consulta"><a href="#laboratorio">Experimentar no laboratório</a><a href="#retornar">Retornar à música</a></nav>
      <div className="stack">
        <section className="card prose">
          <p className="large-quote">
            <RichText text={reference.lead} theoryId={reference.id} field="lead" />
          </p>
          {reference.blocks.map((block, i) => (
            <section key={block.heading}>
              <h2>
                <RichText text={block.heading} theoryId={reference.id} field={`heading-${i}`} />
              </h2>
              <p>
                <RichText text={block.text} theoryId={reference.id} field={`block-${i}`} />
              </p>
            </section>
          ))}
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={`Tabela: ${reference.title}`}
          >
            <table>
              <thead>
                <tr>
                  {reference.table.headers.map((heading, i) => (
                    <th scope="col" key={heading}>
                      <RichText text={heading} theoryId={reference.id} field={`head-${i}`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reference.table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>
                        <RichText text={cell} theoryId={reference.id} field={`cell-${i}-${j}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <TheoryLab referenceId={reference.id} />
        <TheoryExercise
          exercise={<RichText text={reference.exercise} theoryId={reference.id} field="exercise" />}
          answer={<RichText text={reference.answer} theoryId={reference.id} field="answer" />}
        />
        <section className="card" id="retornar">
          <p className="eyebrow">DA IDEIA À PRÁTICA</p>
          <h2>Retornar ao ponto de estudo</h2>
          <p className="hint">
            Cada link volta à menção exata desta teoria. As respostas fechadas se abrem quando
            necessário.
          </p>
          <div className="review-list">
            {occurrences.map((occurrence) => (
              <Link key={occurrence.anchor} href={occurrence.href}>
                {occurrence.label}
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
      <nav className="lesson-nav" aria-label="Navegar entre consultas">
        {index > 0 ? (
          <Link className="button secondary" href={`/teoria/${theoryReferences[index - 1].id}`}>
            <ArrowLeft size={16} /> Teoria {theoryReferences[index - 1].id}
          </Link>
        ) : (
          <span />
        )}
        {index < theoryReferences.length - 1 && (
          <Link className="button secondary" href={`/teoria/${theoryReferences[index + 1].id}`}>
            Teoria {theoryReferences[index + 1].id}
            <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </Shell>
  );
}
