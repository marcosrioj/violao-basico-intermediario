import { readJson } from '@/lib/http';
import { courseApi } from '@/lib/course-http';
import { pagination, feedbackInput } from '@/lib/validation';
import { listFeedback } from '@/lib/application/queries';
import { giveFeedback } from '@/lib/application/commands';
export const GET = courseApi(async (request, context) =>
  listFeedback(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = courseApi(async (request, context) =>
  giveFeedback(context, await readJson(request, feedbackInput)),
);
