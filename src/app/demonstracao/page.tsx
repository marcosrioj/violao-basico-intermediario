import { requireCourseProfile } from '@/lib/auth';
import { lessons } from '@/content/course';
import { LessonView } from '@/components/course/lesson-view';
export const dynamic = 'force-dynamic';

export default async function Demo() {
  const profile = await requireCourseProfile();
  return <LessonView lesson={lessons[0]} demo teacher={profile.role === 'teacher'} />;
}
