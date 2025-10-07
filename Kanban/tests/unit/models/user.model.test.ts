// Unit tests for User model
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserModel } from '@/lib/database/models/user.model';

// Mock Supabase client
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

const mockSupabase = {
  from: jest.fn(() => mockQueryBuilder),
};

// Mock createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('UserModel', () => {
  let userModel: UserModel;

  beforeEach(() => {
    userModel = new UserModel('test-url', 'test-key');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile when found', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            task_assigned: true,
            task_due: true,
            task_completed: false,
          },
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await userModel.getProfile('user-1');

      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await userModel.getProfile('nonexistent-user');

      expect(result).toBeNull();
    });

    it('should throw error when database error occurs', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(userModel.getProfile('user-1')).rejects.toThrow(
        'Failed to get user profile: Database connection failed'
      );
    });
  });

  describe('createProfile', () => {
    it('should create user profile successfully', async () => {
      const profileData = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        preferences: {
          theme: 'dark' as const,
          notifications: {
            email: true,
            push: false,
            task_assigned: true,
            task_due: true,
            task_completed: false,
          },
        },
      };

      const mockResponse = {
        ...profileData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await userModel.createProfile(profileData);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error when creation fails', async () => {
      const profileData = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        preferences: {},
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      });

      await expect(userModel.createProfile(profileData)).rejects.toThrow(
        'Failed to create user profile: Email already exists'
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        name: 'Updated Name',
        preferences: {
          theme: 'light' as const,
        },
      };

      const mockResponse = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated Name',
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            task_assigned: true,
            task_due: true,
            task_completed: false,
          },
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await userModel.updateProfile('user-1', updates);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error when update fails', async () => {
      const updates = { name: 'Updated Name' };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(userModel.updateProfile('user-1', updates)).rejects.toThrow(
        'Failed to update user profile: User not found'
      );
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile successfully', async () => {
      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      await userModel.deleteProfile('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(userModel.deleteProfile('user-1')).rejects.toThrow(
        'Failed to delete user profile: User not found'
      );
    });
  });

  describe('searchUsers', () => {
    it('should search users by name or email', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'john@example.com',
          name: 'John Doe',
          preferences: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          preferences: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.from().select().or().limit().mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await userModel.searchUsers('john', 10);

      expect(result).toEqual(mockUsers);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error when search fails', async () => {
      mockSupabase.from().select().or().limit().mockResolvedValue({
        data: null,
        error: { message: 'Search failed' },
      });

      await expect(userModel.searchUsers('john')).rejects.toThrow(
        'Failed to search users: Search failed'
      );
    });
  });

  describe('hasWorkspaceAccess', () => {
    it('should return true when user has access', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { id: 'membership-1' },
        error: null,
      });

      const result = await userModel.hasWorkspaceAccess('user-1', 'workspace-1');

      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await userModel.hasWorkspaceAccess('user-1', 'workspace-1');

      expect(result).toBe(false);
    });

    it('should throw error when check fails', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(userModel.hasWorkspaceAccess('user-1', 'workspace-1')).rejects.toThrow(
        'Failed to check workspace access: Database error'
      );
    });
  });

  describe('getWorkspaceRole', () => {
    it('should return user role when found', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const result = await userModel.getWorkspaceRole('user-1', 'workspace-1');

      expect(result).toBe('admin');
    });

    it('should return null when user has no membership', async () => {
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await userModel.getWorkspaceRole('user-1', 'workspace-1');

      expect(result).toBeNull();
    });
  });
});
