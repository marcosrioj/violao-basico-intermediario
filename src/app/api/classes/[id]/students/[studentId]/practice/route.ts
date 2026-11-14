import { api } from '@/lib/http';
import { pagination, uuid } from '@/lib/validation';
import { listStudentPractice } from '@/lib/application/queries';
export const GET = api(async (request, context) => {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const classId = uuid.parse(segments.at(-4));
  const studentId = uuid.parse(segments.at(-2));
  return listStudentPractice(
    context,
    classId,
    studentId,
    pagination.parse(Object.fromEntries(url.searchParams)).page,
  );
});
