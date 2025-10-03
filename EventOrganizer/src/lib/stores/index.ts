import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Event, Session, Attendee, Notification, Connection, Message, User } from '../models'

// Auth state
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

// Event state
interface EventState {
  events: Event[]
  currentEvent: Event | null
  isLoading: boolean
  error: string | null
}

interface EventActions {
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  updateEvent: (event: Event) => void
  removeEvent: (eventId: string) => void
  setCurrentEvent: (event: Event | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Session state
interface SessionState {
  sessions: Session[]
  currentSession: Session | null
  isLoading: boolean
  error: string | null
}

interface SessionActions {
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  updateSession: (session: Session) => void
  removeSession: (sessionId: string) => void
  setCurrentSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Attendee state
interface AttendeeState {
  attendees: Attendee[]
  isLoading: boolean
  error: string | null
}

interface AttendeeActions {
  setAttendees: (attendees: Attendee[]) => void
  addAttendee: (attendee: Attendee) => void
  updateAttendee: (attendee: Attendee) => void
  removeAttendee: (attendeeId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Notification state
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
}

interface NotificationActions {
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Connection state
interface ConnectionState {
  connections: Connection[]
  pendingConnections: Connection[]
  isLoading: boolean
  error: string | null
}

interface ConnectionActions {
  setConnections: (connections: Connection[]) => void
  addConnection: (connection: Connection) => void
  updateConnection: (connection: Connection) => void
  removeConnection: (connectionId: string) => void
  setPendingConnections: (connections: Connection[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Message state
interface MessageState {
  messages: Record<string, Message[]> // connectionId -> messages
  isLoading: boolean
  error: string | null
}

interface MessageActions {
  setMessages: (connectionId: string, messages: Message[]) => void
  addMessage: (connectionId: string, message: Message) => void
  updateMessage: (connectionId: string, message: Message) => void
  removeMessage: (connectionId: string, messageId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// UI state
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notificationsOpen: boolean
  mobileMenuOpen: boolean
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleNotifications: () => void
  setNotificationsOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
}

// Real-time state
interface RealTimeState {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastActivity: Date | null
  error: string | null
}

interface RealTimeActions {
  setConnected: (connected: boolean) => void
  setConnectionStatus: (status: RealTimeState['connectionStatus']) => void
  setLastActivity: (date: Date) => void
  setError: (error: string | null) => void
}

// Create individual stores
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        logout: () => set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        })
      }
    ),
    { name: 'auth-store' }
  )
)

export const useEventStore = create<EventState & EventActions>()(
  devtools(
    (set, get) => ({
      events: [],
      currentEvent: null,
      isLoading: false,
      error: null,
      setEvents: (events) => set({ events, error: null }),
      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event],
        error: null 
      })),
      updateEvent: (updatedEvent) => set((state) => ({
        events: state.events.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        ),
        currentEvent: state.currentEvent?.id === updatedEvent.id ? updatedEvent : state.currentEvent,
        error: null
      })),
      removeEvent: (eventId) => set((state) => ({
        events: state.events.filter(event => event.id !== eventId),
        currentEvent: state.currentEvent?.id === eventId ? null : state.currentEvent,
        error: null
      })),
      setCurrentEvent: (event) => set({ currentEvent: event }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'event-store' }
  )
)

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    (set) => ({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      setSessions: (sessions) => set({ sessions, error: null }),
      addSession: (session) => set((state) => ({ 
        sessions: [...state.sessions, session],
        error: null 
      })),
      updateSession: (updatedSession) => set((state) => ({
        sessions: state.sessions.map(session => 
          session.id === updatedSession.id ? updatedSession : session
        ),
        currentSession: state.currentSession?.id === updatedSession.id ? updatedSession : state.currentSession,
        error: null
      })),
      removeSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(session => session.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        error: null
      })),
      setCurrentSession: (session) => set({ currentSession: session }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'session-store' }
  )
)

export const useAttendeeStore = create<AttendeeState & AttendeeActions>()(
  devtools(
    (set) => ({
      attendees: [],
      isLoading: false,
      error: null,
      setAttendees: (attendees) => set({ attendees, error: null }),
      addAttendee: (attendee) => set((state) => ({ 
        attendees: [...state.attendees, attendee],
        error: null 
      })),
      updateAttendee: (updatedAttendee) => set((state) => ({
        attendees: state.attendees.map(attendee => 
          attendee.id === updatedAttendee.id ? updatedAttendee : attendee
        ),
        error: null
      })),
      removeAttendee: (attendeeId) => set((state) => ({
        attendees: state.attendees.filter(attendee => attendee.id !== attendeeId),
        error: null
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'attendee-store' }
  )
)

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      setNotifications: (notifications) => set({ 
        notifications, 
        unreadCount: notifications.filter(n => n.status !== 'read').length,
        error: null 
      }),
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.status === 'read' ? 0 : 1),
        error: null
      })),
      markAsRead: (notificationId) => set((state) => {
        const updatedNotifications = state.notifications.map(notification =>
          notification.id === notificationId 
            ? { ...notification, status: 'read' as const, readAt: new Date().toISOString() }
            : notification
        )
        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => n.status !== 'read').length,
          error: null
        }
      }),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          status: 'read' as const,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0,
        error: null
      })),
      removeNotification: (notificationId) => set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId)
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: state.unreadCount - (notification?.status === 'read' ? 0 : 1),
          error: null
        }
      }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'notification-store' }
  )
)

export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  devtools(
    (set) => ({
      connections: [],
      pendingConnections: [],
      isLoading: false,
      error: null,
      setConnections: (connections) => set({ 
        connections, 
        pendingConnections: connections.filter(c => c.status === 'pending'),
        error: null 
      }),
      addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection],
        pendingConnections: connection.status === 'pending' 
          ? [...state.pendingConnections, connection]
          : state.pendingConnections,
        error: null
      })),
      updateConnection: (updatedConnection) => set((state) => ({
        connections: state.connections.map(connection => 
          connection.id === updatedConnection.id ? updatedConnection : connection
        ),
        pendingConnections: state.pendingConnections.filter(c => 
          c.id !== updatedConnection.id || updatedConnection.status !== 'pending'
        ),
        error: null
      })),
      removeConnection: (connectionId) => set((state) => ({
        connections: state.connections.filter(c => c.id !== connectionId),
        pendingConnections: state.pendingConnections.filter(c => c.id !== connectionId),
        error: null
      })),
      setPendingConnections: (pendingConnections) => set({ pendingConnections }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'connection-store' }
  )
)

export const useMessageStore = create<MessageState & MessageActions>()(
  devtools(
    (set) => ({
      messages: {},
      isLoading: false,
      error: null,
      setMessages: (connectionId, messages) => set((state) => ({
        messages: { ...state.messages, [connectionId]: messages },
        error: null
      })),
      addMessage: (connectionId, message) => set((state) => ({
        messages: {
          ...state.messages,
          [connectionId]: [...(state.messages[connectionId] || []), message]
        },
        error: null
      })),
      updateMessage: (connectionId, updatedMessage) => set((state) => ({
        messages: {
          ...state.messages,
          [connectionId]: (state.messages[connectionId] || []).map(message =>
            message.id === updatedMessage.id ? updatedMessage : message
          )
        },
        error: null
      })),
      removeMessage: (connectionId, messageId) => set((state) => ({
        messages: {
          ...state.messages,
          [connectionId]: (state.messages[connectionId] || []).filter(
            message => message.id !== messageId
          )
        },
        error: null
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error })
    }),
    { name: 'message-store' }
  )
)

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        notificationsOpen: false,
        mobileMenuOpen: false,
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
        setTheme: (theme) => set({ theme }),
        toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
        setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
        setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen })
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({ theme: state.theme })
      }
    ),
    { name: 'ui-store' }
  )
)

export const useRealTimeStore = create<RealTimeState & RealTimeActions>()(
  devtools(
    (set) => ({
      isConnected: false,
      connectionStatus: 'disconnected',
      lastActivity: null,
      error: null,
      setConnected: (isConnected) => set({ 
        isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        error: null
      }),
      setConnectionStatus: (connectionStatus) => set({ 
        connectionStatus,
        isConnected: connectionStatus === 'connected',
        error: connectionStatus === 'error' ? 'Connection error' : null
      }),
      setLastActivity: (lastActivity) => set({ lastActivity }),
      setError: (error) => set({ 
        error,
        connectionStatus: error ? 'error' : 'disconnected',
        isConnected: false
      })
    }),
    { name: 'realtime-store' }
  )
)

// Combined store for easy access
export const useAppStore = () => ({
  auth: useAuthStore(),
  events: useEventStore(),
  sessions: useSessionStore(),
  attendees: useAttendeeStore(),
  notifications: useNotificationStore(),
  connections: useConnectionStore(),
  messages: useMessageStore(),
  ui: useUIStore(),
  realtime: useRealTimeStore()
})

// Selectors for optimized re-renders
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)

export const useCurrentEvent = () => useEventStore((state) => state.currentEvent)
export const useEventsList = () => useEventStore((state) => state.events)
export const useEventLoading = () => useEventStore((state) => state.isLoading)

export const useCurrentSession = () => useSessionStore((state) => state.currentSession)
export const useSessionsList = () => useSessionStore((state) => state.sessions)

export const useAttendeesList = () => useAttendeeStore((state) => state.attendees)

export const useNotificationsList = () => useNotificationStore((state) => state.notifications)
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount)

export const useConnectionsList = () => useConnectionStore((state) => state.connections)
export const usePendingConnections = () => useConnectionStore((state) => state.pendingConnections)

export const useMessagesForConnection = (connectionId: string) => 
  useMessageStore((state) => state.messages[connectionId] || [])

export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useTheme = () => useUIStore((state) => state.theme)
export const useNotificationsOpen = () => useUIStore((state) => state.notificationsOpen)

export const useRealTimeConnected = () => useRealTimeStore((state) => state.isConnected)
export const useConnectionStatus = () => useRealTimeStore((state) => state.connectionStatus)
