import type { Profile } from './contracts';
import type { CourseAccess } from './course-access';

export type PublicViewer =
  | { status: 'anonymous'; profile: null; courseAccess: false }
  | { status: 'authenticated'; profile: Profile; courseAccess: boolean }
  | { status: 'unavailable'; profile: Profile | null; courseAccess: false };

/** Public pages stay available during an outage without pretending the visitor signed out. */
export async function resolvePublicViewer({
  getProfile,
  getAccess,
}: {
  getProfile: () => Promise<Profile | null>;
  getAccess: (profile: Profile) => Promise<CourseAccess>;
}): Promise<PublicViewer> {
  let profile: Profile | null = null;
  try {
    profile = await getProfile();
    if (!profile) return { status: 'anonymous', profile: null, courseAccess: false };
    const access = await getAccess(profile);
    return { status: 'authenticated', profile, courseAccess: access.allowed };
  } catch {
    return { status: 'unavailable', profile, courseAccess: false };
  }
}
