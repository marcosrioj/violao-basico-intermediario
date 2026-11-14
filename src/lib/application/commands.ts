import 'server-only';
import { z } from 'zod';
import { requireRole, type AuthContext } from '@/lib/auth';
import { AppError, databaseError } from '@/lib/errors';
import {
  classroomInput,
  feedbackInput,
  joinInput,
  practiceInput,
  profileInput,
  progressInput,
  sessionInput,
} from '@/lib/validation';
import type {
  Classroom,
  Feedback,
  LessonSession,
  Practice,
  Profile,
  Progress,
} from '@/lib/contracts';
export async function updateProfile(
  { supabase, profile }: AuthContext,
  command: z.infer<typeof profileInput>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: command.displayName, timezone: command.timezone })
    .eq('id', profile.id)
    .select('id,display_name,role,timezone')
    .single();
  databaseError(error);
  return data as Profile;
}
export async function saveProgress(
  { supabase, profile }: AuthContext,
  command: z.infer<typeof progressInput>,
) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        student_id: profile.id,
        lesson_id: command.lessonId,
        status: command.status,
        notes: command.notes,
        confidence: command.confidence,
      },
      { onConflict: 'student_id,lesson_id' },
    )
    .select('student_id,lesson_id,status,notes,confidence,updated_at')
    .single();
  databaseError(error);
  return data as Progress;
}
export async function logPractice(
  { supabase, profile }: AuthContext,
  command: z.infer<typeof practiceInput>,
) {
  const record = {
    id: command.id || crypto.randomUUID(),
    student_id: profile.id,
    lesson_id: command.lessonId,
    minutes: command.minutes,
    bpm: command.bpm || null,
    notes: command.notes,
  };
  const { data, error } = await supabase
    .from('practice_logs')
    .insert(record)
    .select('id,student_id,lesson_id,minutes,bpm,notes,practiced_at')
    .single();
  if (error?.code === '23505' && command.id) {
    const { data: existing, error: readError } = await supabase
      .from('practice_logs')
      .select('id,student_id,lesson_id,minutes,bpm,notes,practiced_at')
      .eq('id', command.id)
      .eq('student_id', profile.id)
      .maybeSingle();
    databaseError(readError);
    if (
      existing &&
      existing.lesson_id === record.lesson_id &&
      existing.minutes === record.minutes &&
      existing.bpm === record.bpm &&
      existing.notes === record.notes
    )
      return existing as Practice;
  }
  databaseError(error);
  return data as Practice;
}
export async function createClassroom(
  context: AuthContext,
  command: z.infer<typeof classroomInput>,
) {
  requireRole(context, 'teacher');
  const { data: id, error } = await context.supabase.rpc('create_classroom', {
    class_name: command.name,
  });
  databaseError(error);
  const [{ data: row, error: readError }, { data: invite, error: inviteError }] = await Promise.all(
    [
      context.supabase
        .from('classrooms')
        .select('id,teacher_id,name,created_at')
        .eq('id', id)
        .single(),
      context.supabase.from('classroom_invites').select('code').eq('class_id', id).single(),
    ],
  );
  databaseError(readError);
  databaseError(inviteError);
  return { ...row, invite_code: invite?.code } as Classroom;
}
export async function joinClassroom(context: AuthContext, command: z.infer<typeof joinInput>) {
  requireRole(context, 'student');
  const { data, error } = await context.supabase.rpc('join_classroom', {
    invite_code: command.code,
  });
  databaseError(error);
  if (!data)
    throw new AppError(
      400,
      'INVALID_INVITE',
      'Código inválido ou limite de tentativas atingido. Confira o código com o professor e aguarde 15 minutos se necessário.',
    );
  return { classId: data as string };
}
export async function giveFeedback(context: AuthContext, command: z.infer<typeof feedbackInput>) {
  requireRole(context, 'teacher');
  const { data, error } = await context.supabase
    .from('feedback')
    .insert({
      class_id: command.classId,
      student_id: command.studentId,
      teacher_id: context.profile.id,
      lesson_id: command.lessonId,
      body: command.body,
      validated: command.validated,
    })
    .select('id,class_id,student_id,teacher_id,lesson_id,body,validated,created_at')
    .single();
  databaseError(error);
  return data as Feedback;
}
export async function scheduleSession(context: AuthContext, command: z.infer<typeof sessionInput>) {
  requireRole(context, 'teacher');
  const { data, error } = await context.supabase
    .from('lesson_sessions')
    .insert({
      class_id: command.classId,
      lesson_id: command.lessonId,
      starts_at: command.startsAt,
      title: command.title,
      meeting_url: command.meetingUrl || null,
    })
    .select('id,class_id,lesson_id,starts_at,title,meeting_url,created_at')
    .single();
  databaseError(error);
  return data as LessonSession;
}
export async function cancelSession(context: AuthContext, sessionId: string) {
  requireRole(context, 'teacher');
  const { data, error } = await context.supabase
    .from('lesson_sessions')
    .delete()
    .eq('id', sessionId)
    .select('id');
  databaseError(error);
  if (!data?.length) throw new AppError(404, 'NOT_FOUND', 'Encontro não encontrado.');
  return { deleted: true };
}
export async function removeMembership(context: AuthContext, classId: string, studentId: string) {
  const { data, error } = await context.supabase
    .from('memberships')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .select('class_id');
  databaseError(error);
  if (!data?.length) throw new AppError(404, 'NOT_FOUND', 'Matrícula não encontrada.');
  return { deleted: true };
}
