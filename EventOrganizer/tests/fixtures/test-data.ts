// Simple UUID v4 generator for testing
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
import {
  CreateEventRequest,
  UpdateEventRequest,
  EventRegistrationRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
  SendNotificationRequest,
  ConnectionRequest,
  EventListQuery,
  AttendeeListQuery,
  ConnectionListQuery,
  Event,
  Session,
  Attendee,
  User,
  Notification,
  Connection,
  Pagination
} from '@/contracts/types'

// Test UUIDs for consistent testing
export const TEST_UUIDS = {
  EVENT_1: '123e4567-e89b-12d3-a456-426614174000',
  EVENT_2: '123e4567-e89b-12d3-a456-426614174001',
  USER_ORGANIZER: '123e4567-e89b-12d3-a456-426614174002',
  USER_ATTENDEE_1: '123e4567-e89b-12d3-a456-426614174003',
  USER_ATTENDEE_2: '123e4567-e89b-12d3-a456-426614174004',
  SESSION_1: '123e4567-e89b-12d3-a456-426614174005',
  SESSION_2: '123e4567-e89b-12d3-a456-426614174006',
  NOTIFICATION_1: '123e4567-e89b-12d3-a456-426614174007',
  CONNECTION_1: '123e4567-e89b-12d3-a456-426614174008',
  REGISTRATION_1: '123e4567-e89b-12d3-a456-426614174009'
}

// Test dates
export const TEST_DATES = {
  FUTURE_START: '2024-06-15T09:00:00Z',
  FUTURE_END: '2024-06-15T17:00:00Z',
  SESSION_START: '2024-06-15T10:00:00Z',
  SESSION_END: '2024-06-15T11:00:00Z',
  PAST_DATE: '2023-01-01T00:00:00Z',
  CURRENT_DATE: new Date().toISOString()
}

// Event test data
export const EVENT_TEST_DATA: CreateEventRequest = {
  title: 'Tech Conference 2024',
  description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing. Join industry leaders and innovators for a day of learning and networking.',
  startDate: TEST_DATES.FUTURE_START,
  endDate: TEST_DATES.FUTURE_END,
  capacity: 500,
  isPublic: true
}

export const EVENT_UPDATE_DATA: UpdateEventRequest = {
  title: 'Tech Conference 2024 - Updated',
  description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing. Join industry leaders and innovators for a day of learning and networking.',
  capacity: 600
}

export const EVENT_REGISTRATION_DATA: EventRegistrationRequest = {
  attendeeId: TEST_UUIDS.USER_ATTENDEE_1,
  notes: 'Looking forward to networking opportunities and learning about AI trends'
}

// Session test data
export const SESSION_TEST_DATA: CreateSessionRequest = {
  eventId: TEST_UUIDS.EVENT_1,
  title: 'Introduction to Artificial Intelligence',
  speaker: 'Dr. Jane Smith',
  description: 'An comprehensive introduction to artificial intelligence concepts, including machine learning, deep learning, and neural networks.',
  startTime: TEST_DATES.SESSION_START,
  endTime: TEST_DATES.SESSION_END,
  capacity: 100
}

export const SESSION_UPDATE_DATA: UpdateSessionRequest = {
  title: 'Advanced AI Concepts',
  speaker: 'Dr. John Doe',
  description: 'Deep dive into advanced AI concepts including reinforcement learning, natural language processing, and computer vision.'
}

// Notification test data
export const NOTIFICATION_TEST_DATA: SendNotificationRequest = {
  eventId: TEST_UUIDS.EVENT_1,
  type: 'announcement',
  title: 'Event Schedule Update',
  message: 'The event schedule has been updated. Please check the new session times and locations.',
  targetAudience: 'all'
}

// Networking test data
export const CONNECTION_REQUEST_DATA: ConnectionRequest = {
  recipientId: TEST_UUIDS.USER_ATTENDEE_2,
  message: 'Would love to connect and discuss AI trends and potential collaboration opportunities.'
}

// Query parameter test data
export const EVENT_LIST_QUERY: EventListQuery = {
  page: 1,
  limit: 20,
  search: 'tech conference',
  status: 'published',
  organizerId: TEST_UUIDS.USER_ORGANIZER
}

export const ATTENDEE_LIST_QUERY: AttendeeListQuery = {
  includePrivate: true
}

export const CONNECTION_LIST_QUERY: ConnectionListQuery = {
  status: 'pending',
  type: 'sent'
}

// Complete entity test data
export const COMPLETE_EVENT: Event = {
  id: TEST_UUIDS.EVENT_1,
  title: 'Tech Conference 2024',
  description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing.',
  startDate: TEST_DATES.FUTURE_START,
  endDate: TEST_DATES.FUTURE_END,
  capacity: 500,
  attendeeCount: 150,
  status: 'published',
  organizerId: TEST_UUIDS.USER_ORGANIZER,
  isPublic: true,
  createdAt: TEST_DATES.CURRENT_DATE,
  updatedAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_SESSION: Session = {
  id: TEST_UUIDS.SESSION_1,
  eventId: TEST_UUIDS.EVENT_1,
  title: 'Introduction to Artificial Intelligence',
  speaker: 'Dr. Jane Smith',
  description: 'An comprehensive introduction to artificial intelligence concepts.',
  startTime: TEST_DATES.SESSION_START,
  endTime: TEST_DATES.SESSION_END,
  capacity: 100,
  attendeeCount: 75,
  createdAt: TEST_DATES.CURRENT_DATE,
  updatedAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_USER: User = {
  id: TEST_UUIDS.USER_ORGANIZER,
  email: 'organizer@techconf.com',
  firstName: 'John',
  lastName: 'Organizer',
  avatar: 'https://example.com/avatars/john-organizer.jpg',
  bio: 'Technology conference organizer with 10+ years of experience in event management.',
  company: 'Tech Events Inc.',
  title: 'Event Director',
  createdAt: TEST_DATES.CURRENT_DATE,
  updatedAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_ATTENDEE: Attendee = {
  id: TEST_UUIDS.REGISTRATION_1,
  userId: TEST_UUIDS.USER_ATTENDEE_1,
  eventId: TEST_UUIDS.EVENT_1,
  status: 'registered',
  checkInStatus: 'not_checked_in',
  notes: 'Vegetarian meal preference',
  registeredAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_NOTIFICATION: Notification = {
  id: TEST_UUIDS.NOTIFICATION_1,
  eventId: TEST_UUIDS.EVENT_1,
  type: 'announcement',
  title: 'Event Schedule Update',
  message: 'The event schedule has been updated. Please check the new session times.',
  status: 'sent',
  recipientsCount: 150,
  createdAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_CONNECTION: Connection = {
  id: TEST_UUIDS.CONNECTION_1,
  requesterId: TEST_UUIDS.USER_ATTENDEE_1,
  recipientId: TEST_UUIDS.USER_ATTENDEE_2,
  status: 'pending',
  message: 'Would love to connect and discuss AI trends.',
  createdAt: TEST_DATES.CURRENT_DATE,
  updatedAt: TEST_DATES.CURRENT_DATE
}

export const COMPLETE_PAGINATION: Pagination = {
  page: 1,
  limit: 20,
  total: 150,
  totalPages: 8,
  hasNext: true,
  hasPrev: false
}

// Invalid test data for negative testing
export const INVALID_EVENT_DATA = {
  title: '', // Empty title
  description: 'Test Description',
  startDate: 'invalid-date',
  endDate: TEST_DATES.FUTURE_END,
  capacity: 0 // Invalid capacity
}

export const INVALID_SESSION_DATA = {
  eventId: 'invalid-uuid',
  title: '', // Empty title
  speaker: '', // Empty speaker
  startTime: TEST_DATES.SESSION_END, // End before start
  endTime: TEST_DATES.SESSION_START,
  capacity: 0 // Invalid capacity
}

export const INVALID_NOTIFICATION_DATA = {
  eventId: 'invalid-uuid',
  type: 'invalid_type',
  title: '', // Empty title
  message: '', // Empty message
  targetAudience: 'invalid_audience'
}

export const INVALID_CONNECTION_DATA = {
  recipientId: 'invalid-uuid',
  message: 'A'.repeat(501) // Exceeds max length
}

// Edge case test data
export const EDGE_CASE_EVENT_DATA = {
  title: 'A'.repeat(100), // Max length title
  description: 'A'.repeat(1000), // Max length description
  startDate: TEST_DATES.FUTURE_START,
  endDate: TEST_DATES.FUTURE_END,
  capacity: 10000, // Max capacity
  isPublic: true
}

export const EDGE_CASE_SESSION_DATA = {
  eventId: TEST_UUIDS.EVENT_1,
  title: 'A'.repeat(100), // Max length title
  speaker: 'A'.repeat(100), // Max length speaker
  description: 'A'.repeat(500), // Max length description
  startTime: TEST_DATES.SESSION_START,
  endTime: TEST_DATES.SESSION_END,
  capacity: 1 // Min capacity
}

export const EDGE_CASE_NOTIFICATION_DATA = {
  eventId: TEST_UUIDS.EVENT_1,
  type: 'reminder' as const,
  title: 'A'.repeat(100), // Max length title
  message: 'A'.repeat(1000), // Max length message
  targetAudience: 'checked_in' as const
}

// Performance test data
export const PERFORMANCE_TEST_DATA = {
  largeEventList: Array.from({ length: 1000 }, (_, index) => ({
    ...COMPLETE_EVENT,
    id: uuidv4(),
    title: `Event ${index + 1}`,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
  })),
  largeSessionList: Array.from({ length: 100 }, (_, index) => ({
    ...COMPLETE_SESSION,
    id: uuidv4(),
    title: `Session ${index + 1}`,
    startTime: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString()
  })),
  largeAttendeeList: Array.from({ length: 500 }, (_, index) => ({
    ...COMPLETE_ATTENDEE,
    id: uuidv4(),
    userId: uuidv4(),
    registeredAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
  }))
}

// Database test data (for integration tests)
export const DATABASE_TEST_DATA = {
  events: [
    COMPLETE_EVENT,
    {
      ...COMPLETE_EVENT,
      id: TEST_UUIDS.EVENT_2,
      title: 'AI Workshop 2024',
      status: 'draft' as const,
      capacity: 50
    }
  ],
  sessions: [
    COMPLETE_SESSION,
    {
      ...COMPLETE_SESSION,
      id: TEST_UUIDS.SESSION_2,
      title: 'Blockchain Fundamentals',
      speaker: 'Dr. Mike Johnson',
      startTime: '2024-06-15T14:00:00Z',
      endTime: '2024-06-15T15:00:00Z'
    }
  ],
  users: [
    COMPLETE_USER,
    {
      ...COMPLETE_USER,
      id: TEST_UUIDS.USER_ATTENDEE_1,
      email: 'attendee1@example.com',
      firstName: 'Alice',
      lastName: 'Attendee',
      company: 'Tech Corp',
      title: 'Software Engineer'
    },
    {
      ...COMPLETE_USER,
      id: TEST_UUIDS.USER_ATTENDEE_2,
      email: 'attendee2@example.com',
      firstName: 'Bob',
      lastName: 'Developer',
      company: 'AI Solutions',
      title: 'Data Scientist'
    }
  ],
  attendees: [
    COMPLETE_ATTENDEE,
    {
      ...COMPLETE_ATTENDEE,
      id: uuidv4(),
      userId: TEST_UUIDS.USER_ATTENDEE_2,
      status: 'confirmed' as const,
      checkInStatus: 'checked_in' as const
    }
  ],
  notifications: [
    COMPLETE_NOTIFICATION,
    {
      ...COMPLETE_NOTIFICATION,
      id: uuidv4(),
      type: 'reminder' as const,
      title: 'Event Reminder',
      message: 'Don\'t forget about tomorrow\'s event!',
      status: 'pending' as const
    }
  ],
  connections: [
    COMPLETE_CONNECTION,
    {
      ...COMPLETE_CONNECTION,
      id: uuidv4(),
      requesterId: TEST_UUIDS.USER_ATTENDEE_2,
      recipientId: TEST_UUIDS.USER_ATTENDEE_1,
      status: 'accepted' as const
    }
  ]
}

// Mock external service responses
export const MOCK_EXTERNAL_RESPONSES = {
  pusher: {
    authenticate: {
      auth: 'test-auth-string',
      channel_data: JSON.stringify({
        user_id: TEST_UUIDS.USER_ATTENDEE_1,
        user_info: {
          name: 'Alice Attendee',
          email: 'attendee1@example.com'
        }
      })
    }
  },
  supabase: {
    auth: {
      user: {
        id: TEST_UUIDS.USER_ATTENDEE_1,
        email: 'attendee1@example.com',
        user_metadata: {
          first_name: 'Alice',
          last_name: 'Attendee'
        }
      },
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000
      }
    }
  },
  firebase: {
    auth: {
      currentUser: {
        uid: TEST_UUIDS.USER_ATTENDEE_1,
        email: 'attendee1@example.com',
        displayName: 'Alice Attendee'
      }
    }
  }
}

// Test configuration
export const TEST_CONFIG = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'event_organizer_test',
    username: 'test_user',
    password: 'test_password',
    ssl: false
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'test_password',
    db: 1
  },
  pusher: {
    appId: 'test-app-id',
    key: 'test-key',
    secret: 'test-secret',
    cluster: 'us2',
    useTLS: true
  },
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h'
  }
}

// Helper functions for test data generation
export const generateTestUser = (overrides: Partial<User> = {}): User => ({
  ...COMPLETE_USER,
  id: uuidv4(),
  ...overrides
})

export const generateTestEvent = (overrides: Partial<Event> = {}): Event => ({
  ...COMPLETE_EVENT,
  id: uuidv4(),
  ...overrides
})

export const generateTestSession = (overrides: Partial<Session> = {}): Session => ({
  ...COMPLETE_SESSION,
  id: uuidv4(),
  ...overrides
})

export const generateTestAttendee = (overrides: Partial<Attendee> = {}): Attendee => ({
  ...COMPLETE_ATTENDEE,
  id: uuidv4(),
  ...overrides
})

export const generateTestNotification = (overrides: Partial<Notification> = {}): Notification => ({
  ...COMPLETE_NOTIFICATION,
  id: uuidv4(),
  ...overrides
})

export const generateTestConnection = (overrides: Partial<Connection> = {}): Connection => ({
  ...COMPLETE_CONNECTION,
  id: uuidv4(),
  ...overrides
})
