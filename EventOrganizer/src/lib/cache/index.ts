import { Event, Session, Attendee, Notification, Connection, Message, User } from '../models'

// Cache configuration
interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  cleanupInterval: number // Cleanup interval in milliseconds
}

const defaultCacheConfig: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
}

// Cache entry interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Generic cache class
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: CacheConfig
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultCacheConfig, ...config }
    this.startCleanup()
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.cache.clear()
  }
}

// Specialized caches for different data types
export const eventCache = new Cache<Event>({ ttl: 10 * 60 * 1000 }) // 10 minutes
export const sessionCache = new Cache<Session>({ ttl: 10 * 60 * 1000 }) // 10 minutes
export const attendeeCache = new Cache<Attendee>({ ttl: 5 * 60 * 1000 }) // 5 minutes
export const notificationCache = new Cache<Notification>({ ttl: 2 * 60 * 1000 }) // 2 minutes
export const connectionCache = new Cache<Connection>({ ttl: 5 * 60 * 1000 }) // 5 minutes
export const messageCache = new Cache<Message>({ ttl: 1 * 60 * 1000 }) // 1 minute
export const userCache = new Cache<User>({ ttl: 15 * 60 * 1000 }) // 15 minutes

// Cache key generators
export const cacheKeys = {
  event: (id: string) => `event:${id}`,
  events: (filters?: string) => `events:${filters || 'all'}`,
  session: (id: string) => `session:${id}`,
  sessions: (eventId?: string) => `sessions:${eventId || 'all'}`,
  attendee: (id: string) => `attendee:${id}`,
  attendees: (eventId: string) => `attendees:${eventId}`,
  notification: (id: string) => `notification:${id}`,
  notifications: (userId: string) => `notifications:${userId}`,
  connection: (id: string) => `connection:${id}`,
  connections: (userId: string) => `connections:${userId}`,
  message: (id: string) => `message:${id}`,
  messages: (connectionId: string) => `messages:${connectionId}`,
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `userProfile:${id}`
}

// Cache utilities
export class CacheManager {
  private caches = new Map<string, Cache<any>>()

  constructor() {
    // Register default caches
    this.registerCache('events', eventCache)
    this.registerCache('sessions', sessionCache)
    this.registerCache('attendees', attendeeCache)
    this.registerCache('notifications', notificationCache)
    this.registerCache('connections', connectionCache)
    this.registerCache('messages', messageCache)
    this.registerCache('users', userCache)
  }

  registerCache(name: string, cache: Cache<any>): void {
    this.caches.set(name, cache)
  }

  getCache(name: string): Cache<any> | undefined {
    return this.caches.get(name)
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string): void {
    this.caches.forEach(cache => {
      const keysToDelete = cache.keys().filter(key => key.includes(pattern))
      keysToDelete.forEach(key => cache.delete(key))
    })
  }

  // Invalidate all caches
  invalidateAll(): void {
    this.caches.forEach(cache => cache.clear())
  }

  // Get cache statistics
  getStats(): Record<string, { size: number; keys: string[] }> {
    const stats: Record<string, { size: number; keys: string[] }> = {}
    
    this.caches.forEach((cache, name) => {
      stats[name] = {
        size: cache.size(),
        keys: cache.keys()
      }
    })

    return stats
  }

  // Cleanup all caches
  destroy(): void {
    this.caches.forEach(cache => cache.destroy())
    this.caches.clear()
  }
}

// Create singleton cache manager
export const cacheManager = new CacheManager()

// Local storage utilities
export class LocalStorageCache<T> {
  private key: string
  private ttl: number

  constructor(key: string, ttl: number = 24 * 60 * 60 * 1000) { // 24 hours default
    this.key = key
    this.ttl = ttl
  }

  set(data: T): void {
    if (typeof window === 'undefined') return

    const entry = {
      data,
      timestamp: Date.now(),
      ttl: this.ttl
    }

    try {
      localStorage.setItem(this.key, JSON.stringify(entry))
    } catch (error) {
    }
  }

  get(): T | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.key)
      if (!stored) return null

      const entry = JSON.parse(stored)
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete()
        return null
      }

      return entry.data
    } catch (error) {
      return null
    }
  }

  delete(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(this.key)
    } catch (error) {
    }
  }

  has(): boolean {
    return this.get() !== null
  }
}

// Session storage utilities
export class SessionStorageCache<T> {
  private key: string
  private ttl: number

  constructor(key: string, ttl: number = 60 * 60 * 1000) { // 1 hour default
    this.key = key
    this.ttl = ttl
  }

  set(data: T): void {
    if (typeof window === 'undefined') return

    const entry = {
      data,
      timestamp: Date.now(),
      ttl: this.ttl
    }

    try {
      sessionStorage.setItem(this.key, JSON.stringify(entry))
    } catch (error) {
    }
  }

  get(): T | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = sessionStorage.getItem(this.key)
      if (!stored) return null

      const entry = JSON.parse(stored)
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete()
        return null
      }

      return entry.data
    } catch (error) {
      return null
    }
  }

  delete(): void {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.removeItem(this.key)
    } catch (error) {
    }
  }

  has(): boolean {
    return this.get() !== null
  }
}

// Specialized local storage caches
export const userPreferencesCache = new LocalStorageCache('user_preferences', 7 * 24 * 60 * 60 * 1000) // 7 days
export const searchHistoryCache = new LocalStorageCache<string[]>('search_history', 30 * 24 * 60 * 60 * 1000) // 30 days
export const recentlyViewedCache = new LocalStorageCache<string[]>('recently_viewed', 7 * 24 * 60 * 60 * 1000) // 7 days

// Specialized session storage caches
export const currentEventCache = new SessionStorageCache<Event>(`current_event`, 2 * 60 * 60 * 1000) // 2 hours
export const currentSessionCache = new SessionStorageCache<Session>(`current_session`, 2 * 60 * 60 * 1000) // 2 hours
export const draftEventCache = new SessionStorageCache<Partial<Event>>(`draft_event`, 24 * 60 * 60 * 1000) // 24 hours

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new Cache<ReturnType<T>>({ ttl })

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    const cached = cache.get(key)
    
    if (cached !== null) {
      return cached
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Cache invalidation utilities
export function invalidateEventCache(eventId?: string): void {
  if (eventId) {
    eventCache.delete(cacheKeys.event(eventId))
  }
  eventCache.delete(cacheKeys.events())
  cacheManager.invalidatePattern('events')
}

export function invalidateSessionCache(sessionId?: string, eventId?: string): void {
  if (sessionId) {
    sessionCache.delete(cacheKeys.session(sessionId))
  }
  if (eventId) {
    sessionCache.delete(cacheKeys.sessions(eventId))
  }
  sessionCache.delete(cacheKeys.sessions())
  cacheManager.invalidatePattern('sessions')
}

export function invalidateAttendeeCache(attendeeId?: string, eventId?: string): void {
  if (attendeeId) {
    attendeeCache.delete(cacheKeys.attendee(attendeeId))
  }
  if (eventId) {
    attendeeCache.delete(cacheKeys.attendees(eventId))
  }
  cacheManager.invalidatePattern('attendees')
}

export function invalidateNotificationCache(notificationId?: string, userId?: string): void {
  if (notificationId) {
    notificationCache.delete(cacheKeys.notification(notificationId))
  }
  if (userId) {
    notificationCache.delete(cacheKeys.notifications(userId))
  }
  cacheManager.invalidatePattern('notifications')
}

export function invalidateConnectionCache(connectionId?: string, userId?: string): void {
  if (connectionId) {
    connectionCache.delete(cacheKeys.connection(connectionId))
  }
  if (userId) {
    connectionCache.delete(cacheKeys.connections(userId))
  }
  cacheManager.invalidatePattern('connections')
}

export function invalidateMessageCache(messageId?: string, connectionId?: string): void {
  if (messageId) {
    messageCache.delete(cacheKeys.message(messageId))
  }
  if (connectionId) {
    messageCache.delete(cacheKeys.messages(connectionId))
  }
  cacheManager.invalidatePattern('messages')
}

export function invalidateUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(cacheKeys.user(userId))
    userCache.delete(cacheKeys.userProfile(userId))
  }
  cacheManager.invalidatePattern('users')
}

