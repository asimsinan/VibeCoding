import { Event, Session, Attendee, Notification, Connection, Message, User } from '../models'

// Data normalization utilities
export interface NormalizedData<T> {
  byId: Record<string, T>
  allIds: string[]
}

// Normalize array of entities to normalized structure
export function normalizeData<T extends { id: string }>(data: T[]): NormalizedData<T> {
  const byId: Record<string, T> = {}
  const allIds: string[] = []

  data.forEach(item => {
    byId[item.id] = item
    allIds.push(item.id)
  })

  return { byId, allIds }
}

// Denormalize normalized data back to array
export function denormalizeData<T>(normalized: NormalizedData<T>): T[] {
  return normalized.allIds.map(id => normalized.byId[id])
}

// Event data transformation
export interface EventFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  maxAttendees: number
  ticketPrice: number
  currency: string
  category: string
  tags: string[]
  imageUrl?: string
}

export function transformEventToFormData(event: Event): EventFormData {
  return {
    name: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.metadata?.location || '',
    maxAttendees: event.capacity,
    ticketPrice: 0, // Not in Event model
    currency: 'USD', // Not in Event model
    category: event.type,
    tags: event.metadata?.tags || [],
    imageUrl: event.coverImageUrl
  }
}

export function transformFormDataToEvent(formData: EventFormData, organizerId: string): Partial<Event> {
  return {
    title: formData.name,
    description: formData.description,
    startDate: formData.startDate,
    endDate: formData.endDate,
    organizerId,
    capacity: formData.maxAttendees,
    attendeeCount: 0,
    type: formData.category as any,
    metadata: {
      location: formData.location,
      tags: formData.tags,
      timezone: 'UTC',
      categories: [],
      language: 'en',
      recordingEnabled: false,
      chatEnabled: true,
      qaEnabled: true,
      networkingEnabled: true,
      maxSessions: 10,
      customFields: {}
    },
    coverImageUrl: formData.imageUrl,
    status: 'draft' as const
  }
}

// Session data transformation
export interface SessionFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  type: string
  maxCapacity: number
  speakerName: string
  speakerBio: string
  speakerImageUrl?: string
  eventId: string
}

export function transformSessionToFormData(session: Session): SessionFormData {
  return {
    title: session.title,
    description: session.description || '',
    startTime: session.startTime,
    endTime: session.endTime,
    type: session.type,
    maxCapacity: session.metadata?.maxAttendees || 100,
    speakerName: session.speaker?.name || '',
    speakerBio: session.speaker?.bio || '',
    speakerImageUrl: session.speaker?.avatarUrl,
    eventId: session.eventId
  }
}

export function transformFormDataToSession(formData: SessionFormData): Partial<Session> {
  return {
    title: formData.title,
    description: formData.description,
    startTime: formData.startTime,
    endTime: formData.endTime,
    type: formData.type as any,
    metadata: {
      maxAttendees: formData.maxCapacity,
      tags: [],
      language: 'en',
      recordingEnabled: false,
      chatEnabled: true,
      qaEnabled: true,
      customFields: {},
      pollsEnabled: false,
      breakoutRoomsEnabled: false,
      materials: []
    },
    speaker: {
      name: formData.speakerName,
      bio: formData.speakerBio,
      avatarUrl: formData.speakerImageUrl,
      isExternal: false
    },
    eventId: formData.eventId,
    status: 'scheduled'
  }
}

// Attendee data transformation
export interface AttendeeFormData {
  firstName: string
  lastName: string
  email: string
  company: string
  jobTitle: string
  bio: string
  interests: string[]
  linkedinUrl?: string
  twitterUrl?: string
  websiteUrl?: string
  profileImageUrl?: string
}

export function transformAttendeeToFormData(attendee: Attendee): AttendeeFormData {
  return {
    firstName: '', // Not available in Attendee model
    lastName: '', // Not available in Attendee model
    email: '', // Not available in Attendee model
    company: '', // Not available in Attendee model
    jobTitle: '', // Not available in Attendee model
    bio: '', // Not available in Attendee model
    interests: [], // Not available in Attendee model
    linkedinUrl: '', // Not available in Attendee model
    twitterUrl: '', // Not available in Attendee model
    websiteUrl: '', // Not available in Attendee model
    profileImageUrl: '' // Not available in Attendee model
  }
}

export function transformFormDataToAttendee(formData: AttendeeFormData, eventId: string, userId: string): Partial<Attendee> {
  return {
    eventId,
    userId,
    status: 'registered' as const,
    type: 'attendee' as const,
    metadata: {
      customFields: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        jobTitle: formData.jobTitle,
        bio: formData.bio,
        interests: formData.interests,
        linkedinUrl: formData.linkedinUrl,
        twitterUrl: formData.twitterUrl,
        websiteUrl: formData.websiteUrl,
        profileImageUrl: formData.profileImageUrl
      }
    }
  }
}

// User profile data transformation
export interface UserProfileFormData {
  firstName: string
  lastName: string
  email: string
  company: string
  jobTitle: string
  bio: string
  interests: string[]
  linkedinUrl?: string
  twitterUrl?: string
  websiteUrl?: string
  profileImageUrl?: string
}

export function transformUserToProfileFormData(user: User): UserProfileFormData {
  return {
    firstName: '', // Not available in User model
    lastName: '', // Not available in User model
    email: '', // Not available in User model
    company: '', // Not available in User model
    jobTitle: '', // Not available in User model
    bio: '', // Not available in User model
    interests: [], // Not available in User model
    linkedinUrl: '', // Not available in User model
    twitterUrl: '', // Not available in User model
    websiteUrl: '', // Not available in User model
    profileImageUrl: '' // Not available in User model
  }
}

export function transformProfileFormDataToUser(formData: UserProfileFormData): Partial<User> {
  return {
    status: 'active' as const,
    metadata: {
      customFields: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        bio: formData.bio,
        phone: '',
        profileImageUrl: formData.profileImageUrl
      },
      socialLinks: {
        linkedin: formData.linkedinUrl,
        twitter: formData.twitterUrl
      },
      company: formData.company,
      jobTitle: formData.jobTitle,
      website: formData.websiteUrl,
      skills: [],
      interests: formData.interests
    }
  }
}

// Date transformation utilities
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function isDateInPast(date: string | Date): boolean {
  return new Date(date) < new Date()
}

export function isDateInFuture(date: string | Date): boolean {
  return new Date(date) > new Date()
}

export function getTimeUntil(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()

  if (diff < 0) return 'Past'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Status transformation utilities
export function getEventStatusColor(status: string): string {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getSessionStatusColor(status: string): string {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    live: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getAttendeeStatusColor(status: string): string {
  const colors = {
    registered: 'bg-green-100 text-green-800',
    checked_in: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getConnectionStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

// Search and filter utilities
export interface SearchFilters {
  query?: string
  category?: string
  status?: string
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
}

export function filterEvents(events: Event[], filters: SearchFilters): Event[] {
  return events.filter(event => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      const matchesName = event.title.toLowerCase().includes(query)
      const matchesDescription = event.description.toLowerCase().includes(query)
      const matchesLocation = event.metadata?.location?.toLowerCase().includes(query) || false
      const matchesTags = event.metadata?.tags?.some(tag => tag.toLowerCase().includes(query)) || false
      
      if (!matchesName && !matchesDescription && !matchesLocation && !matchesTags) {
        return false
      }
    }

    // Category filter
    if (filters.category && event.type !== filters.category) {
      return false
    }

    // Status filter
    if (filters.status && event.status !== filters.status) {
      return false
    }

    // Date range filter
    if (filters.dateRange) {
      const eventDate = new Date(event.startDate)
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      
      if (eventDate < startDate || eventDate > endDate) {
        return false
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(filterTag => 
        event.metadata?.tags?.includes(filterTag)
      )
      if (!hasMatchingTag) {
        return false
      }
    }

    return true
  })
}

export function sortEvents(events: Event[], sortBy: 'name' | 'date' | 'attendees' = 'date'): Event[] {
  return [...events].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'date':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      case 'attendees':
        return b.attendeeCount - a.attendeeCount
      default:
        return 0
    }
  })
}

// Validation utilities
export function validateEventForm(formData: EventFormData): string[] {
  const errors: string[] = []

  if (!formData.name.trim()) {
    errors.push('Event name is required')
  }

  if (!formData.description.trim()) {
    errors.push('Event description is required')
  }

  if (!formData.startDate) {
    errors.push('Start date is required')
  }

  if (!formData.endDate) {
    errors.push('End date is required')
  }

  if (formData.startDate && formData.endDate) {
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    if (startDate >= endDate) {
      errors.push('End date must be after start date')
    }
  }

  if (formData.maxAttendees < 1) {
    errors.push('Maximum attendees must be at least 1')
  }

  if (formData.ticketPrice < 0) {
    errors.push('Ticket price cannot be negative')
  }

  return errors
}

export function validateSessionForm(formData: SessionFormData): string[] {
  const errors: string[] = []

  if (!formData.title.trim()) {
    errors.push('Session title is required')
  }

  if (!formData.description.trim()) {
    errors.push('Session description is required')
  }

  if (!formData.startTime) {
    errors.push('Start time is required')
  }

  if (!formData.endTime) {
    errors.push('End time is required')
  }

  if (formData.startTime && formData.endTime) {
    const startTime = new Date(formData.startTime)
    const endTime = new Date(formData.endTime)
    
    if (startTime >= endTime) {
      errors.push('End time must be after start time')
    }
  }

  if (formData.maxCapacity < 1) {
    errors.push('Maximum capacity must be at least 1')
  }

  if (!formData.speakerName.trim()) {
    errors.push('Speaker name is required')
  }

  return errors
}

// All utilities are already exported individually above
