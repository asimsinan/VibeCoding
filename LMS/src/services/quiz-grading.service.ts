import { PrismaClient, QuizAttempt, QuestionType, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export interface QuizSubmission {
  questionId: string;
  answer: string | boolean | string[];
}

export interface GradingResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionResults: Array<{
    questionId: string;
    correct: boolean;
    userAnswer: string | boolean | string[];
    correctAnswer: string | boolean | string[];
    explanation?: string;
  }>;
  feedback: string;
  passed: boolean;
}

export class QuizGradingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submit quiz attempt and get automatic grading
   * @param quizId - Quiz ID
   * @param userId - User ID
   * @param submissions - Array of question submissions
   * @param submittedBy - User ID who submitted the quiz
   * @returns Grading result
   */
  async submitQuizAttempt(
    quizId: string,
    userId: string,
    submissions: QuizSubmission[],
    submittedBy: string
  ): Promise<GradingResult> {
    try {
      logger.info('Submitting quiz attempt', { quizId, userId, submittedBy });

      // Verify the user exists and get their organization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: true, 
          organizationId: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify the quiz exists and get its organization
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    include: {
                      organization: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      // Verify submission permissions
      const submitter = await this.prisma.user.findUnique({
        where: { id: submittedBy },
        select: { id: true, role: true, organizationId: true },
      });

      if (!submitter) {
        throw new ForbiddenError('Submitter not found');
      }

      // Check permissions: Users can only submit quizzes from their organization
      if (
        submitter.role !== 'ADMIN' &&
        submitter.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to submit this quiz');
      }

      // Users can only submit quizzes for users from their organization
      if (
        submitter.role !== 'ADMIN' &&
        submitter.organizationId !== user.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to submit quiz for this user');
      }

      // Students can only submit quizzes for themselves
      if (submitter.role === 'STUDENT' && submitter.id !== userId) {
        throw new ForbiddenError('Students can only submit quizzes for themselves');
      }

      // Check if user is enrolled in the course
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: quiz.lesson.module.course.id,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        throw new ValidationError('User must be enrolled in the course to take quizzes', {
          enrollment: ['User must be enrolled in the course to take quizzes'],
        });
      }

      // Check attempt limits
      const existingAttempts = await this.prisma.quizAttempt.count({
        where: {
          userId: userId,
          quizId: quizId,
        },
      });

      // Check if user has exceeded maximum attempts (if maxAttempts is set)
      // Note: maxAttempts field not currently in schema, so skipping this check
      // if (quiz.maxAttempts && existingAttempts >= quiz.maxAttempts) {
      //   throw new ValidationError('Maximum attempts exceeded', {
      //     attempts: [`Maximum ${quiz.maxAttempts} attempts allowed`],
      //   });
      // }

      // Validate submissions
      this.validateSubmissions(submissions, quiz.questions);

      // Grade the quiz (using default passing score of 70% since not in schema)
      const gradingResult = await this.gradeQuiz(submissions, quiz.questions, 70);

      // Create quiz attempt record
      const attempt = await this.prisma.quizAttempt.create({
        data: {
          userId: userId,
          quizId: quizId,
          score: gradingResult.score,
          answers: submissions as any,
          submittedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          quiz: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const result: GradingResult = {
        attemptId: attempt.id,
        score: gradingResult.score,
        totalQuestions: gradingResult.totalQuestions,
        correctAnswers: gradingResult.correctAnswers,
        incorrectAnswers: gradingResult.incorrectAnswers,
        questionResults: gradingResult.questionResults,
        feedback: gradingResult.feedback,
        passed: gradingResult.passed,
      };

      logger.info('Quiz attempt submitted and graded successfully', { 
        attemptId: attempt.id,
        quizId,
        userId,
        score: gradingResult.score,
        passed: gradingResult.passed
      });

      return result;
    } catch (error) {
      logger.error('Failed to submit quiz attempt', { error, quizId, userId, submittedBy });
      throw error;
    }
  }

  /**
   * Get quiz attempt by ID
   * @param attemptId - Attempt ID
   * @param requesterId - User ID requesting the attempt
   * @returns Quiz attempt data
   */
  async getQuizAttemptById(attemptId: string, requesterId: string): Promise<QuizAttempt> {
    try {
      logger.info('Fetching quiz attempt by ID', { attemptId, requesterId });

      const attempt = await this.prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          quiz: {
            select: {
              id: true,
              title: true,
              lesson: {
                select: {
                  id: true,
                  title: true,
                  module: {
                    select: {
                      id: true,
                      title: true,
                      course: {
                        select: {
                          id: true,
                          title: true,
                          organizationId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        throw new NotFoundError('Quiz attempt not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view attempts from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== attempt.quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this quiz attempt');
      }

      // Students can only view their own attempts
      if (
        requester.role === 'STUDENT' &&
        requester.id !== attempt.userId
      ) {
        throw new ForbiddenError('Students can only view their own quiz attempts');
      }

      logger.info('Quiz attempt fetched successfully', { 
        attemptId,
        requesterId 
      });

      return attempt;
    } catch (error) {
      logger.error('Failed to fetch quiz attempt', { error, attemptId, requesterId });
      throw error;
    }
  }

  /**
   * Get all attempts for a quiz
   * @param quizId - Quiz ID
   * @param requesterId - User ID requesting the attempts
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated quiz attempts
   */
  async getQuizAttempts(
    quizId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: QuizAttempt[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching quiz attempts', { quizId, requesterId, page, pageSize });

      // Verify quiz exists and get organization
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: { id: true, organizationId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view attempts from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view attempts for this quiz');
      }

      const skip = (page - 1) * pageSize;

      const [attempts, total] = await Promise.all([
        this.prisma.quizAttempt.findMany({
          where: { quizId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            quiz: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.quizAttempt.count({
          where: { quizId },
        }),
      ]);

      const result = {
        data: attempts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('Quiz attempts fetched successfully', { 
        quizId,
        requesterId,
        count: attempts.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch quiz attempts', { error, quizId, requesterId });
      throw error;
    }
  }

  /**
   * Get all attempts for a user
   * @param userId - User ID
   * @param requesterId - User ID requesting the attempts
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated quiz attempts
   */
  async getUserQuizAttempts(
    userId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: QuizAttempt[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching user quiz attempts', { userId, requesterId, page, pageSize });

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Students can only view their own attempts
      if (requester.role === 'STUDENT' && requester.id !== userId) {
        throw new ForbiddenError('Students can only view their own quiz attempts');
      }

      // Users can only view attempts from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== user.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view attempts for this user');
      }

      const skip = (page - 1) * pageSize;

      const [attempts, total] = await Promise.all([
        this.prisma.quizAttempt.findMany({
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            quiz: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.quizAttempt.count({
          where: { userId },
        }),
      ]);

      const result = {
        data: attempts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('User quiz attempts fetched successfully', { 
        userId,
        requesterId,
        count: attempts.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch user quiz attempts', { error, userId, requesterId });
      throw error;
    }
  }

  /**
   * Grade quiz submissions against questions
   * @param submissions - User submissions
   * @param questions - Quiz questions
   * @param passingScore - Passing score percentage
   * @returns Grading result
   */
  private async gradeQuiz(
    submissions: QuizSubmission[],
    questions: any[],
    passingScore: number = 70
  ): Promise<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    questionResults: Array<{
      questionId: string;
      correct: boolean;
      userAnswer: string | boolean | string[];
      correctAnswer: string | boolean | string[];
      explanation?: string;
    }>;
    feedback: string;
    passed: boolean;
  }> {
    const questionResults: Array<{
      questionId: string;
      correct: boolean;
      userAnswer: string | boolean | string[];
      correctAnswer: string | boolean | string[];
      explanation?: string;
    }> = [];

    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // Create a map of submissions for quick lookup
    const submissionMap = new Map(
      submissions.map(sub => [sub.questionId, sub.answer])
    );

    // Grade each question
    for (const question of questions) {
      const userAnswer = submissionMap.get(question.id);
      const isCorrect = this.gradeQuestion(question, userAnswer);
      
      questionResults.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer: userAnswer || '',
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    }

    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = score >= passingScore;

    // Generate feedback
    const feedback = this.generateFeedback(score, correctAnswers, totalQuestions, passed);

    return {
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      questionResults,
      feedback,
      passed,
    };
  }

  /**
   * Grade a single question
   * @param question - Question data
   * @param userAnswer - User's answer
   * @returns Whether the answer is correct
   */
  private gradeQuestion(question: any, userAnswer: any): boolean {
    if (userAnswer === undefined || userAnswer === null) {
      return false;
    }

    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return userAnswer === question.correctAnswer;

      case QuestionType.TRUE_FALSE:
        return userAnswer === question.correctAnswer;

      case QuestionType.SHORT_ANSWER:
        // Case-insensitive comparison for short answers
        return typeof userAnswer === 'string' && 
               typeof question.correctAnswer === 'string' &&
               userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

      case QuestionType.ESSAY:
        // Essay questions are not automatically graded
        return true;

      default:
        return false;
    }
  }

  /**
   * Generate feedback based on quiz performance
   * @param score - Quiz score
   * @param correctAnswers - Number of correct answers
   * @param totalQuestions - Total number of questions
   * @param passed - Whether the quiz was passed
   * @returns Feedback message
   */
  private generateFeedback(
    score: number,
    correctAnswers: number,
    totalQuestions: number,
    passed: boolean
  ): string {
    if (passed) {
      if (score === 100) {
        return `Excellent! You got all ${totalQuestions} questions correct. Perfect score!`;
      } else if (score >= 90) {
        return `Great job! You scored ${score}% (${correctAnswers}/${totalQuestions} correct). Outstanding performance!`;
      } else if (score >= 80) {
        return `Good work! You scored ${score}% (${correctAnswers}/${totalQuestions} correct). Well done!`;
      } else {
        return `Congratulations! You passed with a score of ${score}% (${correctAnswers}/${totalQuestions} correct).`;
      }
    } else {
      if (score >= 60) {
        return `You scored ${score}% (${correctAnswers}/${totalQuestions} correct). You're close to passing! Review the material and try again.`;
      } else {
        return `You scored ${score}% (${correctAnswers}/${totalQuestions} correct). Consider reviewing the course material before attempting the quiz again.`;
      }
    }
  }

  /**
   * Validate quiz submissions
   * @param submissions - User submissions
   * @param questions - Quiz questions
   */
  private validateSubmissions(submissions: QuizSubmission[], questions: any[]): void {
    const questionIds = new Set(questions.map(q => q.id));
    const submissionQuestionIds = new Set(submissions.map(s => s.questionId));

    // Check for invalid question IDs
    for (const submission of submissions) {
      if (!questionIds.has(submission.questionId)) {
        throw new ValidationError(`Invalid question ID: ${submission.questionId}`, {
          submissions: [`Question ID ${submission.questionId} does not exist in this quiz`],
        });
      }
    }

    // Check for missing required questions
    const missingQuestions = questions.filter(q => !submissionQuestionIds.has(q.id));
    if (missingQuestions.length > 0) {
      throw new ValidationError('Missing required questions', {
        submissions: [`Missing answers for questions: ${missingQuestions.map(q => q.id).join(', ')}`],
      });
    }

    // Check for duplicate submissions
    const duplicateQuestions = submissions.filter(
      (sub, index) => submissions.findIndex(s => s.questionId === sub.questionId) !== index
    );
    if (duplicateQuestions.length > 0) {
      throw new ValidationError('Duplicate question submissions', {
        submissions: [`Duplicate submissions for questions: ${duplicateQuestions.map(q => q.questionId).join(', ')}`],
      });
    }
  }
}

// Export singleton instance
export const quizGradingService = new QuizGradingService(
  require('../lib/database').db
);
