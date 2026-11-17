'use client';
import { useState } from 'react';
import Link from '@/components/ui/page-link';
import { BookOpen } from 'lucide-react';
import type { Page, Practice } from '@/lib/contracts';
import { Empty } from '@/components/ui';
import {
  formatDate,
  lessonName,
  Pagination,
  ResourceState,
  useResource,
  type LessonOption,
} from './shared';

function PracticeHistory({
  classId,
  studentId,
  timezone,
  lessons,
}: {
  classId: string;
  studentId: string;
  timezone: string;
  lessons: LessonOption[];
}) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<Practice>>(
    `/api/classes/${classId}/students/${studentId}/practice?page=${page}`,
  );
  return (
    <ResourceState {...resource} retry={resource.reload}>
      {resource.data && (
        <>
          {resource.data.items.length ? (
            resource.data.items.map((item) => (
              <article className="practice-entry" key={item.id}>
                <h3>
                  <Link
                    className="inline-link dashboard-lesson-link"
                    href={`/aulas/${item.lesson_id}#plano-professor`}
                    purpose="reference"
                  >
                    {lessonName(lessons, item.lesson_id)}
                  </Link>
                </h3>
                <p>
                  {item.minutes} minutos{item.bpm ? ` · ${item.bpm} BPM` : ''}
                </p>
                {item.notes && <p className="dashboard-preserve">{item.notes}</p>}
                <small>
                  <time dateTime={item.practiced_at}>
                    {formatDate(item.practiced_at, timezone, true)}
                  </time>{' '}
                  · {timezone}
                </small>
              </article>
            ))
          ) : (
            <Empty>Este aluno ainda não registrou sessões de prática.</Empty>
          )}
          <Pagination
            page={page}
            hasMore={resource.data.hasMore}
            onChange={setPage}
            label="práticas deste aluno"
          />
        </>
      )}
    </ResourceState>
  );
}
export function TeacherPractice(props: {
  classId: string;
  studentId: string;
  timezone: string;
  lessons: LessonOption[];
}) {
  const [open, setOpen] = useState(false);
  const regionId = `diary-${props.studentId}`;
  return (
    <div className="dashboard-student-diary">
      <button
        className="button secondary small"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
      >
        <BookOpen size={14} />
        {open ? 'Fechar diário' : 'Ver diário de prática'}
      </button>
      <div id={regionId}>{open && <PracticeHistory {...props} />}</div>
    </div>
  );
}
