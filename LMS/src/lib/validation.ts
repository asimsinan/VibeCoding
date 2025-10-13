import { z } from 'zod';
import { NextRequest } from 'next/server';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');
export const urlSchema = z.string().url('Please enter a valid URL');
export const dateSchema = z.string().datetime('Please enter a valid date');
export const numberSchema = z.number().min(0, 'Number must be positive');
export const percentageSchema = z.number().min(0).max(100, 'Percentage must be between 0 and 100');

// Validation middleware for API routes
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T, authContext?: any) => Promise<Response>
) {
  return async (request: NextRequest, authContext?: any): Promise<Response> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return await handler(request, validatedData, authContext);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        error: 'Invalid request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

// Form validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Common form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  organizationId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Course form schemas
export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  instructorId: z.string().min(1, 'Instructor is required'),
  organizationId: z.string().min(1, 'Organization is required'),
});

export const moduleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  courseId: z.string().min(1, 'Course is required'),
  order: numberSchema,
});

export const lessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  moduleId: z.string().min(1, 'Module is required'),
  order: numberSchema,
  duration: numberSchema.optional(),
  videoUrl: urlSchema.optional(),
  attachments: z.array(z.string()).optional(),
});

// Quiz form schemas
export const quizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  courseId: z.string().min(1, 'Course is required'),
  timeLimit: numberSchema.optional(),
  maxAttempts: numberSchema.optional(),
  passingScore: percentageSchema.optional(),
});

export const questionSchema = z.object({
  text: z.string().min(10, 'Question text must be at least 10 characters'),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  points: numberSchema,
  explanation: z.string().optional(),
});

export const quizAttemptSchema = z.object({
  quizId: z.string().min(1, 'Quiz is required'),
  answers: z.record(z.string()),
});

// User form schemas
export const userSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']),
  organizationId: z.string().min(1, 'Organization is required'),
  phone: phoneSchema.optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

// Organization form schemas
export const organizationSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters'),
  domain: z.string().min(3, 'Domain must be at least 3 characters'),
  description: z.string().optional(),
  website: urlSchema.optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: phoneSchema.optional(),
});

// Progress form schemas
export const progressSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  courseId: z.string().min(1, 'Course is required'),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  completed: z.boolean(),
  progressPercentage: percentageSchema,
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO']),
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['COURSE', 'USER', 'QUIZ', 'ALL']).optional(),
  filters: z.record(z.any()).optional(),
  page: numberSchema.optional(),
  limit: numberSchema.optional(),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type ModuleFormData = z.infer<typeof moduleSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type QuizFormData = z.infer<typeof quizSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type QuizAttemptFormData = z.infer<typeof quizAttemptSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type ProgressFormData = z.infer<typeof progressSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;

// Data Validation Service
export class DataValidationService {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } {
    return validateForm(schema, data);
  }

  static validateSearchQuery(query: unknown): { success: boolean; data?: SearchFormData; errors?: Record<string, string> } {
    return validateForm(searchSchema, query);
  }

  static validateCourseData(data: unknown): { success: boolean; data?: CourseFormData; errors?: Record<string, string> } {
    return validateForm(courseSchema, data);
  }

  static validateUserData(data: unknown): { success: boolean; data?: UserFormData; errors?: Record<string, string> } {
    return validateForm(userSchema, data);
  }

  static validateQuizData(data: unknown): { success: boolean; data?: QuizFormData; errors?: Record<string, string> } {
    return validateForm(quizSchema, data);
  }

  static validateOrganizationData(data: unknown): { success: boolean; data?: OrganizationFormData; errors?: Record<string, string> } {
    return validateForm(organizationSchema, data);
  }

  static validatePagination(page?: string | number | null, pageSize?: string | number | null): { page: number; pageSize: number } {
    const validPage = page ? Math.max(1, typeof page === 'string' ? parseInt(page, 10) : page) : 1;
    const validPageSize = pageSize ? Math.min(100, Math.max(1, typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize)) : 10;
    return { page: validPage, pageSize: validPageSize };
  }
}