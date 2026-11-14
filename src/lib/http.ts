import 'server-only';
import { authContext, type AuthContext } from '@/lib/auth';
import { endpoint } from '@/lib/endpoint';
export { readJson } from '@/lib/request';
export function api(handler: (request: Request, context: AuthContext) => Promise<unknown>) {
  return endpoint(async (request) => handler(request, await authContext()));
}
