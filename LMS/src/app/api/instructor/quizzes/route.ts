import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') || 'ALL';

      // Get quizzes for courses in the instructor's organization
      const quizzes = await prisma.quiz.findMany({
        where: {
          lesson: {
            module: {
              course: {
                organizationId: authContext.user.organizationId
              }
            }
          }
        },
        include: {
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
          },
          attempts: {
            select: {
              id: true,
              score: true,
              submittedAt: true
            }
          },
          questions: {
            select: {
              id: true,
              text: true,
              type: true,
              order: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }).catch(error => {
        console.error('Error fetching quizzes:', error);
        return [];
      });

      // Transform the data to match the expected interface
      const transformedQuizzes = quizzes.map(quiz => {
        try {
          const attempts = quiz.attempts || [];
          const totalAttempts = attempts.length;
          const averageScore = totalAttempts > 0 
            ? attempts.reduce((sum: number, attempt: any) => sum + (attempt.score || 0), 0) / totalAttempts
            : 0;

          return {
            id: quiz.id,
            title: quiz.title || 'Untitled Quiz',
            description: '', // Quiz model doesn't have description field
            courseTitle: quiz.lesson?.module?.course?.title || 'Unknown Course',
            questionCount: quiz.questions?.length || 0,
            timeLimit: quiz.timeLimit,
            maxAttempts: null, // Quiz model doesn't have maxAttempts field
            passingScore: 0, // Quiz model doesn't have passingScore field
            isPublished: true, // All quizzes are considered published in this schema
            createdAt: quiz.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: quiz.updatedAt?.toISOString() || new Date().toISOString(),
            totalAttempts,
            averageScore: Math.round(averageScore * 100) / 100
          };
        } catch (error) {
          console.error('Error transforming quiz:', quiz.id, error);
          return {
            id: quiz.id,
            title: 'Error Loading Quiz',
            description: '',
            courseTitle: 'Unknown Course',
            questionCount: 0,
            timeLimit: null,
            maxAttempts: null,
            passingScore: 0,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalAttempts: 0,
            averageScore: 0
          };
        }
      });

      return NextResponse.json(transformedQuizzes);
    } catch (error) {
      console.error('Error fetching instructor quizzes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quizzes' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR] }
);

export const POST = withAuth(
  async (request: NextRequest, authContext) => {
    try {
      const body = await request.json();
      const { title, description, courseId, timeLimit, maxAttempts, passingScore, questions } = body;
      
      console.log('POST quiz creation request:', { title, description, courseId, timeLimit, maxAttempts, passingScore, questionsCount: questions?.length || 0 });

      // Verify the course belongs to the instructor's organization
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          organizationId: authContext.user.organizationId
        },
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      });

      console.log('Course found:', course);

      if (!course) {
        return NextResponse.json(
          { error: 'Course not found or access denied' },
          { status: 404 }
        );
      }

      // Find the first lesson in the course, or create one if none exist
      let lesson = course.modules[0]?.lessons[0];
      
      if (!lesson) {
        // Create a default module and lesson for this course
        const module = await prisma.module.create({
          data: {
            title: 'Default Module',
            courseId: courseId,
            order: 1
          }
        });

        lesson = await prisma.lesson.create({
          data: {
            title: 'Quiz Lesson',
            content: 'This lesson contains quiz content.',
            type: 'TEXT',
            moduleId: module.id,
            order: 1
          }
        });
      }

      console.log('Using lesson:', lesson);

      // Create the quiz
      const quiz = await prisma.quiz.create({
        data: {
          title,
          description: description || null,
          lessonId: lesson.id,
          timeLimit: timeLimit || null,
          maxAttempts: maxAttempts || null,
          passingScore: passingScore || 70,
          isPublished: false, // Default to draft
        },
        include: {
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
      });

      console.log('Quiz created:', quiz.id);

      // Create questions if provided
      let createdQuestions = [];
      if (questions && questions.length > 0) {
        console.log('Creating questions:', questions.length);
        
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          
          // Transform the question data to match the database schema
          const question = await prisma.question.create({
            data: {
              text: questionData.question || questionData.text,
              type: questionData.type,
              options: questionData.options || null,
              correctAnswer: questionData.correctAnswer || null,
              order: i + 1,
              quizId: quiz.id
            }
          });
          
          createdQuestions.push(question);
        }
        
        console.log('Questions created:', createdQuestions.length);
      }

      const transformedQuiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '',
        courseTitle: quiz.lesson.module.course.title,
        questionCount: createdQuestions.length,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        passingScore: quiz.passingScore,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
        totalAttempts: 0,
        averageScore: 0
      };

      return NextResponse.json(transformedQuiz, { status: 201 });
    } catch (error) {
      console.error('Error creating quiz:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { error: 'Failed to create quiz' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: [UserRole.INSTRUCTOR] }
);
