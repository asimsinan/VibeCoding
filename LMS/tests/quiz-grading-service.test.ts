import { PrismaClient, UserRole, QuestionType, CourseStatus, EnrollmentStatus } from '@prisma/client';
import { quizGradingService } from '@/services/quiz-grading.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';

describe('QuizGradingService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson: any;
  let quiz: any;
  let question1: any;
  let question2: any;
  let question3: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;
  let otherStudentUser: any;
  let enrollment: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await TestCleanup.cleanupAll();
  });

  beforeEach(async () => {
    await TestCleanup.cleanupAll();
    
    // Create test data
    organization = await TestDataFactory.createOrganization();
    course = await TestDataFactory.createCourse({ 
      organizationId: organization.id,
      status: CourseStatus.PUBLISHED,
    });
    module = await TestDataFactory.createModule({ courseId: course.id });
    lesson = await TestDataFactory.createLesson({ moduleId: module.id });
    quiz = await TestDataFactory.createQuiz({ 
      lessonId: lesson.id,
      maxAttempts: 3,
      passingScore: 70,
    });
    
    // Create questions
    question1 = await TestDataFactory.createQuestion({
      quizId: quiz.id,
      type: QuestionType.MULTIPLE_CHOICE,
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital of France',
    });

    question2 = await TestDataFactory.createQuestion({
      quizId: quiz.id,
      type: QuestionType.TRUE_FALSE,
      text: 'The Earth is flat.',
      correctAnswer: false,
      explanation: 'The Earth is spherical',
    });

    question3 = await TestDataFactory.createQuestion({
      quizId: quiz.id,
      type: QuestionType.SHORT_ANSWER,
      text: 'What is 2 + 2?',
      correctAnswer: '4',
      explanation: 'Basic arithmetic',
    });
    
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

    otherStudentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });

    // Create enrollment
    enrollment = await TestDataFactory.createEnrollment({
      userId: studentUser.id,
      courseId: course.id,
      organizationId: organization.id,
      status: EnrollmentStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    await TestCleanup.cleanupAll();
    await prisma.$disconnect();
  });

  describe('Quiz Submission and Grading', () => {
    it('should submit quiz attempt and grade correctly', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result).toBeDefined();
      expect(result.score).toBe(100);
      expect(result.totalQuestions).toBe(3);
      expect(result.correctAnswers).toBe(3);
      expect(result.incorrectAnswers).toBe(0);
      expect(result.passed).toBe(true);
      expect(result.questionResults).toHaveLength(3);
      expect(result.questionResults.every(qr => qr.correct)).toBe(true);
      expect(result.feedback).toContain('Perfect score');
    });

    it('should grade partial correct answers', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' }, // Correct
        { questionId: question2.id, answer: true }, // Incorrect
        { questionId: question3.id, answer: '5' }, // Incorrect
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.score).toBe(33); // 1/3 * 100 = 33%
      expect(result.correctAnswers).toBe(1);
      expect(result.incorrectAnswers).toBe(2);
      expect(result.passed).toBe(false);
      expect(result.questionResults[0].correct).toBe(true);
      expect(result.questionResults[1].correct).toBe(false);
      expect(result.questionResults[2].correct).toBe(false);
    });

    it('should handle case-insensitive short answers', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: 'FOUR' }, // Different case
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.score).toBe(100);
      expect(result.correctAnswers).toBe(3);
      expect(result.passed).toBe(true);
    });

    it('should allow students to submit quizzes for themselves', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        studentUser.id
      );

      expect(result).toBeDefined();
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('should prevent students from submitting quizzes for other students', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          otherStudentUser.id,
          submissions,
          studentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should enforce attempt limits', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      // Submit max attempts
      await quizGradingService.submitQuizAttempt(quiz.id, studentUser.id, submissions, adminUser.id);
      await quizGradingService.submitQuizAttempt(quiz.id, studentUser.id, submissions, adminUser.id);
      await quizGradingService.submitQuizAttempt(quiz.id, studentUser.id, submissions, adminUser.id);

      // Try to submit one more (should fail)
      await expect(
        quizGradingService.submitQuizAttempt(quiz.id, studentUser.id, submissions, adminUser.id)
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent submission without enrollment', async () => {
      const unenrolledStudent = await TestDataFactory.createUser({
        organizationId: organization.id,
        role: UserRole.STUDENT,
      });

      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          unenrolledStudent.id,
          submissions,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should validate submission data', async () => {
      const invalidSubmissions = [
        { questionId: 'invalid-id', answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          studentUser.id,
          invalidSubmissions,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should require all questions to be answered', async () => {
      const incompleteSubmissions = [
        { questionId: question1.id, answer: 'Paris' },
        // Missing question2 and question3
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          studentUser.id,
          incompleteSubmissions,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent duplicate question submissions', async () => {
      const duplicateSubmissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question1.id, answer: 'London' }, // Duplicate
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          studentUser.id,
          duplicateSubmissions,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Quiz Attempt Retrieval', () => {
    let attempt: any;

    beforeEach(async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );
      attempt = await prisma.quizAttempt.findUnique({
        where: { id: result.attemptId },
      });
    });

    it('should get quiz attempt by ID', async () => {
      const retrievedAttempt = await quizGradingService.getQuizAttemptById(
        attempt.id,
        adminUser.id
      );

      expect(retrievedAttempt).toBeDefined();
      expect(retrievedAttempt.id).toBe(attempt.id);
      expect(retrievedAttempt.userId).toBe(studentUser.id);
      expect(retrievedAttempt.quizId).toBe(quiz.id);
      expect(retrievedAttempt.score).toBe(100);
    });

    it('should allow students to view their own attempts', async () => {
      const retrievedAttempt = await quizGradingService.getQuizAttemptById(
        attempt.id,
        studentUser.id
      );

      expect(retrievedAttempt).toBeDefined();
      expect(retrievedAttempt.id).toBe(attempt.id);
    });

    it('should prevent students from viewing other students\' attempts', async () => {
      await expect(
        quizGradingService.getQuizAttemptById(
          attempt.id,
          otherStudentUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should get quiz attempts for a specific quiz', async () => {
      const attempts = await quizGradingService.getQuizAttempts(
        quiz.id,
        adminUser.id,
        1,
        10
      );

      expect(attempts).toBeDefined();
      expect(attempts.data).toHaveLength(1);
      expect(attempts.data[0].id).toBe(attempt.id);
      expect(attempts.total).toBe(1);
    });

    it('should get quiz attempts for a specific user', async () => {
      const attempts = await quizGradingService.getUserQuizAttempts(
        studentUser.id,
        adminUser.id,
        1,
        10
      );

      expect(attempts).toBeDefined();
      expect(attempts.data).toHaveLength(1);
      expect(attempts.data[0].id).toBe(attempt.id);
      expect(attempts.total).toBe(1);
    });

    it('should support pagination', async () => {
      // Create another attempt
      const submissions2 = [
        { questionId: question1.id, answer: 'London' },
        { questionId: question2.id, answer: true },
        { questionId: question3.id, answer: '5' },
      ];

      await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions2,
        adminUser.id
      );

      const page1 = await quizGradingService.getUserQuizAttempts(
        studentUser.id,
        adminUser.id,
        1,
        1
      );

      expect(page1.data).toHaveLength(1);
      expect(page1.total).toBe(2);
      expect(page1.totalPages).toBe(2);

      const page2 = await quizGradingService.getUserQuizAttempts(
        studentUser.id,
        adminUser.id,
        2,
        1
      );

      expect(page2.data).toHaveLength(1);
      expect(page2.total).toBe(2);
      expect(page2.totalPages).toBe(2);
    });
  });

  describe('Grading Logic', () => {
    it('should generate appropriate feedback for perfect score', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.feedback).toContain('Perfect score');
    });

    it('should generate appropriate feedback for passing score', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' }, // Correct
        { questionId: question2.id, answer: false }, // Correct
        { questionId: question3.id, answer: '5' }, // Incorrect (2/3 = 67%, below 70%)
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.passed).toBe(false);
      expect(result.feedback).toContain('close to passing');
    });

    it('should generate appropriate feedback for failing score', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'London' }, // Incorrect
        { questionId: question2.id, answer: true }, // Incorrect
        { questionId: question3.id, answer: '5' }, // Incorrect (0/3 = 0%)
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.passed).toBe(false);
      expect(result.feedback).toContain('review the course material');
    });
  });

  describe('Access Control', () => {
    let otherOrganization: any;
    let otherUser: any;
    let attempt: any;

    beforeEach(async () => {
      otherOrganization = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      otherUser = await TestDataFactory.createUser({
        organizationId: otherOrganization.id,
        role: UserRole.ADMIN,
      });

      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );
      attempt = await prisma.quizAttempt.findUnique({
        where: { id: result.attemptId },
      });
    });

    it('should prevent cross-organization access to quiz attempts', async () => {
      await expect(
        quizGradingService.getQuizAttemptById(attempt.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization quiz submissions', async () => {
      const submissions = [
        { questionId: question1.id, answer: 'Paris' },
        { questionId: question2.id, answer: false },
        { questionId: question3.id, answer: '4' },
      ];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          studentUser.id,
          submissions,
          otherUser.id
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle quiz with no questions', async () => {
      const emptyQuiz = await TestDataFactory.createQuiz({
        lessonId: lesson.id,
        maxAttempts: 1,
        passingScore: 70,
      });

      const submissions: any[] = [];

      const result = await quizGradingService.submitQuizAttempt(
        emptyQuiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.score).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.passed).toBe(true); // No questions means automatic pass
    });

    it('should handle empty submissions gracefully', async () => {
      const submissions: any[] = [];

      await expect(
        quizGradingService.submitQuizAttempt(
          quiz.id,
          studentUser.id,
          submissions,
          adminUser.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should handle null/undefined answers', async () => {
      const submissions = [
        { questionId: question1.id, answer: null },
        { questionId: question2.id, answer: undefined },
        { questionId: question3.id, answer: '' },
      ];

      const result = await quizGradingService.submitQuizAttempt(
        quiz.id,
        studentUser.id,
        submissions,
        adminUser.id
      );

      expect(result.score).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.incorrectAnswers).toBe(3);
      expect(result.passed).toBe(false);
    });
  });
});
