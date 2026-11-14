export type Role = 'student' | 'teacher';
export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  timezone: string;
}
export interface Progress {
  student_id: string;
  lesson_id: string;
  status: 'in_progress' | 'completed';
  notes: string;
  confidence: number;
  updated_at: string;
}
export interface Practice {
  id: string;
  student_id: string;
  lesson_id: string;
  minutes: number;
  bpm: number | null;
  notes: string;
  practiced_at: string;
}
export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
  invite_code?: string;
}
export interface Membership {
  class_id: string;
  student_id: string;
  joined_at: string;
  profile?: Profile;
}
export interface Feedback {
  id: string;
  class_id: string;
  student_id: string;
  teacher_id: string;
  lesson_id: string;
  body: string;
  validated: boolean;
  created_at: string;
}
export interface LessonSession {
  id: string;
  class_id: string;
  lesson_id: string;
  starts_at: string;
  title: string;
  meeting_url: string | null;
  created_at: string;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}
export interface ClassroomDetail {
  classroom: Classroom;
  members: Membership[];
  progress: Progress[];
  feedback: Feedback[];
  sessions: LessonSession[];
  page: number;
  hasMore: boolean;
}
export interface ApiErrorBody {
  error: { code: string; message: string; requestId: string };
}
export type ApiResponse<T> = { data: T } | ApiErrorBody;
