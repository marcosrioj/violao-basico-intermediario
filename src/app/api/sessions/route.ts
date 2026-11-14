import { api, readJson } from '@/lib/http';
import { pagination, sessionInput, uuid } from '@/lib/validation';
import { listSessions } from '@/lib/application/queries';
import { scheduleSession, cancelSession } from '@/lib/application/commands';
export const GET = api(async (request, context) =>
  listSessions(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = api(async (request, context) =>
  scheduleSession(context, await readJson(request, sessionInput)),
);
export const DELETE = api(async (request, context) =>
  cancelSession(context, uuid.parse(new URL(request.url).searchParams.get('id'))),
);
