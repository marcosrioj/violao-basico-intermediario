import { readJson } from '@/lib/http';
import { courseApi } from '@/lib/course-http';
import { progressInput, lessonId } from '@/lib/validation';
import { listProgress } from '@/lib/application/queries';
import { saveProgress } from '@/lib/application/commands';
export const GET = courseApi(async (request, context) => {
  const id = new URL(request.url).searchParams.get('lessonId');
  return listProgress(context, id ? lessonId.parse(id) : undefined);
});
export const PUT = courseApi(async (request, context) =>
  saveProgress(context, await readJson(request, progressInput)),
);
