import { lessons } from '@/content/course';
import { LessonView } from '@/components/course/lesson-view';
export default function Demo() {
  return <LessonView lesson={lessons[0]} demo />;
}
