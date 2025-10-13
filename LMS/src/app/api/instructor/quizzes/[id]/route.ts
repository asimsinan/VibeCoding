import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

// GET /api/instructor/quizzes/[id] - Get a specific quiz
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const quizId = request.url.split('/').pop();

      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                organizationId: authContext.user.organizationId,
              },
            },
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          attempts: {
            select: {
              id: true,
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
          },
          questions: {
            select: {
              id: true,
              text: true,
              type: true,
              options: true,
              correctAnswer: true,
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Calculate statistics
      const totalAttempts = quiz.attempts.length;
      const averageScore = totalAttempts > 0 
        ? quiz.attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts
        : 0;

      // Transform the data to match the expected format
      const transformedQuiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        courseTitle: quiz.lesson.module.course.title,
        questionCount: quiz.questions.length,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        passingScore: quiz.passingScore,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        totalAttempts,
        averageScore,
        questions: quiz.questions.map((question: any) => ({
          id: question.id,
          text: question.text,
          type: question.type,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
        })),
        attempts: quiz.attempts.map((attempt: any) => ({
          id: attempt.id,
          score: attempt.score,
          submittedAt: attempt.submittedAt?.toISOString(),
          user: attempt.user,
        })),
      };

      return NextResponse.json(transformedQuiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['INSTRUCTOR', 'ADMIN'] }
);

// PUT /api/instructor/quizzes/[id] - Update a quiz
export const PUT = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const quizId = request.url.split('/').pop();
      const body = await request.json();
      const { questions, ...quizData } = body;
      
      console.log('PUT quiz update request:', { quizId, quizData, questionsCount: questions?.length || 0 });

      // Verify the quiz belongs to the instructor's organization
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                organizationId: authContext.user.organizationId,
              },
            },
          },
        },
      });

      console.log('Existing quiz found:', existingQuiz);

      if (!existingQuiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Update the quiz with all available fields
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: quizData.title,
          description: quizData.description,
          timeLimit: quizData.timeLimit,
          maxAttempts: quizData.maxAttempts,
          passingScore: quizData.passingScore,
          isPublished: quizData.isPublished,
        },
        include: {
          lesson: {
            select: {
              module: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log('Quiz updated:', updatedQuiz.id);

      // Handle question updates if provided
      if (questions && Array.isArray(questions)) {
        console.log('Updating questions:', questions.length);
        
        // Delete existing questions
        await prisma.question.deleteMany({
          where: { quizId: quizId }
        });
        
        // Create new questions
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          
          await prisma.question.create({
            data: {
              text: questionData.question || questionData.text,
              type: questionData.type,
              options: questionData.options || null,
              correctAnswer: questionData.correctAnswer || null,
              order: i + 1,
              quizId: quizId!
            }
          });
        }
        
        console.log('Questions updated successfully');
      }

      // Transform the response
      const transformedQuiz = {
        id: updatedQuiz.id,
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        courseTitle: updatedQuiz.lesson.module.course.title,
        timeLimit: updatedQuiz.timeLimit,
        maxAttempts: updatedQuiz.maxAttempts,
        passingScore: updatedQuiz.passingScore,
        isPublished: updatedQuiz.isPublished,
        createdAt: updatedQuiz.createdAt.toISOString(),
        updatedAt: updatedQuiz.updatedAt.toISOString(),
      };

      return NextResponse.json(transformedQuiz);
    } catch (error) {
      console.error('Error updating quiz:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        quizId: request.url.split('/').pop()
      });
      return NextResponse.json(
        { error: 'Failed to update quiz' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['INSTRUCTOR', 'ADMIN'] }
);

// DELETE /api/instructor/quizzes/[id] - Delete a quiz
export const DELETE = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const quizId = request.url.split('/').pop();

      // Verify the quiz belongs to the instructor's organization
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                organizationId: authContext.user.organizationId,
              },
            },
          },
        },
      });

      if (!existingQuiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      // Delete the quiz (this will cascade delete related records)
      await prisma.quiz.delete({
        where: { id: quizId },
      });

      return NextResponse.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return NextResponse.json(
        { error: 'Failed to delete quiz' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['INSTRUCTOR', 'ADMIN'] }
);
