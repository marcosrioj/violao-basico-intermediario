import { api } from '@/lib/http';
import { pagination, uuid } from '@/lib/validation';
import { getClassroom } from '@/lib/application/queries';
import { removeMembership } from '@/lib/application/commands';
export const GET = api(async (request, context) => {
  const url = new URL(request.url);
  const id = uuid.parse(url.pathname.split('/').pop());
  return getClassroom(context, id, pagination.parse(Object.fromEntries(url.searchParams)).page);
});
export const DELETE = api(async (request, context) => {
  const url = new URL(request.url);
  const id = uuid.parse(url.pathname.split('/').pop());
  return removeMembership(context, id, uuid.parse(url.searchParams.get('studentId')));
});
