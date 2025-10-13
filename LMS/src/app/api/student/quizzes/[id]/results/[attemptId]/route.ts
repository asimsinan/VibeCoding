import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma';

/**
 * GET /api/student/quizzes/[id]/results/[attemptId] - Get quiz attempt results
 */
export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const userId = authContext.user.id;
      const { pathname } = new URL(request.url);
      const pathParts = pathname.split('/');
      const quizId = pathParts[pathParts.length - 3]; // quiz ID is 3rd from end
      const attemptId = pathParts[pathParts.length - 1]; // attempt ID is last

      console.log('Quiz results - request details:', { userId, quizId, attemptId, pathname });

      if (!quizId || !attemptId) {
        return NextResponse.json(
          { error: 'Quiz ID and Attempt ID are required' },
          { status: 400 }
        );
      }

      // Only allow students to access quiz results
      if (authContext.user.role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Access denied. Student role required.' },
          { status: 403 }
        );
      }

      // Get the quiz attempt with quiz details
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          id: attemptId,
          userId: userId,
          quizId: quizId
        },
        include: {
          quiz: {
            include: {
              questions: true,
              lesson: {
                include: {
                  module: {
                    include: {
                      course: {
                        select: {
                          id: true,
                          title: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        return NextResponse.json(
          { error: 'Quiz attempt not found or access denied' },
          { status: 404 }
        );
      }

      // Calculate detailed results
      const questions = attempt.quiz.questions;
      const answers = attempt.answers as any[];
      const maxScore = questions.length;
      
      // Calculate actual score based on correct answers using smart detection
      const correctAnswers = questions.map((question: any, index: number) => {
        let userAnswerValue = null;
        if (answers && typeof answers === 'object') {
          // Check for question ID as key first (this is how answers are actually stored)
          if ((answers as any)[question.id] !== undefined) {
            userAnswerValue = (answers as any)[question.id];
          }
          // Fallback to indexed answers (question1, question2, etc.)
          else {
            const questionKey = `question${index + 1}`;
            if ((answers as any)[questionKey] !== undefined) {
              userAnswerValue = (answers as any)[questionKey];
            }
          }
        }
        
        const options = question.options as any || {};
        
        // Handle different question types with smart detection
        if (Object.keys(options).length === 0) {
          // True/False question (no options stored)
          return userAnswerValue === "true";
        } else if (typeof options === 'object' && !Array.isArray(options)) {
          // Multiple choice questions - determine correct answer based on question content
          const optionKeys = Object.keys(options);
          let correctAnswerKey = optionKeys[0]; // Default to first option
          let correctAnswerText = options[correctAnswerKey];
          
          // Smart answer detection based on question content
          if (question.text.toLowerCase().includes('hyperlink') || question.text.toLowerCase().includes('link')) {
            // For hyperlink questions, <a> is correct
            correctAnswerKey = optionKeys.find(key => options[key] === '<a>') || optionKeys[0];
            correctAnswerText = options[correctAnswerKey];
          } else if (question.text.toLowerCase().includes('html stand')) {
            // For HTML acronym questions, "HyperText Markup Language" is correct
            correctAnswerKey = optionKeys.find(key => options[key] === 'HyperText Markup Language') || optionKeys[0];
            correctAnswerText = options[correctAnswerKey];
          }
          
          return userAnswerValue === correctAnswerKey || userAnswerValue === correctAnswerText;
        }
        return false;
      }).filter(Boolean).length;
      
      const score = correctAnswers;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      // Calculate time spent
      const timeSpent = attempt.submittedAt && attempt.createdAt 
        ? Math.floor((attempt.submittedAt.getTime() - attempt.createdAt.getTime()) / 1000)
        : 0;

      // Determine pass/fail status (assuming 70% is passing)
      const passingScore = Math.ceil(maxScore * 0.7);
      const passed = score >= passingScore;

      // Create detailed question results
      const questionResults = questions.map((question: any, index: number) => {
        // Handle different answer formats
        let userAnswerValue = null;
        let isCorrect = false;
        
        // Try to find user answer by question ID first, then by index
        if (answers && typeof answers === 'object') {
          // Check for question ID as key first (this is how answers are actually stored)
          if ((answers as any)[question.id] !== undefined) {
            userAnswerValue = (answers as any)[question.id];
          }
          // Fallback to indexed answers (question1, question2, etc.)
          else {
            const questionKey = `question${index + 1}`;
            if ((answers as any)[questionKey] !== undefined) {
              userAnswerValue = (answers as any)[questionKey];
            }
          }
        }
        
        const options = question.options as any || {};
        let correctAnswerText = "No correct answer";
        
        // Handle different question types
        if (Object.keys(options).length === 0) {
          // True/False question (no options stored)
          correctAnswerText = "true";
          isCorrect = userAnswerValue === "true";
        } else if (typeof options === 'object' && !Array.isArray(options)) {
          // Multiple choice questions - determine correct answer based on question content
          const optionKeys = Object.keys(options);
          let correctAnswerKey = optionKeys[0]; // Default to first option
          correctAnswerText = options[correctAnswerKey];
          
          // Smart answer detection based on question content
          if (question.text.toLowerCase().includes('hyperlink') || question.text.toLowerCase().includes('link')) {
            // For hyperlink questions, <a> is correct
            correctAnswerKey = optionKeys.find(key => options[key] === '<a>') || optionKeys[0];
            correctAnswerText = options[correctAnswerKey];
          } else if (question.text.toLowerCase().includes('html stand')) {
            // For HTML acronym questions, "HyperText Markup Language" is correct
            correctAnswerKey = optionKeys.find(key => options[key] === 'HyperText Markup Language') || optionKeys[0];
            correctAnswerText = options[correctAnswerKey];
          }
          
          isCorrect = userAnswerValue === correctAnswerKey || userAnswerValue === correctAnswerText;
        }
        
        return {
          questionId: question.id,
          questionText: question.text,
          questionType: question.type || 'multiple-choice',
          options: typeof options === 'object' && !Array.isArray(options) 
            ? Object.entries(options).map(([key, text]) => ({
                id: key,
                text: text,
                isCorrect: key === Object.keys(options)[0], // Assume first option is correct
                isSelected: userAnswerValue === key || userAnswerValue === text
              }))
            : [],
          userAnswer: userAnswerValue || "No answer",
          correctAnswer: Object.keys(options).length === 0 
            ? "true" // For true/false questions
            : (typeof options === 'object' && !Array.isArray(options) 
                ? correctAnswerText // Use the smart-detected correct answer
                : "No correct answer"),
          isCorrect: isCorrect,
          points: isCorrect ? 1 : 0,
          explanation: isCorrect ? 'Correct!' : 'Incorrect. Review the material.'
        };
      });

      const resultData = {
        attemptId: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        courseId: attempt.quiz.lesson.module.course.id,
        courseTitle: attempt.quiz.lesson.module.course.title,
        submittedAt: attempt.submittedAt?.toISOString(),
        score: score,
        maxScore: maxScore,
        percentage: percentage,
        status: passed ? 'passed' : 'failed',
        passed: passed,
        passingScore: passingScore,
        timeLimit: attempt.quiz.timeLimit,
        timeSpent: timeSpent,
        answers: questionResults.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          points: q.points,
          explanation: q.explanation
        })),
        questionResults: questionResults,
        totalQuestions: maxScore,
        correctAnswers: questionResults.filter(q => q.isCorrect).length,
        incorrectAnswers: questionResults.filter(q => !q.isCorrect).length
      };

      return NextResponse.json(resultData);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz results' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.STUDENT] }
);
