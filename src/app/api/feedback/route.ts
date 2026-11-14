import { api, readJson } from '@/lib/http';
import { pagination, feedbackInput } from '@/lib/validation';
import { listFeedback } from '@/lib/application/queries';
import { giveFeedback } from '@/lib/application/commands';
export const GET = api(async (request, context) =>
  listFeedback(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = api(async (request, context) =>
  giveFeedback(context, await readJson(request, feedbackInput)),
);
