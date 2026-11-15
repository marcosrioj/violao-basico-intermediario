import { CollapsibleCard } from '@/components/ui/collapsible-card';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Music2, ExternalLink } from 'lucide-react';
import { requireCourseProfile } from '@/lib/auth';
import { songs, lessons } from '@/content/course';
import { Shell, PageHeading } from '@/components/shell';
import { TempoReference } from '@/components/music/tempo-reference';
export default async function Repertoire() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/repertorio" courseAccess teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="MÚSICAS QUE NOS CONECTAM"
        title="Nosso repertório"
        description="Da primeira troca de acordes à interpretação. Ouça a gravação de referência e pratique o arranjo preparado para cada etapa."
      />
      <div className="theory-grid">
        {Object.entries(songs).map(([id, s]) => (
          <CollapsibleCard
            className="song-card"
            key={id}
            title={s.title}
            description={s.artist}
            leading={
              <span className="song-mark">
                <Music2 aria-hidden="true" />
              </span>
            }
          >
            <p>{s.tempo?.recording ?? s.recording ?? s.identity_note}</p>
            {s.tempo && <TempoReference tempo={s.tempo} />}
            <div className="control-row">
              <a
                className="button small"
                href={s.recording_url ?? s.listen_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvir gravação <ExternalLink size={13} />
              </a>
              <a
                className="button small secondary"
                href={s.lyrics_chords_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Letra e cifra <ExternalLink size={13} />
              </a>
            </div>
            <p className="eyebrow">PRATIQUE NAS AULAS</p>
            <div className="lesson-links">
              {lessons
                .filter((l) => l.song === id)
                .map((l) => (
                  <Link href={`/aulas/${l.id}`} key={l.id}>
                    {l.display_id} · {l.title}
                  </Link>
                ))}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </Shell>
  );
}
