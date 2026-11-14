export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Music2, ExternalLink } from 'lucide-react';
import { requireCourseProfile } from '@/lib/auth';
import { songs, lessons } from '@/content/course';
import { Shell, PageHeading } from '@/components/shell';
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
          <article className="card song-card" key={id}>
            <div className="song-title">
              <span className="song-mark">
                <Music2 />
              </span>
              <div>
                <h2>{s.title}</h2>
                <small className="muted">{s.artist}</small>
              </div>
            </div>
            <p>{s.recording ?? s.identity_note}</p>
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
          </article>
        ))}
      </div>
    </Shell>
  );
}
