import { z } from 'zod';

// TypeScript interfaces and Zod schemas for all data models
// These provide type safety and runtime validation for the LMS system

// Organization schemas
export const OrganizationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, 'Organization name is required'),
  domain: z.string().url().optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  domain: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

// User schemas
export const UserRoleSchema = z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']);

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email('Invalid email address'),
  name: z.string().optional().nullable(),
  role: UserRoleSchema,
  organizationId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  role: UserRoleSchema.default('STUDENT'),
  organizationId: z.string().cuid(),
});

export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// Course schemas
export const CourseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const CourseSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional().nullable(),
  status: CourseStatusSchema,
  organizationId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  status: CourseStatusSchema.default('DRAFT'),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: CourseStatusSchema.optional(),
});

// Module schemas
export const ModuleSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Module title is required'),
  order: z.number().int().min(0),
  courseId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  order: z.number().int().min(0),
  courseId: z.string().cuid(),
});

export const UpdateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});

// Lesson schemas
export const LessonTypeSchema = z.enum(['TEXT', 'VIDEO', 'IMAGE', 'DOCUMENT', 'INTERACTIVE']);

export const LessonSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Lesson title is required'),
  content: z.string().optional().nullable(),
  type: LessonTypeSchema,
  order: z.number().int().min(0),
  moduleId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateLessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
  content: z.string().optional(),
  type: LessonTypeSchema.default('TEXT'),
  order: z.number().int().min(0),
  moduleId: z.string().cuid(),
});

export const UpdateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: LessonTypeSchema.optional(),
  order: z.number().int().min(0).optional(),
});

// Quiz schemas
export const QuizSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Quiz title is required'),
  timeLimit: z.number().int().min(1).optional().nullable(),
  lessonId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateQuizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  timeLimit: z.number().int().min(1).optional(),
  lessonId: z.string().cuid(),
});

export const UpdateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  timeLimit: z.number().int().min(1).optional(),
});

// Question schemas
export const QuestionTypeSchema = z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']);

export const QuestionSchema = z.object({
  id: z.string().cuid(),
  text: z.string().min(1, 'Question text is required'),
  type: QuestionTypeSchema,
  options: z.record(z.any()).optional().nullable(),
  correctAnswer: z.record(z.any()).optional().nullable(),
  order: z.number().int().min(0),
  quizId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: QuestionTypeSchema,
  options: z.record(z.any()).optional(),
  correctAnswer: z.record(z.any()).optional(),
  order: z.number().int().min(0),
  quizId: z.string().cuid(),
});

export const UpdateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  type: QuestionTypeSchema.optional(),
  options: z.record(z.any()).optional(),
  correctAnswer: z.record(z.any()).optional(),
  order: z.number().int().min(0).optional(),
});

// Enrollment schemas
export const EnrollmentStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED']);

export const EnrollmentSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  courseId: z.string().cuid(),
  organizationId: z.string().cuid(),
  status: EnrollmentStatusSchema,
  enrolledAt: z.date(),
  completedAt: z.date().optional().nullable(),
});

export const CreateEnrollmentSchema = z.object({
  userId: z.string().cuid(),
  courseId: z.string().cuid(),
  organizationId: z.string().cuid(),
  status: EnrollmentStatusSchema.default('ACTIVE'),
});

export const UpdateEnrollmentSchema = z.object({
  status: EnrollmentStatusSchema.optional(),
  completedAt: z.date().optional(),
});

// Progress schemas
export const ProgressStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

export const ProgressSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  lessonId: z.string().cuid(),
  status: ProgressStatusSchema,
  completedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProgressSchema = z.object({
  userId: z.string().cuid(),
  lessonId: z.string().cuid(),
  status: ProgressStatusSchema.default('NOT_STARTED'),
});

export const UpdateProgressSchema = z.object({
  status: ProgressStatusSchema.optional(),
  completedAt: z.date().optional(),
});

// Quiz Attempt schemas
export const QuizAttemptSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  quizId: z.string().cuid(),
  answers: z.record(z.any()),
  score: z.number().min(0).max(100).optional().nullable(),
  submittedAt: z.date(),
});

export const CreateQuizAttemptSchema = z.object({
  userId: z.string().cuid(),
  quizId: z.string().cuid(),
  answers: z.record(z.any()),
});

export const QuizSubmissionSchema = z.object({
  answers: z.record(z.any()),
});

// Dashboard schemas
export const DashboardStatsSchema = z.object({
  totalCourses: z.number().int().min(0),
  totalStudents: z.number().int().min(0),
  totalInstructors: z.number().int().min(0),
  activeEnrollments: z.number().int().min(0),
  completedCourses: z.number().int().min(0),
  averageCompletionRate: z.number().min(0).max(100),
  recentActivity: z.array(z.object({
    type: z.string(),
    description: z.string(),
    timestamp: z.date(),
  })),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  data: z.any(),
  message: z.string(),
  status: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.string(),
});

// TypeScript type exports
export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export type Course = z.infer<typeof CourseSchema>;
export type CreateCourse = z.infer<typeof CreateCourseSchema>;
export type UpdateCourse = z.infer<typeof UpdateCourseSchema>;
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export type Module = z.infer<typeof ModuleSchema>;
export type CreateModule = z.infer<typeof CreateModuleSchema>;
export type UpdateModule = z.infer<typeof UpdateModuleSchema>;

export type Lesson = z.infer<typeof LessonSchema>;
export type CreateLesson = z.infer<typeof CreateLessonSchema>;
export type UpdateLesson = z.infer<typeof UpdateLessonSchema>;
export type LessonType = z.infer<typeof LessonTypeSchema>;

export type Quiz = z.infer<typeof QuizSchema>;
export type CreateQuiz = z.infer<typeof CreateQuizSchema>;
export type UpdateQuiz = z.infer<typeof UpdateQuizSchema>;

export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestion = z.infer<typeof UpdateQuestionSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type CreateEnrollment = z.infer<typeof CreateEnrollmentSchema>;
export type UpdateEnrollment = z.infer<typeof UpdateEnrollmentSchema>;
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

export type Progress = z.infer<typeof ProgressSchema>;
export type CreateProgress = z.infer<typeof CreateProgressSchema>;
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>;
export type ProgressStatus = z.infer<typeof ProgressStatusSchema>;

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
export type CreateQuizAttempt = z.infer<typeof CreateQuizAttemptSchema>;
export type QuizSubmission = z.infer<typeof QuizSubmissionSchema>;

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation helper functions
export const validateOrganization = (data: unknown) => OrganizationSchema.parse(data);
export const validateCreateOrganization = (data: unknown) => CreateOrganizationSchema.parse(data);
export const validateUpdateOrganization = (data: unknown) => UpdateOrganizationSchema.parse(data);

export const validateUser = (data: unknown) => UserSchema.parse(data);
export const validateCreateUser = (data: unknown) => CreateUserSchema.parse(data);
export const validateUpdateUser = (data: unknown) => UpdateUserSchema.parse(data);

export const validateCourse = (data: unknown) => CourseSchema.parse(data);
export const validateCreateCourse = (data: unknown) => CreateCourseSchema.parse(data);
export const validateUpdateCourse = (data: unknown) => UpdateCourseSchema.parse(data);

export const validateModule = (data: unknown) => ModuleSchema.parse(data);
export const validateCreateModule = (data: unknown) => CreateModuleSchema.parse(data);
export const validateUpdateModule = (data: unknown) => UpdateModuleSchema.parse(data);

export const validateLesson = (data: unknown) => LessonSchema.parse(data);
export const validateCreateLesson = (data: unknown) => CreateLessonSchema.parse(data);
export const validateUpdateLesson = (data: unknown) => UpdateLessonSchema.parse(data);

export const validateQuiz = (data: unknown) => QuizSchema.parse(data);
export const validateCreateQuiz = (data: unknown) => CreateQuizSchema.parse(data);
export const validateUpdateQuiz = (data: unknown) => UpdateQuizSchema.parse(data);

export const validateQuestion = (data: unknown) => QuestionSchema.parse(data);
export const validateCreateQuestion = (data: unknown) => CreateQuestionSchema.parse(data);
export const validateUpdateQuestion = (data: unknown) => UpdateQuestionSchema.parse(data);

export const validateEnrollment = (data: unknown) => EnrollmentSchema.parse(data);
export const validateCreateEnrollment = (data: unknown) => CreateEnrollmentSchema.parse(data);
export const validateUpdateEnrollment = (data: unknown) => UpdateEnrollmentSchema.parse(data);

export const validateProgress = (data: unknown) => ProgressSchema.parse(data);
export const validateCreateProgress = (data: unknown) => CreateProgressSchema.parse(data);
export const validateUpdateProgress = (data: unknown) => UpdateProgressSchema.parse(data);

export const validateQuizAttempt = (data: unknown) => QuizAttemptSchema.parse(data);
export const validateCreateQuizAttempt = (data: unknown) => CreateQuizAttemptSchema.parse(data);
export const validateQuizSubmission = (data: unknown) => QuizSubmissionSchema.parse(data);

export const validateDashboardStats = (data: unknown) => DashboardStatsSchema.parse(data);