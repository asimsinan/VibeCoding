// Re-export all types from schemas for convenience
export * from '../schemas'

// Import types for use in this file
import type {
  Pagination,
  Session,
  User,
  Attendee,
  Connection,
  CreateEventRequest,
  UpdateEventRequest,
  EventListQuery,
  EventRegistrationRequest,
  AttendeeListQuery,
  ConnectionListQuery,
  CreateSessionRequest,
  UpdateSessionRequest,
  SendNotificationRequest,
  ConnectionRequest
} from '../schemas'

// Additional utility types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: Pagination
  }
  message: string
  timestamp: string
}

// Event-specific types
export interface EventDetails extends Event {
  sessions: Session[]
  organizer: User
  attendees: Attendee[]
}

export interface EventRegistration {
  id: string
  eventId: string
  attendeeId: string
  status: 'registered' | 'confirmed' | 'cancelled'
  notes?: string
  registeredAt: string
}

// Session-specific types
export interface SessionWithAttendees extends Session {
  attendees: Attendee[]
}

// Attendee-specific types
export interface AttendeeWithUser extends Attendee {
  user: User
}

// Notification-specific types
export interface NotificationDelivery {
  notificationId: string
  recipientsCount: number
  deliveredCount: number
  failedCount: number
}

// Connection-specific types
export interface ConnectionWithUsers extends Connection {
  requester: User
  recipient: User
}

export interface ConnectionSummary {
  connections: ConnectionWithUsers[]
  sentRequests: ConnectionWithUsers[]
  receivedRequests: ConnectionWithUsers[]
}

// Analytics types
export interface EventAnalytics {
  eventId: string
  totalRegistrations: number
  totalCheckIns: number
  attendanceRate: number
  sessionAttendance: {
    sessionId: string
    title: string
    attendanceCount: number
    attendanceRate: number
  }[]
  networkingStats: {
    totalConnections: number
    pendingConnections: number
    acceptedConnections: number
  }
  engagementMetrics: {
    averageSessionDuration: number
    totalMessages: number
    activeParticipants: number
  }
}

// API Error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiError {
  code: string
  message: string
  details?: ValidationError[]
}

// Request/Response wrapper types
export interface RequestContext {
  userId: string
  userRole: 'organizer' | 'attendee' | 'admin'
  eventId?: string
  sessionId?: string
}

export interface AuthenticatedRequest {
  user: {
    id: string
    email: string
    role: 'organizer' | 'attendee' | 'admin'
  }
}

// Real-time event types
export interface RealtimeEvent {
  type: 'event_created' | 'event_updated' | 'event_cancelled' | 'attendee_registered' | 'session_created' | 'session_updated' | 'notification_sent' | 'connection_requested' | 'connection_accepted' | 'connection_declined'
  eventId: string
  data: any
  timestamp: string
}

export interface WebSocketMessage {
  type: 'notification' | 'event_update' | 'session_update' | 'connection_update'
  payload: any
  timestamp: string
}

// Database entity types (for internal use)
export interface DatabaseEvent extends Omit<Event, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseSession extends Omit<Session, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseAttendee extends Omit<Attendee, 'id' | 'registeredAt'> {
  id?: string
  registered_at?: string
}

export interface DatabaseUser extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseNotification extends Omit<Notification, 'id' | 'createdAt'> {
  id?: string
  created_at?: string
}

export interface DatabaseConnection extends Omit<Connection, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
  created_at?: string
  updated_at?: string
}

// Service layer types
export interface EventService {
  createEvent(data: CreateEventRequest, organizerId: string): Promise<Event>
  getEvent(id: string): Promise<EventDetails>
  updateEvent(id: string, data: UpdateEventRequest, userId: string): Promise<Event>
  deleteEvent(id: string, userId: string): Promise<void>
  listEvents(query: EventListQuery): Promise<PaginatedResponse<Event>>
  registerForEvent(eventId: string, data: EventRegistrationRequest): Promise<EventRegistration>
  getEventAttendees(eventId: string, query: AttendeeListQuery, userId: string): Promise<AttendeeWithUser[]>
}

export interface SessionService {
  createSession(data: CreateSessionRequest, userId: string): Promise<Session>
  updateSession(id: string, data: UpdateSessionRequest, userId: string): Promise<Session>
  deleteSession(id: string, userId: string): Promise<void>
  getSession(id: string): Promise<SessionWithAttendees>
  listEventSessions(eventId: string): Promise<Session[]>
}

export interface NotificationService {
  sendNotification(data: SendNotificationRequest, userId: string): Promise<NotificationDelivery>
  getNotifications(eventId: string, userId: string): Promise<Notification[]>
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>
}

export interface NetworkingService {
  requestConnection(data: ConnectionRequest, userId: string): Promise<Connection>
  acceptConnection(connectionId: string, userId: string): Promise<Connection>
  declineConnection(connectionId: string, userId: string): Promise<void>
  getUserConnections(userId: string, query: ConnectionListQuery): Promise<ConnectionSummary>
  sendMessage(connectionId: string, message: string, userId: string): Promise<void>
  getMessages(connectionId: string, userId: string): Promise<any[]>
}

// Configuration types
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
  pool: {
    min: number
    max: number
  }
}

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
}

export interface PusherConfig {
  appId: string
  key: string
  secret: string
  cluster: string
  useTLS: boolean
}

export interface AppConfig {
  database: DatabaseConfig
  redis: RedisConfig
  pusher: PusherConfig
  jwt: {
    secret: string
    expiresIn: string
  }
  cors: {
    origin: string[]
    credentials: boolean
  }
}
