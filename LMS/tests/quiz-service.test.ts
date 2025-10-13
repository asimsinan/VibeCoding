import { PrismaClient, UserRole, QuestionType } from '../src/generated/prisma';
import { quizService } from '../src/services/quiz.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '../src/lib/errors';

describe('QuizService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await TestCleanup.cleanupAll();
  });

  beforeEach(async () => {
    await TestCleanup.cleanupAll();
    
    // Create test data
    organization = await TestDataFactory.createOrganization();
    course = await TestDataFactory.createCourse({ organizationId: organization.id });
    module = await TestDataFactory.createModule({ courseId: course.id });
    lesson = await TestDataFactory.createLesson({ moduleId: module.id });
    
    adminUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.ADMIN,
    });
    
    instructorUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.INSTRUCTOR,
    });
    
    studentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });
  });

  afterAll(async () => {
    await TestCleanup.cleanupAll();
    await prisma.$disconnect();
  });

  describe('Quiz Management', () => {
    it('should create a quiz successfully', async () => {
      const quizData = {
        title: 'Test Quiz',
        timeLimit: 30,
        maxAttempts: 3,
        passingScore: 70,
        lesson: { connect: { id: lesson.id } },
      };

      const quiz = await quizService.createQuiz(quizData, adminUser.id);

      expect(quiz).toBeDefined();
      expect(quiz.title).toBe('Test Quiz');
      expect(quiz.timeLimit).toBe(30);
      expect(quiz.maxAttempts).toBe(3);
      expect(quiz.passingScore).toBe(70);
      expect(quiz.lessonId).toBe(lesson.id);
    });

    it('should prevent creating multiple quizzes for the same lesson', async () => {
      const quizData = {
        title: 'First Quiz',
        lesson: { connect: { id: lesson.id } },
      };

      await quizService.createQuiz(quizData, adminUser.id);

      const secondQuizData = {
        title: 'Second Quiz',
        lesson: { connect: { id: lesson.id } },
      };

      await expect(
        quizService.createQuiz(secondQuizData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent students from creating quizzes', async () => {
      const quizData = {
        title: 'Student Quiz',
        lesson: { connect: { id: lesson.id } },
      };

      await expect(
        quizService.createQuiz(quizData, studentUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should get quiz by ID', async () => {
      const quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });

      const retrievedQuiz = await quizService.getQuizById(quiz.id, adminUser.id);

      expect(retrievedQuiz).toBeDefined();
      expect(retrievedQuiz.id).toBe(quiz.id);
      expect(retrievedQuiz.title).toBe(quiz.title);
    });

    it('should update quiz', async () => {
      const quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });

      const updatedQuiz = await quizService.updateQuiz(
        quiz.id,
        { title: 'Updated Quiz Title', timeLimit: 45 },
        adminUser.id
      );

      expect(updatedQuiz.title).toBe('Updated Quiz Title');
      expect(updatedQuiz.timeLimit).toBe(45);
    });

    it('should delete quiz', async () => {
      const quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });

      const result = await quizService.deleteQuiz(quiz.id, adminUser.id);

      expect(result.success).toBe(true);

      await expect(
        quizService.getQuizById(quiz.id, adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should prevent deleting quiz with attempts', async () => {
      const quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });
      await TestDataFactory.createQuizAttempt({ quizId: quiz.id, userId: studentUser.id });

      await expect(
        quizService.deleteQuiz(quiz.id, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Question Management', () => {
    let quiz: any;

    beforeEach(async () => {
      quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });
    });

    it('should create multiple choice question', async () => {
      const questionData = {
        text: 'What is the capital of France?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital of France',
        quiz: { connect: { id: quiz.id } },
      };

      const question = await quizService.createQuestion(questionData, adminUser.id);

      expect(question).toBeDefined();
      expect(question.text).toBe('What is the capital of France?');
      expect(question.type).toBe(QuestionType.MULTIPLE_CHOICE);
      expect(question.options).toEqual(['London', 'Paris', 'Berlin', 'Madrid']);
      expect(question.correctAnswer).toBe('Paris');
    });

    it('should create true/false question', async () => {
      const questionData = {
        text: 'The Earth is flat.',
        type: QuestionType.TRUE_FALSE,
        correctAnswer: false,
        explanation: 'The Earth is spherical',
        quiz: { connect: { id: quiz.id } },
      };

      const question = await quizService.createQuestion(questionData, adminUser.id);

      expect(question).toBeDefined();
      expect(question.text).toBe('The Earth is flat.');
      expect(question.type).toBe(QuestionType.TRUE_FALSE);
      expect(question.correctAnswer).toBe(false);
    });

    it('should create short answer question', async () => {
      const questionData = {
        text: 'What is 2 + 2?',
        type: QuestionType.SHORT_ANSWER,
        correctAnswer: '4',
        explanation: 'Basic arithmetic',
        quiz: { connect: { id: quiz.id } },
      };

      const question = await quizService.createQuestion(questionData, adminUser.id);

      expect(question).toBeDefined();
      expect(question.text).toBe('What is 2 + 2?');
      expect(question.type).toBe(QuestionType.SHORT_ANSWER);
      expect(question.correctAnswer).toBe('4');
    });

    it('should create essay question', async () => {
      const questionData = {
        text: 'Explain the concept of democracy.',
        type: QuestionType.ESSAY,
        explanation: 'Open-ended question for critical thinking',
        quiz: { connect: { id: quiz.id } },
      };

      const question = await quizService.createQuestion(questionData, adminUser.id);

      expect(question).toBeDefined();
      expect(question.text).toBe('Explain the concept of democracy.');
      expect(question.type).toBe(QuestionType.ESSAY);
      expect(question.correctAnswer).toBeNull();
    });

    it('should validate multiple choice question data', async () => {
      const invalidQuestionData = {
        text: 'What is the capital?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['Only one option'], // Invalid: needs at least 2
        correctAnswer: 'Paris',
        quiz: { connect: { id: quiz.id } },
      };

      await expect(
        quizService.createQuestion(invalidQuestionData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate true/false question data', async () => {
      const invalidQuestionData = {
        text: 'True or false?',
        type: QuestionType.TRUE_FALSE,
        correctAnswer: 'maybe', // Invalid: should be boolean
        quiz: { connect: { id: quiz.id } },
      };

      await expect(
        quizService.createQuestion(invalidQuestionData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate short answer question data', async () => {
      const invalidQuestionData = {
        text: 'What is the answer?',
        type: QuestionType.SHORT_ANSWER,
        correctAnswer: 123, // Invalid: should be string
        quiz: { connect: { id: quiz.id } },
      };

      await expect(
        quizService.createQuestion(invalidQuestionData, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should get question by ID', async () => {
      const question = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
      });

      const retrievedQuestion = await quizService.getQuestionById(question.id, adminUser.id);

      expect(retrievedQuestion).toBeDefined();
      expect(retrievedQuestion.id).toBe(question.id);
      expect(retrievedQuestion.text).toBe(question.text);
    });

    it('should update question', async () => {
      const question = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
      });

      const updatedQuestion = await quizService.updateQuestion(
        question.id,
        { text: 'Updated question text' },
        adminUser.id
      );

      expect(updatedQuestion.text).toBe('Updated question text');
    });

    it('should delete question', async () => {
      const question = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
      });

      const result = await quizService.deleteQuestion(question.id, adminUser.id);

      expect(result.success).toBe(true);

      await expect(
        quizService.getQuestionById(question.id, adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should reorder questions', async () => {
      const question1 = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
        order: 1,
      });

      const question2 = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
        order: 2,
      });

      const question3 = await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
        order: 3,
      });

      // Reorder: 3, 1, 2
      const result = await quizService.reorderQuestions(
        quiz.id,
        [question3.id, question1.id, question2.id],
        adminUser.id
      );

      expect(result.success).toBe(true);

      // Verify new order
      const questions = await prisma.question.findMany({
        where: { quizId: quiz.id },
        orderBy: { order: 'asc' },
      });

      expect(questions[0].id).toBe(question3.id);
      expect(questions[1].id).toBe(question1.id);
      expect(questions[2].id).toBe(question2.id);
    });
  });

  describe('Quiz Statistics', () => {
    let quiz: any;

    beforeEach(async () => {
      quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });
    });

    it('should get quiz statistics', async () => {
      // Create questions
      await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.MULTIPLE_CHOICE,
      });
      await TestDataFactory.createQuestion({
        quizId: quiz.id,
        type: QuestionType.TRUE_FALSE,
      });

      // Create attempts
      await TestDataFactory.createQuizAttempt({
        quizId: quiz.id,
        userId: studentUser.id,
        score: 80,
      });
      await TestDataFactory.createQuizAttempt({
        quizId: quiz.id,
        userId: studentUser.id,
        score: 90,
      });

      const stats = await quizService.getQuizStats(quiz.id, adminUser.id);

      expect(stats.totalQuestions).toBe(2);
      expect(stats.totalAttempts).toBe(2);
      expect(stats.averageScore).toBe(85);
      expect(stats.highestScore).toBe(90);
      expect(stats.lowestScore).toBe(80);
    });

    it('should prevent students from viewing quiz statistics', async () => {
      await expect(
        quizService.getQuizStats(quiz.id, studentUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Access Control', () => {
    let otherOrganization: any;
    let otherUser: any;
    let quiz: any;

    beforeEach(async () => {
      otherOrganization = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      otherUser = await TestDataFactory.createUser({
        organizationId: otherOrganization.id,
        role: UserRole.ADMIN,
      });
      quiz = await TestDataFactory.createQuiz({ lessonId: lesson.id });
    });

    it('should prevent cross-organization access to quizzes', async () => {
      await expect(
        quizService.getQuizById(quiz.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization updates to quizzes', async () => {
      await expect(
        quizService.updateQuiz(quiz.id, { title: 'Hacked' }, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization deletion of quizzes', async () => {
      await expect(
        quizService.deleteQuiz(quiz.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
