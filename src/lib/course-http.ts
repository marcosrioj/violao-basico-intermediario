import 'server-only';
import { requireCourseAccess, type AuthContext } from '@/lib/auth';
import { api } from '@/lib/http';

/** Authenticate and check enrollment before reading input or executing course operations. */
export function courseApi(handler: (request: Request, context: AuthContext) => Promise<unknown>) {
  return api(async (request, context) => {
    await requireCourseAccess(context);
    return handler(request, context);
  });
}
