import 'server-only';
import type { AuthContext } from '@/lib/auth';
import { requireRole } from '@/lib/auth';
import { AppError, databaseError } from '@/lib/errors';
import type {
  Classroom,
  ClassroomDetail,
  Feedback,
  LessonSession,
  Membership,
  Page,
  Practice,
  Profile,
  Progress,
} from '@/lib/contracts';
export const PAGE_SIZE = 20;
const progressFields = 'student_id,lesson_id,status,notes,confidence,updated_at';
const classFields = 'id,teacher_id,name,created_at';
const feedbackFields = 'id,class_id,student_id,teacher_id,lesson_id,body,validated,created_at';
const sessionFields = 'id,class_id,lesson_id,starts_at,title,meeting_url,created_at';
function pageResult<T>(items: T[], page: number): Page<T> {
  return {
    items: items.slice(0, PAGE_SIZE),
    page,
    pageSize: PAGE_SIZE,
    hasMore: items.length > PAGE_SIZE,
  };
}
export async function listProgress({ supabase, profile }: AuthContext, lessonId?: string) {
  let query = supabase
    .from('lesson_progress')
    .select(progressFields)
    .eq('student_id', profile.id)
    .order('lesson_id')
    .limit(39);
  if (lessonId) query = query.eq('lesson_id', lessonId);
  const { data, error } = await query;
  databaseError(error);
  return (data || []) as Progress[];
}
export async function listPractice({ supabase, profile }: AuthContext, page: number) {
  const { data, error } = await supabase
    .from('practice_logs')
    .select('id,student_id,lesson_id,minutes,bpm,notes,practiced_at')
    .eq('student_id', profile.id)
    .order('practiced_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  databaseError(error);
  return pageResult((data || []) as Practice[], page);
}
export async function listClasses({ supabase, profile }: AuthContext, page: number) {
  let query = supabase
    .from('classrooms')
    .select(classFields)
    .order('created_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (profile.role === 'teacher') query = query.eq('teacher_id', profile.id);
  const { data, error } = await query;
  databaseError(error);
  const rows = (data || []) as Classroom[];
  if (profile.role === 'teacher' && rows.length) {
    const { data: codes, error: codeError } = await supabase
      .from('classroom_invites')
      .select('class_id,code')
      .in(
        'class_id',
        rows.map((row) => row.id),
      );
    databaseError(codeError);
    rows.forEach((row) => {
      row.invite_code = codes?.find((code) => code.class_id === row.id)?.code;
    });
  }
  return pageResult(rows, page);
}
export async function getClassroom(
  context: AuthContext,
  classId: string,
  page: number,
): Promise<ClassroomDetail> {
  requireRole(context, 'teacher');
  const { supabase, profile } = context;
  const { data: classroom, error: classError } = await supabase
    .from('classrooms')
    .select(classFields)
    .eq('id', classId)
    .eq('teacher_id', profile.id)
    .maybeSingle();
  databaseError(classError);
  if (!classroom) throw new AppError(404, 'NOT_FOUND', 'Turma não encontrada.');
  const [
    { data: memberRows, error: memberError },
    { data: invite, error: inviteError },
    { data: sessions, error: sessionError },
  ] = await Promise.all([
    supabase
      .from('memberships')
      .select('class_id,student_id,joined_at')
      .eq('class_id', classId)
      .order('joined_at')
      .order('student_id')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    supabase.from('classroom_invites').select('code').eq('class_id', classId).single(),
    supabase
      .from('lesson_sessions')
      .select(sessionFields)
      .eq('class_id', classId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(PAGE_SIZE),
  ]);
  databaseError(memberError);
  databaseError(inviteError);
  databaseError(sessionError);
  const members = (memberRows || []).slice(0, PAGE_SIZE) as Membership[];
  const ids = members.map((member) => member.student_id);
  let progress: Progress[] = [];
  let feedback: Feedback[] = [];
  if (ids.length) {
    const [profiles, progresses, feedbacks] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,display_name,role,timezone')
        .in('id', ids)
        .limit(PAGE_SIZE),
      supabase
        .from('lesson_progress')
        .select(progressFields)
        .in('student_id', ids)
        .limit(PAGE_SIZE * 39),
      supabase
        .from('feedback')
        .select(feedbackFields)
        .eq('class_id', classId)
        .in('student_id', ids)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
    ]);
    databaseError(profiles.error);
    databaseError(progresses.error);
    databaseError(feedbacks.error);
    members.forEach((member) => {
      member.profile = profiles.data?.find((row) => row.id === member.student_id) as
        Profile | undefined;
    });
    progress = (progresses.data || []) as Progress[];
    feedback = (feedbacks.data || []) as Feedback[];
  }
  return {
    classroom: { ...classroom, invite_code: invite?.code } as Classroom,
    members,
    progress,
    feedback,
    sessions: (sessions || []) as LessonSession[],
    page,
    hasMore: (memberRows?.length || 0) > PAGE_SIZE,
  };
}
export async function listFeedback({ supabase, profile }: AuthContext, page: number) {
  let query = supabase
    .from('feedback')
    .select(feedbackFields)
    .order('created_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  query =
    profile.role === 'student'
      ? query.eq('student_id', profile.id)
      : query.eq('teacher_id', profile.id);
  const { data, error } = await query;
  databaseError(error);
  return pageResult((data || []) as Feedback[], page);
}
export async function listSessions({ supabase }: AuthContext, page: number) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .select(sessionFields)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  databaseError(error);
  return pageResult((data || []) as LessonSession[], page);
}

export async function listStudentPractice(
  context: AuthContext,
  classId: string,
  studentId: string,
  page: number,
): Promise<Page<Practice>> {
  requireRole(context, 'teacher');
  const { supabase, profile } = context;
  const { data: classroom, error: classError } = await supabase
    .from('classrooms')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', profile.id)
    .maybeSingle();
  databaseError(classError);
  if (!classroom) throw new AppError(404, 'NOT_FOUND', 'Turma não encontrada.');
  const { data: membership, error: memberError } = await supabase
    .from('memberships')
    .select('student_id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .maybeSingle();
  databaseError(memberError);
  if (!membership) throw new AppError(404, 'NOT_FOUND', 'Aluno não encontrado nesta turma.');
  const { data, error } = await supabase
    .from('practice_logs')
    .select('id,student_id,lesson_id,minutes,bpm,notes,practiced_at')
    .eq('student_id', studentId)
    .order('practiced_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  databaseError(error);
  return pageResult((data || []) as Practice[], page);
}
