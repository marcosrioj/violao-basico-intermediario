import { api, readJson } from '@/lib/http';
import { pagination, classroomInput } from '@/lib/validation';
import { listClasses } from '@/lib/application/queries';
import { createClassroom } from '@/lib/application/commands';
export const GET = api(async (request, context) =>
  listClasses(
    context,
    pagination.parse(Object.fromEntries(new URL(request.url).searchParams)).page,
  ),
);
export const POST = api(async (request, context) =>
  createClassroom(context, await readJson(request, classroomInput)),
);
