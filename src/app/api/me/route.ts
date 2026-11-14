import { api, readJson } from '@/lib/http';
import { profileInput } from '@/lib/validation';
import { updateProfile } from '@/lib/application/commands';
export const GET = api(async (_request, context) => context.profile);
export const PATCH = api(async (request, context) =>
  updateProfile(context, await readJson(request, profileInput)),
);
