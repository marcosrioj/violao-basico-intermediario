import { TheoryReading } from '@/components/course/theory-reading';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import Link from '@/components/ui/page-link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { TheoryExercise } from '@/components/course/theory-exercise';
import { TheoryLab } from '@/components/theory-lab';
import { theoryReferences } from '@/content/course';
import { getReferenceOccurrences } from '@/content/navigation';
import { requireCourseProfile } from '@/lib/auth';
import { Hint } from '@/components/ui/hint';

export const dynamic = 'force-dynamic';
export default async function TheoryPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
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
    <Shell active="/materiais" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link className="back-link" href="/materiais">
        <ArrowLeft size={15} /> Voltar à biblioteca
      </Link>
      <PageHeading
        eyebrow={`CONSULTA MUSICAL · TEORIA ${reference.id}`}
        title={reference.title}
        description="Leia uma ideia, experimente no instrumento e volte à sua música."
      />
      <nav className="learning-paths" aria-label="Ações da consulta musical">
        <a className="button secondary" href="#laboratorio">
          Experimentar com som
        </a>
        <a className="button secondary" href="#conferir">
          Conferir a aprendizagem
        </a>
        <a className="button secondary" href="#retornar">
          Voltar à aula
        </a>
      </nav>
      <div className="stack">
        <TheoryReading reference={reference} />
        <CollapsibleCard title="Experimentar com som" name="theory-activities">
          <TheoryLab referenceId={reference.id} />
        </CollapsibleCard>
        <CollapsibleCard id="conferir" title="Conferir a aprendizagem" name="theory-activities">
          <TheoryExercise
            compact
            exercise={
              <RichText text={reference.exercise} theoryId={reference.id} field="exercise" />
            }
            answer={<RichText text={reference.answer} theoryId={reference.id} field="answer" />}
          />
        </CollapsibleCard>
        <CollapsibleCard id="retornar" title="Voltar à música" name="theory-activities">
          <div className="section-title">
            <p>Escolha o ponto de estudo para retomar.</p>
            <Hint label="Voltar à aula">
              Cada link volta à menção exata desta teoria. As respostas fechadas se abrem quando
              necessário.
            </Hint>
          </div>
          <div className="review-list">
            {occurrences.map((occurrence) => (
              <Link key={occurrence.anchor} href={occurrence.href}>
                {occurrence.label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </CollapsibleCard>
        <CollapsibleCard title="Fontes" name="theory-activities">
          {reference.sources.map((source) =>
            source.url ? (
              <Link
                className="resource-link"
                key={source.url}
                href={source.url}
                rel="noopener noreferrer"
              >
                {source.title}
                <ExternalLink size={15} />
              </Link>
            ) : (
              <p key={source.title}>{source.title}</p>
            ),
          )}
        </CollapsibleCard>
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
