import { ModelFactory } from '../../lib/resume-reviewer/models/index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  resumeUpload: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  feedback: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  userSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  healthLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

describe('ModelFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResumeUploadModel', () => {
    it('should create ResumeUploadModel instance', () => {
      const model = ModelFactory.getResumeUploadModel(mockPrisma);
      
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('ResumeUploadModel');
    });

    it('should create new instance each time', () => {
      const model1 = ModelFactory.getResumeUploadModel(mockPrisma);
      const model2 = ModelFactory.getResumeUploadModel(mockPrisma);
      
      expect(model1).not.toBe(model2);
    });
  });

  describe('getFeedbackModel', () => {
    it('should create FeedbackModel instance', () => {
      const model = ModelFactory.getFeedbackModel(mockPrisma);
      
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('FeedbackModel');
    });

    it('should create new instance each time', () => {
      const model1 = ModelFactory.getFeedbackModel(mockPrisma);
      const model2 = ModelFactory.getFeedbackModel(mockPrisma);
      
      expect(model1).not.toBe(model2);
    });
  });

  describe('getUserSessionModel', () => {
    it('should create UserSessionModel instance', () => {
      const model = ModelFactory.getUserSessionModel(mockPrisma);
      
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('UserSessionModel');
    });

    it('should create new instance each time', () => {
      const model1 = ModelFactory.getUserSessionModel(mockPrisma);
      const model2 = ModelFactory.getUserSessionModel(mockPrisma);
      
      expect(model1).not.toBe(model2);
    });
  });

  describe('getHealthLogModel', () => {
    it('should create HealthLogModel instance', () => {
      const model = ModelFactory.getHealthLogModel(mockPrisma);
      
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('HealthLogModel');
    });

    it('should create new instance each time', () => {
      const model1 = ModelFactory.getHealthLogModel(mockPrisma);
      const model2 = ModelFactory.getHealthLogModel(mockPrisma);
      
      expect(model1).not.toBe(model2);
    });
  });

  describe('getPrismaClient', () => {
    it('should create PrismaClient instance', () => {
      const client = ModelFactory.getPrismaClient();
      
      expect(client).toBeDefined();
      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
    });

    it('should create new instance each time', () => {
      const client1 = ModelFactory.getPrismaClient();
      const client2 = ModelFactory.getPrismaClient();
      
      expect(client1).not.toBe(client2);
    });

    it('should have proper configuration', () => {
      const client = ModelFactory.getPrismaClient();
      
      // Verify client has expected methods
      expect(typeof client.$connect).toBe('function');
      expect(typeof client.$disconnect).toBe('function');
      expect(typeof client.$transaction).toBe('function');
      expect(typeof client.$queryRaw).toBe('function');
      
      // Verify models are available
      expect(client.resumeUpload).toBeDefined();
      expect(client.feedback).toBeDefined();
      expect(client.userSession).toBeDefined();
      expect(client.healthLog).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should create all models with same Prisma client', () => {
      const prisma = ModelFactory.getPrismaClient();
      
      const resumeModel = ModelFactory.getResumeUploadModel(prisma);
      const feedbackModel = ModelFactory.getFeedbackModel(prisma);
      const sessionModel = ModelFactory.getUserSessionModel(prisma);
      const healthModel = ModelFactory.getHealthLogModel(prisma);
      
      expect(resumeModel).toBeDefined();
      expect(feedbackModel).toBeDefined();
      expect(sessionModel).toBeDefined();
      expect(healthModel).toBeDefined();
    });

    it('should handle Prisma client lifecycle', async () => {
      const prisma = ModelFactory.getPrismaClient();
      
      // For unit tests, we don't need to actually connect to the database
      // Just verify the client has the expected methods
      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle null Prisma client gracefully', () => {
      const model = ModelFactory.getResumeUploadModel(null as any);
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('ResumeUploadModel');
    });

    it('should handle undefined Prisma client gracefully', () => {
      const model = ModelFactory.getFeedbackModel(undefined as any);
      expect(model).toBeDefined();
      expect(model.constructor.name).toBe('FeedbackModel');
    });
  });
});
