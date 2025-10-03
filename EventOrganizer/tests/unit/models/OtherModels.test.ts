import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  SessionSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  SessionService,
  SessionValidator,
  SessionStatus,
  SessionType,
  Session,
  CreateSessionRequest,
  UpdateSessionRequest
} from '../../../src/lib/models/Session'

import {
  AttendeeSchema,
  CreateAttendeeSchema,
  UpdateAttendeeSchema,
  AttendeeService,
  AttendeeValidator,
  AttendeeStatus,
  AttendeeType,
  Attendee,
  CreateAttendeeRequest,
  UpdateAttendeeRequest
} from '../../../src/lib/models/Attendee'

import {
  NotificationSchema,
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationService,
  NotificationValidator,
  NotificationType,
  NotificationStatus,
  DeliveryMethod,
  NotificationPriority,
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest
} from '../../../src/lib/models/Notification'

import {
  ConnectionSchema,
  CreateConnectionSchema,
  UpdateConnectionSchema,
  ConnectionService,
  ConnectionValidator,
  ConnectionStatus,
  ConnectionType,
  Connection,
  CreateConnectionRequest,
  UpdateConnectionRequest
} from '../../../src/lib/models/Connection'

import {
  MessageSchema,
  CreateMessageSchema,
  UpdateMessageSchema,
  MessageService,
  MessageValidator,
  MessageType,
  MessageStatus,
  MessagePriority,
  Message,
  CreateMessageRequest,
  UpdateMessageRequest
} from '../../../src/lib/models/Message'

import {
  EventAnalyticsSchema,
  CreateEventAnalyticsSchema,
  UpdateEventAnalyticsSchema,
  AnalyticsService,
  AnalyticsValidator,
  AnalyticsMetricType,
  AnalyticsPeriod,
  AnalyticsAggregationType,
  EventAnalytics,
  CreateEventAnalyticsRequest,
  UpdateEventAnalyticsRequest
} from '../../../src/lib/models/EventAnalytics'

describe('Session Model Tests', () => {
  let validSession: Session
  let validCreateSessionRequest: CreateSessionRequest
  let validUpdateSessionRequest: UpdateSessionRequest

  beforeEach(() => {
    validSession = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Introduction to React',
      description: 'Learn the basics of React development',
      speaker: {
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'Experienced React developer',
        title: 'Senior Developer',
        company: 'Tech Corp',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        twitterUrl: 'https://twitter.com/johndoe',
        avatarUrl: 'https://example.com/avatar.jpg',
        isExternal: false
      },
      startTime: '2026-06-01T10:00:00Z',
      endTime: '2026-06-01T11:00:00Z',
      status: 'scheduled',
      type: 'presentation',
      currentAttendees: 0,
      metadata: {
        tags: ['react', 'frontend'],
        difficulty: 'beginner',
        language: 'en',
        recordingEnabled: true,
        chatEnabled: true,
        qaEnabled: true,
        pollsEnabled: false,
        breakoutRoomsEnabled: false,
        maxAttendees: 100,
        materials: [
          {
            title: 'React Slides',
            url: 'https://example.com/slides.pdf',
            type: 'pdf'
          },
          {
            title: 'Demo Files',
            url: 'https://example.com/demo.zip',
            type: 'other'
          }
        ],
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateSessionRequest = {
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Advanced React Patterns',
      description: 'Learn advanced React patterns and best practices',
      speaker: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        bio: 'Advanced React expert',
        title: 'Lead Developer',
        company: 'React Corp',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        twitterUrl: 'https://twitter.com/janesmith',
        avatarUrl: 'https://example.com/jane-avatar.jpg',
        isExternal: false
      },
      startTime: '2026-06-01T14:00:00Z',
      endTime: '2026-06-01T15:00:00Z',
      status: 'scheduled' as const,
      type: 'workshop' as const,
      meetingLink: 'https://zoom.us/j/987654321',
      meetingPassword: 'password456',
      meetingId: '987654321',
      materialsUrl: 'https://example.com/workshop-materials',
      recordingUrl: 'https://example.com/workshop-recording',
      thumbnailUrl: 'https://example.com/workshop-thumbnail.jpg',
      metadata: {
        tags: ['react', 'advanced'],
        difficulty: 'advanced',
        language: 'en',
        recordingEnabled: true,
        chatEnabled: true,
        qaEnabled: true,
        pollsEnabled: true,
        breakoutRoomsEnabled: false,
        maxAttendees: 50,
        materials: [],
        customFields: {}
      }
    }

    validUpdateSessionRequest = {
      title: 'Updated React Session',
      description: 'Updated description',
      speaker: {
        name: 'Updated Speaker',
        email: 'updated@example.com',
        bio: 'Updated bio',
        title: 'Updated Title',
        company: 'Updated Company',
        isExternal: false
      }
    }
  })

  describe('Session Schema Validation', () => {
    it('should validate a valid session', () => {
      const result = SessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    it('should reject session with invalid UUID', () => {
      const invalidSession = { ...validSession, id: 'invalid-uuid' }
      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject session with empty title', () => {
      const invalidSession = { ...validSession, title: '' }
      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })

    it('should reject session with end time before start time', () => {
      const invalidSession = { 
        ...validSession, 
        startTime: '2024-06-01T11:00:00Z',
        endTime: '2024-06-01T10:00:00Z'
      }
      const result = SessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['endTime'])
      }
    })
  })

  describe('SessionService', () => {
    it('should check if session is scheduled', () => {
      const result = SessionService.isScheduled(validSession)
      expect(result).toBe(true)
    })

    it('should check if session is live', () => {
      const now = new Date()
      const liveSession = { 
        ...validSession, 
        status: 'live' as const,
        startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1 hour from now
      }
      const result = SessionService.isLive(liveSession)
      expect(result).toBe(true)
    })

    it('should check if session is ended', () => {
      const endedSession = { ...validSession, status: 'ended' as const }
      const result = SessionService.isEnded(endedSession)
      expect(result).toBe(true)
    })

    it('should get session duration in minutes', () => {
      const result = SessionService.getDurationMinutes(validSession)
      expect(result).toBe(60)
    })

    it('should check if session is starting soon', () => {
      const soonSession = { 
        ...validSession, 
        startTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      }
      const result = SessionService.isStartingSoon(soonSession)
      expect(result).toBe(true)
    })
  })
})

describe('Attendee Model Tests', () => {
  let validAttendee: Attendee
  let validCreateAttendeeRequest: CreateAttendeeRequest
  let validUpdateAttendeeRequest: UpdateAttendeeRequest

  beforeEach(() => {
    validAttendee = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      status: 'registered',
      type: 'attendee',
      registrationDate: '2023-01-01T00:00:00Z',
      checkInDate: undefined,
      checkOutDate: undefined,
      metadata: {
        dietaryRequirements: 'Vegetarian',
        accessibilityNeeds: 'Wheelchair access',
        emergencyContact: 'John Doe - 555-1234',
        tshirtSize: 'M',
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateAttendeeRequest = {
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      status: 'registered' as const,
      type: 'attendee' as const,
      metadata: {
        dietaryRequirements: 'Vegan',
        accessibilityNeeds: 'Sign language interpreter',
        emergencyContact: 'Jane Smith - 555-5678',
        tshirtSize: 'L' as const,
        customFields: {}
      }
    }

    validUpdateAttendeeRequest = {
      status: 'checked_in' as const,
      checkInDate: '2023-01-01T09:00:00Z'
    }
  })

  describe('Attendee Schema Validation', () => {
    it('should validate a valid attendee', () => {
      const result = AttendeeSchema.safeParse(validAttendee)
      expect(result.success).toBe(true)
    })

    it('should reject attendee with invalid UUID', () => {
      const invalidAttendee = { ...validAttendee, id: 'invalid-uuid' }
      const result = AttendeeSchema.safeParse(invalidAttendee)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject attendee with invalid status', () => {
      const invalidAttendee = { ...validAttendee, status: 'invalid-status' as AttendeeStatus }
      const result = AttendeeSchema.safeParse(invalidAttendee)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['status'])
      }
    })
  })

  describe('AttendeeService', () => {
    it('should check if attendee is registered', () => {
      const result = AttendeeService.isRegistered(validAttendee)
      expect(result).toBe(true)
    })

    it('should check if attendee is checked in', () => {
      const checkedInAttendee = { ...validAttendee, status: 'checked_in' as const }
      const result = AttendeeService.isCheckedIn(checkedInAttendee)
      expect(result).toBe(true)
    })

    it('should check if attendee is cancelled', () => {
      const cancelledAttendee = { ...validAttendee, status: 'cancelled' as const }
      const result = AttendeeService.isCancelled(cancelledAttendee)
      expect(result).toBe(true)
    })

    it('should get attendee age in days', () => {
      const result = AttendeeService.getAgeDays(validAttendee)
      expect(result).toBeGreaterThan(0)
    })
  })
})

describe('Notification Model Tests', () => {
  let validNotification: Notification
  let validCreateNotificationRequest: CreateNotificationRequest
  let validUpdateNotificationRequest: UpdateNotificationRequest

  beforeEach(() => {
    validNotification = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      recipientId: '123e4567-e89b-12d3-a456-426614174001',
      senderId: '123e4567-e89b-12d3-a456-426614174002',
      type: 'event_update',
      title: 'Event Update',
      message: 'Your event has been updated',
      status: 'pending',
      priority: 'normal',
      deliveryMethod: 'push',
      scheduledFor: undefined,
      sentAt: undefined,
      deliveredAt: undefined,
      readAt: undefined,
      expiresAt: undefined,
      metadata: {
        eventId: '123e4567-e89b-12d3-a456-426614174003',
        actionUrl: 'https://example.com/event/123',
        actionText: 'View Event',
        imageUrl: 'https://example.com/notification.jpg',
        soundEnabled: true,
        vibrationEnabled: true,
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateNotificationRequest = {
      recipientId: '123e4567-e89b-12d3-a456-426614174001',
      senderId: '123e4567-e89b-12d3-a456-426614174002',
      type: 'session_reminder',
      title: 'Session Reminder',
      message: 'Your session starts in 15 minutes',
      priority: 'high',
      deliveryMethod: 'push',
      metadata: {
        sessionId: '123e4567-e89b-12d3-a456-426614174004',
        actionUrl: 'https://example.com/session/123',
        actionText: 'Join Session',
        soundEnabled: true,
        vibrationEnabled: true,
        customFields: {}
      }
    }

    validUpdateNotificationRequest = {
      status: 'sent' as const,
      sentAt: '2023-01-01T00:05:00Z'
    }
  })

  describe('Notification Schema Validation', () => {
    it('should validate a valid notification', () => {
      const result = NotificationSchema.safeParse(validNotification)
      expect(result.success).toBe(true)
    })

    it('should reject notification with invalid UUID', () => {
      const invalidNotification = { ...validNotification, id: 'invalid-uuid' }
      const result = NotificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject notification with empty title', () => {
      const invalidNotification = { ...validNotification, title: '' }
      const result = NotificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })

    it('should reject notification with empty message', () => {
      const invalidNotification = { ...validNotification, message: '' }
      const result = NotificationSchema.safeParse(invalidNotification)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['message'])
      }
    })
  })

  describe('NotificationService', () => {
    it('should check if notification is pending', () => {
      const result = NotificationService.isPending(validNotification)
      expect(result).toBe(true)
    })

    it('should check if notification is sent', () => {
      const sentNotification = { ...validNotification, status: 'sent' as const }
      const result = NotificationService.isSent(sentNotification)
      expect(result).toBe(true)
    })

    it('should check if notification is delivered', () => {
      const deliveredNotification = { ...validNotification, status: 'delivered' as const }
      const result = NotificationService.isDelivered(deliveredNotification)
      expect(result).toBe(true)
    })

    it('should check if notification is read', () => {
      const readNotification = { ...validNotification, status: 'read' as const }
      const result = NotificationService.isRead(readNotification)
      expect(result).toBe(true)
    })

    it('should check if notification is failed', () => {
      const failedNotification = { ...validNotification, status: 'failed' as const }
      const result = NotificationService.isFailed(failedNotification)
      expect(result).toBe(true)
    })

    it('should get notification age in minutes', () => {
      const result = NotificationService.getAgeMinutes(validNotification)
      expect(result).toBeGreaterThan(0)
    })

    it('should check if notification is urgent', () => {
      const urgentNotification = { ...validNotification, priority: 'urgent' as const }
      const result = NotificationService.isUrgent(urgentNotification)
      expect(result).toBe(true)
    })
  })
})

describe('Connection Model Tests', () => {
  let validConnection: Connection
  let validCreateConnectionRequest: CreateConnectionRequest
  let validUpdateConnectionRequest: UpdateConnectionRequest

  beforeEach(() => {
    validConnection = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      requesterId: '123e4567-e89b-12d3-a456-426614174001',
      addresseeId: '123e4567-e89b-12d3-a456-426614174002',
      status: 'pending',
      type: 'professional',
      message: 'Hi, I would like to connect with you',
      metadata: {
        sharedInterests: ['technology', 'web development'],
        sharedEvents: ['123e4567-e89b-12d3-a456-426614174003'],
        connectionStrength: 75,
        tags: ['colleague', 'mentor'],
        notes: 'Met at tech conference',
        customFields: {}
      },
      requestedAt: '2023-01-01T00:00:00Z',
      respondedAt: undefined,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateConnectionRequest = {
      requesterId: '123e4567-e89b-12d3-a456-426614174001',
      addresseeId: '123e4567-e89b-12d3-a456-426614174002',
      type: 'professional' as const,
      message: 'Hi, I would like to connect with you',
      requestedAt: '2023-01-01T00:00:00Z',
      metadata: {
        sharedInterests: ['technology', 'web development'],
        sharedEvents: ['123e4567-e89b-12d3-a456-426614174003'],
        connectionStrength: 75,
        tags: ['colleague'],
        customFields: {}
      }
    }

    validUpdateConnectionRequest = {
      status: 'accepted' as const,
      respondedAt: '2023-01-01T00:05:00Z'
    }
  })

  describe('Connection Schema Validation', () => {
    it('should validate a valid connection', () => {
      const result = ConnectionSchema.safeParse(validConnection)
      expect(result.success).toBe(true)
    })

    it('should reject connection with invalid UUID', () => {
      const invalidConnection = { ...validConnection, id: 'invalid-uuid' }
      const result = ConnectionSchema.safeParse(invalidConnection)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject connection with same requester and addressee', () => {
      const invalidConnection = { 
        ...validConnection, 
        requesterId: '123e4567-e89b-12d3-a456-426614174001',
        addresseeId: '123e4567-e89b-12d3-a456-426614174001'
      }
      const result = ConnectionSchema.safeParse(invalidConnection)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['addresseeId'])
      }
    })
  })

  describe('ConnectionService', () => {
    it('should check if connection is pending', () => {
      const result = ConnectionService.isPending(validConnection)
      expect(result).toBe(true)
    })

    it('should check if connection is accepted', () => {
      const acceptedConnection = { ...validConnection, status: 'accepted' as const }
      const result = ConnectionService.isAccepted(acceptedConnection)
      expect(result).toBe(true)
    })

    it('should check if connection is declined', () => {
      const declinedConnection = { ...validConnection, status: 'declined' as const }
      const result = ConnectionService.isDeclined(declinedConnection)
      expect(result).toBe(true)
    })

    it('should check if connection is blocked', () => {
      const blockedConnection = { ...validConnection, status: 'blocked' as const }
      const result = ConnectionService.isBlocked(blockedConnection)
      expect(result).toBe(true)
    })

    it('should check if connection is active', () => {
      const activeConnection = { ...validConnection, status: 'accepted' as const }
      const result = ConnectionService.isActive(activeConnection)
      expect(result).toBe(true)
    })

    it('should get connection age in hours', () => {
      const result = ConnectionService.getAgeHours(validConnection)
      expect(result).toBeGreaterThan(0)
    })

    it('should get connection strength', () => {
      const result = ConnectionService.getConnectionStrength(validConnection)
      expect(result).toBe(75)
    })

    it('should check if connection has shared interests', () => {
      const result = ConnectionService.hasSharedInterests(validConnection)
      expect(result).toBe(true)
    })

    it('should check if connection has shared events', () => {
      const result = ConnectionService.hasSharedEvents(validConnection)
      expect(result).toBe(true)
    })
  })
})

describe('Message Model Tests', () => {
  let validMessage: Message
  let validCreateMessageRequest: CreateMessageRequest
  let validUpdateMessageRequest: UpdateMessageRequest

  beforeEach(() => {
    validMessage = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      connectionId: '123e4567-e89b-12d3-a456-426614174001',
      senderId: '123e4567-e89b-12d3-a456-426614174002',
      receiverId: '123e4567-e89b-12d3-a456-426614174003',
      type: 'text',
      content: 'Hello, how are you?',
      status: 'sent',
      priority: 'normal',
      metadata: {
        replyToMessageId: undefined,
        isEncrypted: false,
        customFields: {}
      },
      sentAt: '2023-01-01T00:00:00Z',
      deliveredAt: undefined,
      readAt: undefined,
      editedAt: undefined,
      deletedAt: undefined,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateMessageRequest = {
      connectionId: '123e4567-e89b-12d3-a456-426614174001',
      senderId: '123e4567-e89b-12d3-a456-426614174002',
      receiverId: '123e4567-e89b-12d3-a456-426614174003',
      type: 'text' as const,
      content: 'Hello, how are you?',
      priority: 'normal' as const,
      sentAt: '2023-01-01T00:00:00Z',
      metadata: {
        isEncrypted: false,
        customFields: {}
      }
    }

    validUpdateMessageRequest = {
      status: 'delivered' as const,
      deliveredAt: '2023-01-01T00:05:00Z'
    }
  })

  describe('Message Schema Validation', () => {
    it('should validate a valid message', () => {
      const result = MessageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should reject message with invalid UUID', () => {
      const invalidMessage = { ...validMessage, id: 'invalid-uuid' }
      const result = MessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject message with empty content', () => {
      const invalidMessage = { ...validMessage, content: '' }
      const result = MessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['content'])
      }
    })

    it('should reject message with content exceeding 2000 characters', () => {
      const invalidMessage = { ...validMessage, content: 'a'.repeat(2001) }
      const result = MessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['content'])
      }
    })
  })

  describe('MessageService', () => {
    it('should check if message is sent', () => {
      const result = MessageService.isSent(validMessage)
      expect(result).toBe(true)
    })

    it('should check if message is delivered', () => {
      const deliveredMessage = { ...validMessage, status: 'delivered' as const }
      const result = MessageService.isDelivered(deliveredMessage)
      expect(result).toBe(true)
    })

    it('should check if message is read', () => {
      const readMessage = { ...validMessage, status: 'read' as const }
      const result = MessageService.isRead(readMessage)
      expect(result).toBe(true)
    })

    it('should check if message is failed', () => {
      const failedMessage = { ...validMessage, status: 'failed' as const }
      const result = MessageService.isFailed(failedMessage)
      expect(result).toBe(true)
    })

    it('should check if message is deleted', () => {
      const deletedMessage = { ...validMessage, status: 'deleted' as const }
      const result = MessageService.isDeleted(deletedMessage)
      expect(result).toBe(true)
    })

    it('should check if message is active', () => {
      const result = MessageService.isActive(validMessage)
      expect(result).toBe(true)
    })

    it('should check if message can be edited', () => {
      const result = MessageService.canEdit(validMessage)
      expect(result).toBe(false) // Message is not recent
    })

    it('should check if message can be deleted', () => {
      const result = MessageService.canDelete(validMessage)
      expect(result).toBe(true)
    })

    it('should check if message can be replied to', () => {
      const result = MessageService.canReply(validMessage)
      expect(result).toBe(true)
    })

    it('should check if message is a reply', () => {
      const result = MessageService.isReply(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message is a file', () => {
      const result = MessageService.isFile(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message is an image', () => {
      const result = MessageService.isImage(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message is a link', () => {
      const result = MessageService.isLink(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message is a system message', () => {
      const result = MessageService.isSystem(validMessage)
      expect(result).toBe(false)
    })

    it('should get message age in minutes', () => {
      const result = MessageService.getAgeMinutes(validMessage)
      expect(result).toBeGreaterThan(0)
    })

    it('should check if message is recent', () => {
      const result = MessageService.isRecent(validMessage)
      expect(result).toBe(false) // Message is not recent
    })

    it('should check if message is urgent', () => {
      const urgentMessage = { ...validMessage, priority: 'urgent' as const }
      const result = MessageService.isUrgent(urgentMessage)
      expect(result).toBe(true)
    })

    it('should get message delivery status', () => {
      const result = MessageService.getDeliveryStatus(validMessage)
      expect(result).toBe('sent')
    })

    it('should check if message is encrypted', () => {
      const result = MessageService.isEncrypted(validMessage)
      expect(result).toBe(false)
    })

    it('should get message priority score', () => {
      const result = MessageService.getPriorityScore(validMessage)
      expect(result).toBe(2) // normal priority
    })

    it('should get message type display text', () => {
      const result = MessageService.getTypeDisplayText(validMessage)
      expect(result).toBe('Text')
    })

    it('should get message status display text', () => {
      const result = MessageService.getStatusDisplayText(validMessage)
      expect(result).toBe('Sent')
    })

    it('should check if message has event context', () => {
      const result = MessageService.hasEventContext(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message has session context', () => {
      const result = MessageService.hasSessionContext(validMessage)
      expect(result).toBe(false)
    })

    it('should check if message can be forwarded', () => {
      const result = MessageService.canForward(validMessage)
      expect(result).toBe(true)
    })

    it('should check if message can be copied', () => {
      const result = MessageService.canCopy(validMessage)
      expect(result).toBe(true)
    })

    it('should get message preview text', () => {
      const result = MessageService.getPreviewText(validMessage)
      expect(result).toBe('Hello, how are you?')
    })
  })
})

describe('Event Analytics Model Tests', () => {
  let validEventAnalytics: EventAnalytics
  let validCreateEventAnalyticsRequest: CreateEventAnalyticsRequest
  let validUpdateEventAnalyticsRequest: UpdateEventAnalyticsRequest

  beforeEach(() => {
    validEventAnalytics = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      metricType: 'registration',
      value: 150,
      aggregationType: 'count',
      period: 'day',
      periodStart: '2023-01-01T00:00:00Z',
      periodEnd: '2023-01-01T23:59:59Z',
      metadata: {
        sessionId: undefined,
        attendeeId: undefined,
        connectionId: undefined,
        messageId: undefined,
        feedbackId: undefined,
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateEventAnalyticsRequest = {
      eventId: '123e4567-e89b-12d3-a456-426614174001',
      metricType: 'check_in',
      value: 120,
      aggregationType: 'count',
      period: 'day',
      periodStart: '2023-01-01T00:00:00Z',
      periodEnd: '2023-01-01T23:59:59Z',
      metadata: {
        customFields: {}
      }
    }

    validUpdateEventAnalyticsRequest = {
      value: 125
    }
  })

  describe('Event Analytics Schema Validation', () => {
    it('should validate a valid event analytics', () => {
      const result = EventAnalyticsSchema.safeParse(validEventAnalytics)
      expect(result.success).toBe(true)
    })

    it('should reject event analytics with invalid UUID', () => {
      const invalidAnalytics = { ...validEventAnalytics, id: 'invalid-uuid' }
      const result = EventAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject event analytics with negative value', () => {
      const invalidAnalytics = { ...validEventAnalytics, value: -1 }
      const result = EventAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['value'])
      }
    })

    it('should reject event analytics with invalid metric type', () => {
      const invalidAnalytics = { ...validEventAnalytics, metricType: 'invalid-metric' as AnalyticsMetricType }
      const result = EventAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['metricType'])
      }
    })

    it('should reject event analytics with invalid aggregation type', () => {
      const invalidAnalytics = { ...validEventAnalytics, aggregationType: 'invalid-aggregation' as AnalyticsAggregationType }
      const result = EventAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['aggregationType'])
      }
    })

    it('should reject event analytics with invalid period', () => {
      const invalidAnalytics = { ...validEventAnalytics, period: 'invalid-period' as AnalyticsPeriod }
      const result = EventAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['period'])
      }
    })
  })

  describe('AnalyticsService', () => {
    it('should check if analytics is for registration', () => {
      const result = AnalyticsService.isRegistration(validEventAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for check-in', () => {
      const checkInAnalytics = { ...validEventAnalytics, metricType: 'check_in' as const }
      const result = AnalyticsService.isCheckIn(checkInAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for session attendance', () => {
      const sessionAnalytics = { ...validEventAnalytics, metricType: 'session_attendance' as const }
      const result = AnalyticsService.isSessionAttendance(sessionAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for connection', () => {
      const connectionAnalytics = { ...validEventAnalytics, metricType: 'connection_made' as const }
      const result = AnalyticsService.isConnection(connectionAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for message', () => {
      const messageAnalytics = { ...validEventAnalytics, metricType: 'message_sent' as const }
      const result = AnalyticsService.isMessage(messageAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for feedback', () => {
      const feedbackAnalytics = { ...validEventAnalytics, metricType: 'feedback_submitted' as const }
      const result = AnalyticsService.isFeedback(feedbackAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for engagement', () => {
      const engagementAnalytics = { ...validEventAnalytics, metricType: 'engagement_score' as const }
      const result = AnalyticsService.isEngagement(engagementAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for completion', () => {
      const completionAnalytics = { ...validEventAnalytics, metricType: 'event_completion' as const }
      const result = AnalyticsService.isCompletion(completionAnalytics)
      expect(result).toBe(true)
    })

    it('should check if analytics is for networking', () => {
      const networkingAnalytics = { ...validEventAnalytics, metricType: 'networking_activity' as const }
      const result = AnalyticsService.isNetworking(networkingAnalytics)
      expect(result).toBe(true)
    })

    it('should get analytics period duration in hours', () => {
      const result = AnalyticsService.getPeriodDurationHours(validEventAnalytics)
      expect(result).toBe(24) // 1 day
    })

    it('should check if analytics is recent', () => {
      const result = AnalyticsService.isRecent(validEventAnalytics)
      expect(result).toBe(false) // Analytics is not recent
    })

    it('should get analytics value as percentage', () => {
      const percentageAnalytics = { ...validEventAnalytics, metricType: 'engagement_score' as const, value: 85 }
      const result = AnalyticsService.getValueAsPercentage(percentageAnalytics)
      expect(result).toBe(85)
    })

    it('should get analytics value as count', () => {
      const result = AnalyticsService.getValueAsCount(validEventAnalytics)
      expect(result).toBe(150)
    })

    it('should get analytics aggregation type display text', () => {
      const result = AnalyticsService.getAggregationTypeDisplayText(validEventAnalytics)
      expect(result).toBe('Count')
    })

    it('should get analytics period display text', () => {
      const result = AnalyticsService.getPeriodDisplayText(validEventAnalytics)
      expect(result).toBe('Day')
    })

    it('should get analytics metric type display text', () => {
      const result = AnalyticsService.getMetricTypeDisplayText(validEventAnalytics)
      expect(result).toBe('Registrations')
    })

    it('should check if analytics has session context', () => {
      const result = AnalyticsService.hasSessionContext(validEventAnalytics)
      expect(result).toBe(false)
    })

    it('should check if analytics has attendee context', () => {
      const result = AnalyticsService.hasAttendeeContext(validEventAnalytics)
      expect(result).toBe(false)
    })

    it('should check if analytics has connection context', () => {
      const result = AnalyticsService.hasConnectionContext(validEventAnalytics)
      expect(result).toBe(false)
    })

    it('should check if analytics is aggregated', () => {
      const result = AnalyticsService.isAggregated(validEventAnalytics)
      expect(result).toBe(false) // count is not aggregated
    })

    it('should get analytics trend direction', () => {
      const result = AnalyticsService.getTrendDirection(150, 100)
      expect(result).toBe('up')
    })

    it('should calculate analytics growth rate', () => {
      const result = AnalyticsService.calculateGrowthRate(150, 100)
      expect(result).toBe(50) // 50% growth
    })

    it('should check if analytics value is significant', () => {
      const result = AnalyticsService.isSignificant(validEventAnalytics)
      expect(result).toBe(true) // 150 registrations is significant
    })

    it('should get analytics quality score', () => {
      const result = AnalyticsService.getQualityScore(validEventAnalytics)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  })
})
