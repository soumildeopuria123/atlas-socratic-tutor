export type LayerStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'PASSED';
export type Tier = 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';

export interface User {
  id: string;
  username: string;
  credits: number;
  createdAt?: string;
}

export interface CourseModule {
  id: string;
  layer: number;
  title: string;
  tier: Tier;
  minutes: number;
  objective?: string | null;
  status: LayerStatus;
  bestScore: number | null;
  attempts: number;
  retestEligible: boolean;
  passedAt?: string | null;
}

export interface Course {
  id?: string;
  slug: string;
  title: string;
  discipline: string;
  level: string;
  summary: string;
  icon?: string;
  layerCount: number;
  enrolled: boolean;
  completed?: boolean;
  passedLayers?: number;
  averageScore?: number | null;
  modules: CourseModule[];
}

export interface DashboardStats {
  enrollments: number;
  passedModules: number;
  totalModules: number;
  averageScore: number | null;
  dueCards: number;
  activeRetests: number;
}

export interface RecentAttempt {
  id: string;
  courseSlug: string;
  courseTitle: string;
  layer: number;
  title: string;
  percent: number;
  passed: boolean;
  flagged: boolean;
  submittedAt: string | null;
}

export interface DashboardData {
  user: User;
  credits: number;
  stats: DashboardStats;
  courses: Course[];
  recentAttempts: RecentAttempt[];
}

export interface Checkpoint {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface LessonPayload {
  markdown: string;
  checkpoint?: Checkpoint;
  socraticPrompt?: string | null;
  meta: {
    courseSlug: string;
    courseTitle: string;
    layer: number | null;
    title?: string;
    tier?: Tier;
    minutes?: number;
    mode?: string;
    totalLayers: number;
    engine?: string;
  };
}

export interface TutorReply {
  markdown: string;
  checkpoint?: Checkpoint;
  socraticPrompt?: string;
  meta: {
    courseSlug?: string;
    courseTitle?: string;
    layer?: number | null;
    mode?: string;
    engine?: string;
  };
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface Attempt {
  id: string;
  courseSlug: string;
  courseTitle: string;
  layer: number;
  title: string;
  tier: Tier;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
  passMark: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  retest?: boolean;
  infractions?: number;
}

export interface QuestionReview {
  id: string;
  prompt: string;
  options: string[];
  given: number | null;
  answer: number;
  isCorrect: boolean;
  explanation: string;
  concept: string | null;
}

export interface GradeResult {
  correct: number;
  total: number;
  score: number;
  percent: number;
  passed: boolean;
  missedConcepts: string[];
  review: QuestionReview[];
}

export interface SubmitResult {
  result: GradeResult;
  passed: boolean;
  terminated: boolean;
  overtime: boolean;
  remediation: LessonPayload | null;
  retestAvailable?: boolean;
  nextLayer?: { layer: number; title: string; unlocked: boolean } | null;
  courseComplete?: boolean;
  credits: number;
  message?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  courseSlug: string;
  courseTitle: string;
  layer: number | null;
  layerTitle: string | null;
}

export interface SrsPayload {
  due: Flashcard[];
  stats: { due: number; upcoming: number; total: number; mastered: number };
}
