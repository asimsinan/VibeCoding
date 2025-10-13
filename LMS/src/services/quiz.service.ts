import { PrismaClient, Quiz, Question, QuestionType, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export class QuizService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new quiz
   * @param data - Quiz creation data
   * @param createdBy - User ID who created the quiz
   * @returns Created quiz
   */
  async createQuiz(
    data: Prisma.QuizCreateInput,
    createdBy: string
  ): Promise<Quiz> {
    try {
      logger.info('Creating quiz', { data, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Only admins and instructors can create quizzes
      if (!['ADMIN', 'INSTRUCTOR'].includes(creator.role)) {
        throw new ForbiddenError('Only administrators and instructors can create quizzes');
      }

      // Verify lesson exists and user has access
      const lessonId = data.lesson.connect?.id;
      if (!lessonId) {
        throw new ValidationError('Lesson ID is required', {
          lesson: ['Lesson ID is required'],
        });
      }

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                select: { id: true, organizationId: true },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Check permissions
      if (
        creator.role !== 'ADMIN' &&
        creator.organizationId !== lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to create quizzes in this lesson');
      }

      // Check if lesson already has a quiz
      const existingQuiz = await this.prisma.quiz.findUnique({
        where: { lessonId: lesson.id },
      });

      if (existingQuiz) {
        throw new ValidationError('Lesson already has a quiz', {
          lesson: ['Each lesson can only have one quiz'],
        });
      }

      const quiz = await this.prisma.quiz.create({
        data: {
          ...data,
          timeLimit: data.timeLimit || 30, // Default 30 minutes
        },
        include: {
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
          questions: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });

      logger.info('Quiz created successfully', { 
        quizId: quiz.id,
        createdBy 
      });

      return quiz;
    } catch (error) {
      logger.error('Failed to create quiz', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get quiz by ID
   * @param id - Quiz ID
   * @param requesterId - User ID requesting the quiz
   * @returns Quiz data
   */
  async getQuizById(id: string, requesterId: string): Promise<Quiz> {
    try {
      logger.info('Fetching quiz by ID', { id, requesterId });

      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
        include: {
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
          questions: {
            orderBy: { order: 'asc' },
          },
          attempts: {
            select: {
              id: true,
              userId: true,
              score: true,
              submittedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { submittedAt: 'desc' },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
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
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view quizzes from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this quiz');
      }

      logger.info('Quiz fetched successfully', { 
        quizId: id,
        requesterId 
      });

      return quiz;
    } catch (error) {
      logger.error('Failed to fetch quiz', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Update quiz
   * @param id - Quiz ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated quiz
   */
  async updateQuiz(
    id: string,
    data: Prisma.QuizUpdateInput,
    updaterId: string
  ): Promise<Quiz> {
    try {
      logger.info('Updating quiz', { id, data, updaterId });

      // Check if quiz exists
      const existingQuiz = await this.prisma.quiz.findUnique({
        where: { id },
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

      if (!existingQuiz) {
        throw new NotFoundError('Quiz not found');
      }

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== existingQuiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this quiz');
      }

      // Only admins and instructors can update quizzes
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update quizzes');
      }

      const quiz = await this.prisma.quiz.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
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
          questions: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });

      logger.info('Quiz updated successfully', { 
        quizId: id,
        updaterId 
      });

      return quiz;
    } catch (error) {
      logger.error('Failed to update quiz', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete quiz
   * @param id - Quiz ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteQuiz(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting quiz', { id, deleterId });

      // Check if quiz exists
      const existingQuiz = await this.prisma.quiz.findUnique({
        where: { id },
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
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      });

      if (!existingQuiz) {
        throw new NotFoundError('Quiz not found');
      }

      // Verify deleter has permission
      const deleter = await this.prisma.user.findUnique({
        where: { id: deleterId },
        select: { role: true, organizationId: true },
      });

      if (!deleter) {
        throw new ForbiddenError('Deleter not found');
      }

      // Check permissions
      if (
        deleter.role !== 'ADMIN' &&
        deleter.organizationId !== existingQuiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this quiz');
      }

      // Only admins and instructors can delete quizzes
      if (!['ADMIN', 'INSTRUCTOR'].includes(deleter.role)) {
        throw new ForbiddenError('Only administrators and instructors can delete quizzes');
      }

      // Check if quiz has attempts
      if (existingQuiz._count.attempts > 0) {
        throw new ValidationError('Cannot delete quiz with existing attempts', {
          quiz: ['Quiz must have no attempts before deletion'],
        });
      }

      await this.prisma.quiz.delete({
        where: { id },
      });

      logger.info('Quiz deleted successfully', { 
        quizId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete quiz', { error, id, deleterId });
      throw error;
    }
  }

  // ==================== QUESTION MANAGEMENT ====================

  /**
   * Create a new question
   * @param data - Question creation data
   * @param createdBy - User ID who created the question
   * @returns Created question
   */
  async createQuestion(
    data: Prisma.QuestionCreateInput,
    createdBy: string
  ): Promise<Question> {
    try {
      logger.info('Creating question', { data, createdBy });

      // Verify creator has permission
      const creator = await this.prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true, organizationId: true },
      });

      if (!creator) {
        throw new ForbiddenError('Creator user not found');
      }

      // Only admins and instructors can create questions
      if (!['ADMIN', 'INSTRUCTOR'].includes(creator.role)) {
        throw new ForbiddenError('Only administrators and instructors can create questions');
      }

      // Verify quiz exists and user has access
      const quizId = data.quiz.connect?.id;
      if (!quizId) {
        throw new ValidationError('Quiz ID is required', {
          quiz: ['Quiz ID is required'],
        });
      }

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
      if (
        creator.role !== 'ADMIN' &&
        creator.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to create questions in this quiz');
      }

      // Get the next order number
      const lastQuestion = await this.prisma.question.findFirst({
        where: { quizId: quiz.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = (lastQuestion?.order || 0) + 1;

      // Validate question data based on type
      this.validateQuestionData(data);

      const question = await this.prisma.question.create({
        data: {
          ...data,
          order: data.order || nextOrder,
        },
      });

      logger.info('Question created successfully', { 
        questionId: question.id,
        createdBy 
      });

      return question;
    } catch (error) {
      logger.error('Failed to create question', { error, createdBy });
      throw error;
    }
  }

  /**
   * Get question by ID
   * @param id - Question ID
   * @param requesterId - User ID requesting the question
   * @returns Question data
   */
  async getQuestionById(id: string, requesterId: string): Promise<Question> {
    try {
      logger.info('Fetching question by ID', { id, requesterId });

      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          quiz: {
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
          },
        },
      });

      if (!question) {
        throw new NotFoundError('Question not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view questions from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== question.quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this question');
      }

      logger.info('Question fetched successfully', { 
        questionId: id,
        requesterId 
      });

      return question;
    } catch (error) {
      logger.error('Failed to fetch question', { error, id, requesterId });
      throw error;
    }
  }

  /**
   * Update question
   * @param id - Question ID
   * @param data - Update data
   * @param updaterId - User ID performing the update
   * @returns Updated question
   */
  async updateQuestion(
    id: string,
    data: Prisma.QuestionUpdateInput,
    updaterId: string
  ): Promise<Question> {
    try {
      logger.info('Updating question', { id, data, updaterId });

      // Check if question exists
      const existingQuestion = await this.prisma.question.findUnique({
        where: { id },
        include: {
          quiz: {
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
          },
        },
      });

      if (!existingQuestion) {
        throw new NotFoundError('Question not found');
      }

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Check permissions
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== existingQuestion.quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to update this question');
      }

      // Only admins and instructors can update questions
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can update questions');
      }

      // Validate question data if type is being updated
      if (data.type) {
        this.validateQuestionData({ ...existingQuestion, ...data });
      }

      const question = await this.prisma.question.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info('Question updated successfully', { 
        questionId: id,
        updaterId 
      });

      return question;
    } catch (error) {
      logger.error('Failed to update question', { error, id, updaterId });
      throw error;
    }
  }

  /**
   * Delete question
   * @param id - Question ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteQuestion(id: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting question', { id, deleterId });

      // Check if question exists
      const existingQuestion = await this.prisma.question.findUnique({
        where: { id },
        include: {
          quiz: {
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
          },
        },
      });

      if (!existingQuestion) {
        throw new NotFoundError('Question not found');
      }

      // Verify deleter has permission
      const deleter = await this.prisma.user.findUnique({
        where: { id: deleterId },
        select: { role: true, organizationId: true },
      });

      if (!deleter) {
        throw new ForbiddenError('Deleter not found');
      }

      // Check permissions
      if (
        deleter.role !== 'ADMIN' &&
        deleter.organizationId !== existingQuestion.quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this question');
      }

      // Only admins and instructors can delete questions
      if (!['ADMIN', 'INSTRUCTOR'].includes(deleter.role)) {
        throw new ForbiddenError('Only administrators and instructors can delete questions');
      }

      await this.prisma.question.delete({
        where: { id },
      });

      logger.info('Question deleted successfully', { 
        questionId: id,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete question', { error, id, deleterId });
      throw error;
    }
  }

  /**
   * Reorder questions
   * @param quizId - Quiz ID
   * @param questionOrders - Array of question IDs in new order
   * @param updaterId - User ID performing the reorder
   * @returns Success status
   */
  async reorderQuestions(
    quizId: string,
    questionOrders: string[],
    updaterId: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info('Reordering questions', { quizId, questionOrders, updaterId });

      // Verify updater has permission
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { role: true, organizationId: true },
      });

      if (!updater) {
        throw new ForbiddenError('Updater not found');
      }

      // Verify quiz exists and user has access
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
      if (
        updater.role !== 'ADMIN' &&
        updater.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to reorder questions in this quiz');
      }

      // Only admins and instructors can reorder questions
      if (!['ADMIN', 'INSTRUCTOR'].includes(updater.role)) {
        throw new ForbiddenError('Only administrators and instructors can reorder questions');
      }

      // Update question orders
      await this.prisma.$transaction(
        questionOrders.map((questionId, index) =>
          this.prisma.question.update({
            where: { id: questionId },
            data: { order: index + 1 },
          })
        )
      );

      logger.info('Questions reordered successfully', { 
        quizId,
        updaterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to reorder questions', { error, quizId, updaterId });
      throw error;
    }
  }

  /**
   * Validate question data based on type
   * @param data - Question data
   */
  private validateQuestionData(data: Prisma.QuestionCreateInput | any): void {
    const type = data.type;
    const options = data.options;
    const correctAnswer = data.correctAnswer;

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!options || !Array.isArray(options) || options.length < 2) {
          throw new ValidationError('Multiple choice questions must have at least 2 options', {
            options: ['Multiple choice questions must have at least 2 options'],
          });
        }
        if (!correctAnswer) {
          throw new ValidationError('Multiple choice questions must have a correct answer', {
            correctAnswer: ['Multiple choice questions must have a correct answer'],
          });
        }
        break;

      case QuestionType.TRUE_FALSE:
        if (correctAnswer !== true && correctAnswer !== false) {
          throw new ValidationError('True/false questions must have a boolean correct answer', {
            correctAnswer: ['True/false questions must have a boolean correct answer'],
          });
        }
        break;

      case QuestionType.SHORT_ANSWER:
        if (!correctAnswer || typeof correctAnswer !== 'string') {
          throw new ValidationError('Short answer questions must have a string correct answer', {
            correctAnswer: ['Short answer questions must have a string correct answer'],
          });
        }
        break;

      case QuestionType.ESSAY:
        // Essay questions don't need options or correct answers
        break;

      default:
        throw new ValidationError('Invalid question type', {
          type: ['Invalid question type'],
        });
    }
  }

  /**
   * Get quiz statistics
   * @param id - Quiz ID
   * @param requesterId - User ID requesting statistics
   * @returns Quiz statistics
   */
  async getQuizStats(id: string, requesterId: string): Promise<{
    totalQuestions: number;
    totalAttempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
  }> {
    try {
      logger.info('Fetching quiz statistics', { id, requesterId });

      // Verify requester has access to this quiz
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      const quiz = await this.prisma.quiz.findUnique({
        where: { id },
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

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Check permissions
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== quiz.lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view this quiz\'s statistics');
      }

      const [
        totalQuestions,
        totalAttempts,
        scoreStats,
      ] = await Promise.all([
        this.prisma.question.count({
          where: { quizId: id },
        }),
        this.prisma.quizAttempt.count({
          where: { quizId: id },
        }),
        this.prisma.quizAttempt.aggregate({
          where: { quizId: id },
          _avg: { score: true },
          _max: { score: true },
          _min: { score: true },
        }),
      ]);

      const stats = {
        totalQuestions,
        totalAttempts,
        averageScore: scoreStats._avg.score || 0,
        highestScore: scoreStats._max.score || 0,
        lowestScore: scoreStats._min.score || 0,
        completionRate: totalAttempts > 0 ? 100 : 0, // Simplified completion rate
      };

      logger.info('Quiz statistics fetched successfully', { 
        quizId: id,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch quiz statistics', { error, id, requesterId });
      throw error;
    }
  }
}

// Export singleton instance
export const quizService = new QuizService(
  require('../lib/database').db
);
