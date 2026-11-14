import { api, readJson } from '@/lib/http';
import { joinInput } from '@/lib/validation';
import { joinClassroom } from '@/lib/application/commands';
export const POST = api(async (request, context) =>
  joinClassroom(context, await readJson(request, joinInput)),
);
