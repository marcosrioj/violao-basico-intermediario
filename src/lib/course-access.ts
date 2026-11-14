import type { Profile } from './contracts';
import { AppError } from './errors';

export type CourseAccess =
  | { allowed: true; reason: 'teacher' | 'enrolled' }
  | { allowed: false; reason: 'enrollment_required' };

/** The profile must come from the protected database row, never client metadata. */
export async function evaluateCourseAccess(
  profile: Pick<Profile, 'role'>,
  hasMembership: () => Promise<boolean>,
): Promise<CourseAccess> {
  if (profile.role === 'teacher') return { allowed: true, reason: 'teacher' };
  return (await hasMembership())
    ? { allowed: true, reason: 'enrolled' }
    : { allowed: false, reason: 'enrollment_required' };
}

export function assertCourseAccess(access: CourseAccess): void {
  if (!access.allowed)
    throw new AppError(
      403,
      'ENROLLMENT_REQUIRED',
      'Confirme o código de matrícula recebido do professor para acessar o curso.',
    );
}
