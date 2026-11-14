import { readJson } from '@/lib/http';
import { courseApi } from '@/lib/course-http';
import { pagination, practiceInput } from '@/lib/validation';
import { listPractice } from '@/lib/application/queries';
import { logPractice } from '@/lib/application/commands';
export const GET = courseApi(async (request, context) =>
  listPractice(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = courseApi(async (request, context) =>
  logPractice(context, await readJson(request, practiceInput)),
);
