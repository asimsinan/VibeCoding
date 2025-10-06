/**
 * Professional test module for UserModel
 * 
 * Tests cover:
 * - Unit functionality
 * - Integration points  
 * - Error scenarios
 * - Edge cases
 */

import { UserModelValidator } from '@/lib/whiteboard/models/UserModel'

describe('UserModel', () => {
  describe('validateDisplayName', () => {
    it('should validate valid user display name', () => {
      const validDisplayName = 'John Doe'
      
      const result = UserModelValidator.validateDisplayName(validDisplayName)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty user display name', () => {
      const invalidDisplayName = ''
      
      const result = UserModelValidator.validateDisplayName(invalidDisplayName)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('displayName')
    })

    it('should reject too long user display name', () => {
      const invalidDisplayName = 'x'.repeat(51) // Too long
      
      const result = UserModelValidator.validateDisplayName(invalidDisplayName)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('displayName')
    })
  })

  describe('validatePosition', () => {
    it('should validate valid user position', () => {
      const validPosition = { x: 100, y: 200 }
      
      const result = UserModelValidator.validatePosition(validPosition)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid user position', () => {
      const invalidPosition = { x: 'invalid', y: 200 }
      
      const result = UserModelValidator.validatePosition(invalidPosition)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('position')
    })
  })

  describe('validateUpdatePresenceParams', () => {
    it('should validate valid update user presence parameters', () => {
      const validParams = {
        cursorPosition: { x: 100, y: 200 }
      }
      
      const result = UserModelValidator.validateUpdatePresenceParams(validParams)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid update user presence parameters', () => {
      const invalidParams = {
        cursorPosition: { x: 'invalid', y: 200 }
      }
      
      const result = UserModelValidator.validateUpdatePresenceParams(invalidParams)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('params')
    })
  })

  describe('sanitizeUser', () => {
    it('should sanitize user data', () => {
      const partialUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'Test User' // Add minimum required display name
      }
      
      const sanitized = UserModelValidator.sanitizeUser(partialUser)
      
      expect(sanitized.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(sanitized.displayName).toBe('Test User')
      expect(sanitized.lastSeen).toBeInstanceOf(Date)
    })
  })

  describe('isUserActive', () => {
    it('should identify recent user as active', () => {
      const recentUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        cursorPosition: { x: 100, y: 200 }
      }
      
      const result = UserModelValidator.isUserActive(recentUser, 5) // 5 minute threshold
      
      expect(result).toBe(true)
    })

    it('should identify old user as inactive', () => {
      const oldUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        cursorPosition: { x: 100, y: 200 }
      }
      
      const result = UserModelValidator.isUserActive(oldUser, 5) // 5 minute threshold
      
      expect(result).toBe(false)
    })
  })

  describe('getUsersByActivity', () => {
    it('should get users by activity status', () => {
      const users = [
        {
          id: '1',
          displayName: 'Active User',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          cursorPosition: { x: 100, y: 200 }
        },
        {
          id: '2',
          displayName: 'Inactive User',
          lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          cursorPosition: { x: 300, y: 400 }
        }
      ]
      
      const activeUsers = UserModelValidator.getUsersByActivity(users, true)
      const inactiveUsers = UserModelValidator.getUsersByActivity(users, false)
      
      expect(activeUsers).toHaveLength(1)
      expect(activeUsers[0].id).toBe('1')
      expect(inactiveUsers).toHaveLength(1)
      expect(inactiveUsers[0].id).toBe('2')
    })
  })

  describe('getUserCountByActivity', () => {
    it('should get user count by activity status', () => {
      const users = [
        {
          id: '1',
          displayName: 'Active User',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          cursorPosition: { x: 100, y: 200 }
        },
        {
          id: '2',
          displayName: 'Inactive User',
          lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          cursorPosition: { x: 300, y: 400 }
        }
      ]
      
      const activeCount = UserModelValidator.getUserCountByActivity(users, true)
      const inactiveCount = UserModelValidator.getUserCountByActivity(users, false)
      
      expect(activeCount).toBe(1)
      expect(inactiveCount).toBe(1)
    })
  })

  describe('getUserDisplayName', () => {
    it('should get user display name', () => {
      const userWithName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      const userWithoutName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: '',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      
      const displayNameWith = UserModelValidator.getUserDisplayName(userWithName)
      const displayNameWithout = UserModelValidator.getUserDisplayName(userWithoutName)
      
      expect(displayNameWith).toBe('John Doe')
      expect(displayNameWithout).toBe('User 123e4567')
    })
  })

  describe('getUserInitials', () => {
    it('should get user initials', () => {
      const userSingleName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      const userFullName = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      
      const initialsSingle = UserModelValidator.getUserInitials(userSingleName)
      const initialsFull = UserModelValidator.getUserInitials(userFullName)
      
      expect(initialsSingle).toBe('JO')
      expect(initialsFull).toBe('JD')
    })
  })

  describe('getUserColor', () => {
    it('should get user color', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      
      const color = UserModelValidator.getUserColor(user)
      
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe('getUserAvatarUrl', () => {
    it('should get user avatar URL', () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        displayName: 'John Doe',
        lastSeen: new Date(),
        cursorPosition: { x: 100, y: 200 }
      }
      
      const avatarUrl = UserModelValidator.getUserAvatarUrl(user)
      
      expect(avatarUrl).toMatch(/^https:\/\/ui-avatars\.com\/api\//)
      expect(avatarUrl).toContain('John%20Doe')
    })
  })

  describe('getUserStatistics', () => {
    it('should get user statistics', () => {
      const users = [
        {
          id: '1',
          displayName: 'Active User',
          lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          cursorPosition: { x: 100, y: 200 }
        },
        {
          id: '2',
          displayName: 'Inactive User',
          lastSeen: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          cursorPosition: null
        }
      ]
      
      const stats = UserModelValidator.getUserStatistics(users)
      
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(1)
      expect(stats.inactive).toBe(1)
      expect(stats.withCursor).toBe(2)
    })
  })
})