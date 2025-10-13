import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';


/**
 * POST /api/student/quizzes/[id]/submit - Submit quiz answers
 */
export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const quizId = pathname.split('/')[4]; // Extract quiz ID from path

      if (!quizId) {
        return NextResponse.json(
          { error: 'Quiz ID is required' },
          { status: 400 }
        );
      }

      // Only allow students to submit quizzes
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { answers, attemptId } = body;

      if (!answers || !attemptId) {
        return NextResponse.json(
          { error: 'Answers and attempt ID are required' },
          { status: 400 }
        );
      }

      // Get the quiz with questions to calculate score
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          lesson: {
            module: {
              course: {
                enrollments: {
                  some: {
                    userId: userId,
                    status: 'ACTIVE'
                  }
                }
              }
            }
          }
        },
        include: {
          questions: true
        }
      });

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found or access denied' },
          { status: 404 }
        );
      }

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        const questionKey = `question${i + 1}`;
        const userAnswer = answers[questionKey] || answers[question.id];
        
        const options = question.options as any || {};
        let isCorrect = false;
        
        if (typeof options === 'object' && !Array.isArray(options)) {
          const optionKeys = Object.keys(options);
          // For demo purposes, assume first option is correct
          const correctAnswerKey = optionKeys[0];
          const correctAnswerText = options[correctAnswerKey];
          
          // Check if user answer matches the correct option key or text
          if (userAnswer === correctAnswerKey || userAnswer === correctAnswerText) {
            isCorrect = true;
          }
        }
        
        if (isCorrect) {
          correctAnswers++;
        }
      }

      const score = correctAnswers; // Store raw number of correct answers
      const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Update the attempt with answers and score
      const updatedAttempt = await prisma.quizAttempt.update({
        where: {
          id: attemptId,
          userId: userId,
          quizId: quizId
        },
        data: {
          answers: answers,
          score: score,
          submittedAt: new Date()
        }
      });

      // Clean up any other incomplete attempts for this quiz by this user
      await prisma.quizAttempt.deleteMany({
        where: {
          quizId: quizId,
          userId: userId,
          score: null,
          id: { not: attemptId } // Don't delete the current attempt
        }
      });

      return NextResponse.json({
        id: updatedAttempt.id,
        score: score,
        maxScore: totalQuestions,
        percentage: percentage,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return NextResponse.json(
        { error: 'Failed to submit quiz' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
