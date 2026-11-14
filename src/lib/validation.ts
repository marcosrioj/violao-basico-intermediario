import { z } from 'zod';
export const lessonId = z.string().regex(/^m(?:[1-9]|1[0-3])-a[1-3]$/, 'Aula inválida.');
export const uuid = z.string().uuid();
export const pagination = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) });
export const progressInput = z
  .object({
    lessonId,
    status: z.enum(['in_progress', 'completed']),
    notes: z.string().trim().max(2000).default(''),
    confidence: z.number().int().min(1).max(5).default(3),
  })
  .strict();
export const practiceInput = z
  .object({
    id: uuid.optional(),
    lessonId,
    minutes: z.number().int().min(1).max(240),
    bpm: z.number().int().min(30).max(240).nullable().optional(),
    notes: z.string().trim().max(2000).default(''),
  })
  .strict();
export const classroomInput = z.object({ name: z.string().trim().min(3).max(100) }).strict();
export const joinInput = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-F0-9]{12}$/),
  })
  .strict();
export const profileInput = z
  .object({
    displayName: z.string().trim().min(1).max(100),
    timezone: z
      .string()
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('pt-BR', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Fuso horário inválido.'),
  })
  .strict();
export const feedbackInput = z
  .object({
    classId: uuid,
    studentId: uuid,
    lessonId,
    body: z.string().trim().min(3).max(4000),
    validated: z.boolean().default(false),
  })
  .strict();
export const sessionInput = z
  .object({
    classId: uuid,
    lessonId,
    startsAt: z.string().datetime({ offset: true }),
    title: z.string().trim().min(3).max(140),
    meetingUrl: z
      .string()
      .url()
      .max(1000)
      .refine((v) => new URL(v).protocol === 'https:', 'Use um link HTTPS.')
      .nullable()
      .optional(),
  })
  .strict();
export function safeRedirect(value: string | null, fallback = '/painel') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value))
    return fallback;
  return value;
}
