import { api, readJson } from '@/lib/http';
import { pagination, practiceInput } from '@/lib/validation';
import { listPractice } from '@/lib/application/queries';
import { logPractice } from '@/lib/application/commands';
export const GET = api(async (request, context) =>
  listPractice(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = api(async (request, context) =>
  logPractice(context, await readJson(request, practiceInput)),
);
