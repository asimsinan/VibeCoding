import { MultiTenantIsolationService, OrganizationScopedService } from '../services/multi-tenant-isolation.service';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

describe('MultiTenantIsolationService', () => {
  let isolationService: MultiTenantIsolationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      course: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };
    isolationService = new MultiTenantIsolationService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganizationIdFromRequest', () => {
    it('should extract organization ID from headers', () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue('org-123'),
        },
      } as any;

      const result = isolationService.getOrganizationIdFromRequest(request);

      expect(result).toBe('org-123');
      expect(request.headers.get).toHaveBeenCalledWith('x-organization-id');
    });

    it('should extract organization ID from query parameters', () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        url: 'https://example.com/api/users?organizationId=org-123',
      } as any;

      const result = isolationService.getOrganizationIdFromRequest(request);

      expect(result).toBe('org-123');
    });

    it('should extract organization ID from user session', () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        url: 'https://example.com/api/users',
        user: {
          organizationId: 'org-123',
        },
      } as any;

      const result = isolationService.getOrganizationIdFromRequest(request);

      expect(result).toBe('org-123');
    });

    it('should return null if no organization ID found', () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        url: 'https://example.com/api/users',
      } as any;

      const result = isolationService.getOrganizationIdFromRequest(request);

      expect(result).toBeNull();
    });
  });

  describe('validateOrganizationAccess', () => {
    it('should allow access for matching organization IDs', () => {
      const result = isolationService.validateOrganizationAccess('org-123', 'org-123');
      expect(result).toBe(true);
    });

    it('should deny access for non-matching organization IDs', () => {
      const result = isolationService.validateOrganizationAccess('org-123', 'org-456');
      expect(result).toBe(false);
    });
  });

  describe('addOrganizationFilter', () => {
    it('should add organization filter to where clause', () => {
      const where = { status: 'ACTIVE' };
      const result = isolationService.addOrganizationFilter(where, 'org-123');

      expect(result).toEqual({
        status: 'ACTIVE',
        organizationId: 'org-123',
      });
    });

    it('should preserve existing filters', () => {
      const where = { status: 'ACTIVE', role: 'STUDENT' };
      const result = isolationService.addOrganizationFilter(where, 'org-123');

      expect(result).toEqual({
        status: 'ACTIVE',
        role: 'STUDENT',
        organizationId: 'org-123',
      });
    });
  });

  describe('addNestedOrganizationFilter', () => {
    it('should add nested organization filter', () => {
      const where = { status: 'ACTIVE' };
      const result = isolationService.addNestedOrganizationFilter(where, 'org-123', 'course');

      expect(result).toEqual({
        status: 'ACTIVE',
        course: {
          organizationId: 'org-123',
        },
      });
    });

    it('should handle deeply nested paths', () => {
      const where = { status: 'ACTIVE' };
      const result = isolationService.addNestedOrganizationFilter(where, 'org-123', 'lesson.module.course');

      expect(result).toEqual({
        status: 'ACTIVE',
        lesson: {
          module: {
            course: {
              organizationId: 'org-123',
            },
          },
        },
      });
    });
  });

  describe('validateDataOwnership', () => {
    it('should validate direct organizationId field', () => {
      const data = { id: '1', organizationId: 'org-123' };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(true);
    });

    it('should reject data with different organizationId', () => {
      const data = { id: '1', organizationId: 'org-456' };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(false);
    });

    it('should validate nested organization reference', () => {
      const data = { id: '1', organization: { id: 'org-123' } };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(true);
    });

    it('should validate course organization reference', () => {
      const data = { id: '1', course: { organizationId: 'org-123' } };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(true);
    });

    it('should validate deeply nested organization reference', () => {
      const data = {
        id: '1',
        lesson: {
          module: {
            course: {
              organizationId: 'org-123',
            },
          },
        },
      };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(true);
    });

    it('should return false for data without organization reference', () => {
      const data = { id: '1', name: 'Test' };
      const result = isolationService.validateDataOwnership(data, 'org-123');
      expect(result).toBe(false);
    });

    it('should return false for null data', () => {
      const result = isolationService.validateDataOwnership(null, 'org-123');
      expect(result).toBe(false);
    });
  });

  describe('sanitizeData', () => {
    it('should remove organizationId if it does not match', () => {
      const data = { id: '1', organizationId: 'org-456', name: 'Test' };
      const result = isolationService.sanitizeData(data, 'org-123');

      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should preserve organizationId if it matches', () => {
      const data = { id: '1', organizationId: 'org-123', name: 'Test' };
      const result = isolationService.sanitizeData(data, 'org-123');

      expect(result).toEqual({ id: '1', organizationId: 'org-123', name: 'Test' });
    });

    it('should recursively sanitize nested objects', () => {
      const data = {
        id: '1',
        organizationId: 'org-123',
        nested: {
          organizationId: 'org-456',
          value: 'test',
        },
      };
      const result = isolationService.sanitizeData(data, 'org-123');

      expect(result).toEqual({
        id: '1',
        organizationId: 'org-123',
        nested: {
          value: 'test',
        },
      });
    });

    it('should handle arrays', () => {
      const data = [
        { id: '1', organizationId: 'org-123' },
        { id: '2', organizationId: 'org-456' },
      ];
      const result = isolationService.sanitizeData(data, 'org-123');

      expect(result).toEqual([
        { id: '1', organizationId: 'org-123' },
        { id: '2' },
      ]);
    });

    it('should return null for null input', () => {
      const result = isolationService.sanitizeData(null, 'org-123');
      expect(result).toBeNull();
    });
  });

  describe('createOrganizationContext', () => {
    it('should create organization context', () => {
      const context = isolationService.createOrganizationContext('org-123');

      expect(context).toHaveProperty('organizationId', 'org-123');
      expect(context).toHaveProperty('filters');
      expect(context).toHaveProperty('validateAccess');
      expect(context).toHaveProperty('sanitizeData');

      expect(context.filters).toEqual({ organizationId: 'org-123' });
      expect(typeof context.validateAccess).toBe('function');
      expect(typeof context.sanitizeData).toBe('function');
    });

    it('should provide working validateAccess function', () => {
      const context = isolationService.createOrganizationContext('org-123');
      const validData = { organizationId: 'org-123' };
      const invalidData = { organizationId: 'org-456' };

      expect(context.validateAccess(validData)).toBe(true);
      expect(context.validateAccess(invalidData)).toBe(false);
    });

    it('should provide working sanitizeData function', () => {
      const context = isolationService.createOrganizationContext('org-123');
      const data = { id: '1', organizationId: 'org-456' };
      const result = context.sanitizeData(data);

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('executeWithIsolation', () => {
    it('should execute query with isolation', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
      const result = await isolationService.executeWithIsolation(mockQuery, 'org-123');

      expect(mockQuery).toHaveBeenCalledWith(mockPrisma);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });
  });
});

describe('OrganizationScopedService', () => {
  let mockPrisma: any;
  let mockIsolationService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    mockIsolationService = {
      addOrganizationFilter: jest.fn(),
      addNestedOrganizationFilter: jest.fn(),
      validateDataOwnership: jest.fn(),
      sanitizeData: jest.fn(),
    };

    // Mock the MultiTenantIsolationService constructor
    jest.spyOn(MultiTenantIsolationService.prototype, 'addOrganizationFilter').mockImplementation(mockIsolationService.addOrganizationFilter);
    jest.spyOn(MultiTenantIsolationService.prototype, 'addNestedOrganizationFilter').mockImplementation(mockIsolationService.addNestedOrganizationFilter);
    jest.spyOn(MultiTenantIsolationService.prototype, 'validateDataOwnership').mockImplementation(mockIsolationService.validateDataOwnership);
    jest.spyOn(MultiTenantIsolationService.prototype, 'sanitizeData').mockImplementation(mockIsolationService.sanitizeData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  class TestService extends OrganizationScopedService {
    constructor(organizationId: string, prisma: PrismaClient) {
      super(organizationId, prisma);
    }

    public testAddOrganizationFilter(where: any) {
      return this.addOrganizationFilter(where);
    }

    public testAddNestedOrganizationFilter(where: any, relationPath: string) {
      return this.addNestedOrganizationFilter(where, relationPath);
    }

    public testValidateOwnership(data: any) {
      return this.validateOwnership(data);
    }

    public testSanitizeData(data: any) {
      return this.sanitizeData(data);
    }
  }

  describe('OrganizationScopedService', () => {
    let service: TestService;

    beforeEach(() => {
      service = new TestService('org-123', mockPrisma);
    });

    it('should initialize with organization ID and Prisma client', () => {
      expect(service['organizationId']).toBe('org-123');
      expect(service['prisma']).toBe(mockPrisma);
      expect(service['isolationService']).toBeInstanceOf(MultiTenantIsolationService);
    });

    it('should delegate addOrganizationFilter to isolation service', () => {
      const where = { status: 'ACTIVE' };
      mockIsolationService.addOrganizationFilter.mockReturnValue({ ...where, organizationId: 'org-123' });

      const result = service.testAddOrganizationFilter(where);

      expect(mockIsolationService.addOrganizationFilter).toHaveBeenCalledWith(where, 'org-123');
      expect(result).toEqual({ status: 'ACTIVE', organizationId: 'org-123' });
    });

    it('should delegate addNestedOrganizationFilter to isolation service', () => {
      const where = { status: 'ACTIVE' };
      const relationPath = 'course';
      mockIsolationService.addNestedOrganizationFilter.mockReturnValue({
        ...where,
        course: { organizationId: 'org-123' },
      });

      const result = service.testAddNestedOrganizationFilter(where, relationPath);

      expect(mockIsolationService.addNestedOrganizationFilter).toHaveBeenCalledWith(where, 'org-123', relationPath);
      expect(result).toEqual({
        status: 'ACTIVE',
        course: { organizationId: 'org-123' },
      });
    });

    it('should delegate validateOwnership to isolation service', () => {
      const data = { organizationId: 'org-123' };
      mockIsolationService.validateDataOwnership.mockReturnValue(true);

      const result = service.testValidateOwnership(data);

      expect(mockIsolationService.validateDataOwnership).toHaveBeenCalledWith(data, 'org-123');
      expect(result).toBe(true);
    });

    it('should delegate sanitizeData to isolation service', () => {
      const data = { id: '1', organizationId: 'org-456' };
      const sanitized = { id: '1' };
      mockIsolationService.sanitizeData.mockReturnValue(sanitized);

      const result = service.testSanitizeData(data);

      expect(mockIsolationService.sanitizeData).toHaveBeenCalledWith(data, 'org-123');
      expect(result).toEqual(sanitized);
    });
  });
});

describe('Multi-tenant middleware', () => {
  it('should be defined', () => {
    // The middleware function is exported but not directly testable
    // It would be tested through integration tests
    expect(typeof require('../services/multi-tenant-isolation.service').withMultiTenantIsolation).toBe('function');
  });
});

describe('Row-level security policies', () => {
  it('should have policies for all tables', () => {
    const policies = require('../services/multi-tenant-isolation.service').ROW_LEVEL_SECURITY_POLICIES;
    
    expect(policies).toHaveProperty('users');
    expect(policies).toHaveProperty('courses');
    expect(policies).toHaveProperty('modules');
    expect(policies).toHaveProperty('lessons');
    expect(policies).toHaveProperty('quizzes');
    expect(policies).toHaveProperty('questions');
    expect(policies).toHaveProperty('enrollments');
    expect(policies).toHaveProperty('progress');
    expect(policies).toHaveProperty('quiz_attempts');
    expect(policies).toHaveProperty('audit_logs');
  });

  it('should have enable RLS command', () => {
    const enableRLS = require('../services/multi-tenant-isolation.service').ENABLE_ROW_LEVEL_SECURITY;
    
    expect(enableRLS).toContain('ENABLE ROW LEVEL SECURITY');
    expect(enableRLS).toContain('users');
    expect(enableRLS).toContain('courses');
    expect(enableRLS).toContain('modules');
    expect(enableRLS).toContain('lessons');
    expect(enableRLS).toContain('quizzes');
    expect(enableRLS).toContain('questions');
    expect(enableRLS).toContain('enrollments');
    expect(enableRLS).toContain('progress');
    expect(enableRLS).toContain('quiz_attempts');
    expect(enableRLS).toContain('audit_logs');
  });

  it('should have setOrganizationContext function', () => {
    const setContext = require('../services/multi-tenant-isolation.service').setOrganizationContext;
    
    expect(typeof setContext).toBe('function');
    
    const result = setContext('org-123');
    expect(result).toContain('org-123');
    expect(result).toContain('set_config');
  });
});
