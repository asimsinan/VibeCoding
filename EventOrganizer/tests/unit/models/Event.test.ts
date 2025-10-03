import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  EventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  EventListQuerySchema,
  EventSearchSchema,
  EventService,
  EventValidator,
  EventStatus,
  EventType,
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  EventListQuery,
  EventSearchRequest,
  EventMetadata
} from '../../../src/lib/models/Event'

describe('Event Model Tests', () => {
  let validEvent: Event
  let validCreateEventRequest: CreateEventRequest
  let validUpdateEventRequest: UpdateEventRequest
  let validEventListQuery: EventListQuery
  let validEventSearchRequest: EventSearchRequest
  let validEventMetadata: EventMetadata

  beforeEach(() => {
    validEvent = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      organizerId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Tech Conference 2024',
      description: 'Annual technology conference featuring the latest innovations',
      startDate: '2026-06-01T09:00:00Z',
      endDate: '2026-06-03T17:00:00Z',
      capacity: 500,
      attendeeCount: 0,
      status: 'draft',
      type: 'conference',
      isPublic: true,
      coverImageUrl: 'https://example.com/cover.jpg',
      metadata: {
        location: 'San Francisco Convention Center',
        address: '123 Main St, San Francisco, CA 94102',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        tags: ['technology', 'conference', 'networking'],
        categories: ['Technology', 'Business'],
        customFields: {}
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    validCreateEventRequest = {
      organizerId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'New Tech Event',
      description: 'A new technology event',
      startDate: '2024-07-01T09:00:00Z',
      endDate: '2024-07-01T17:00:00Z',
      capacity: 100,
      type: 'workshop',
      isPublic: true,
      coverImageUrl: 'https://example.com/new-cover.jpg',
      metadata: {
        location: 'Tech Hub',
        address: '456 Tech St, San Francisco, CA 94103',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
        latitude: 37.7849,
        longitude: -122.4094,
        timezone: 'America/Los_Angeles',
        tags: ['technology', 'workshop'],
        categories: ['Technology'],
        customFields: {}
      }
    }

    validUpdateEventRequest = {
      title: 'Updated Tech Conference 2024',
      description: 'Updated description',
      capacity: 600
    }

    validEventListQuery = {
      organizerId: '123e4567-e89b-12d3-a456-426614174001',
      status: 'published',
      type: 'conference',
      page: 1,
      limit: 20,
      sortBy: 'startDate',
      sortOrder: 'asc',
      includeDrafts: false
    }

    validEventSearchRequest = {
      query: 'tech conference',
      organizerId: '123e4567-e89b-12d3-a456-426614174001',
      status: 'published',
      type: 'conference',
      tags: ['technology'],
      categories: ['Technology'],
      location: 'San Francisco',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      page: 1,
      limit: 10
    }

    validEventMetadata = {
      location: 'San Francisco Convention Center',
      address: '123 Main St, San Francisco, CA 94102',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194,
      timezone: 'America/Los_Angeles',
      tags: ['technology', 'conference', 'networking'],
      categories: ['Technology', 'Business'],
      customFields: {}
    }
  })

  describe('Event Schema Validation', () => {
    it('should validate a valid event', () => {
      const result = EventSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })

    it('should reject event with invalid UUID', () => {
      const invalidEvent = { ...validEvent, id: 'invalid-uuid' }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject event with empty title', () => {
      const invalidEvent = { ...validEvent, title: '' }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })

    it('should reject event with title exceeding 100 characters', () => {
      const invalidEvent = { ...validEvent, title: 'a'.repeat(101) }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })

    it('should reject event with description exceeding 1000 characters', () => {
      const invalidEvent = { ...validEvent, description: 'a'.repeat(1001) }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['description'])
      }
    })

    it('should reject event with invalid capacity', () => {
      const invalidEvent = { ...validEvent, capacity: 0 }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['capacity'])
      }
    })

    it('should reject event with capacity exceeding 10000', () => {
      const invalidEvent = { ...validEvent, capacity: 10001 }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['capacity'])
      }
    })

    it('should reject event with invalid status', () => {
      const invalidEvent = { ...validEvent, status: 'invalid-status' as EventStatus }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['status'])
      }
    })

    it('should reject event with invalid type', () => {
      const invalidEvent = { ...validEvent, type: 'invalid-type' as EventType }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['type'])
      }
    })

    it('should reject event with end date before start date', () => {
      const invalidEvent = { 
        ...validEvent, 
        startDate: '2024-06-03T17:00:00Z',
        endDate: '2024-06-01T09:00:00Z'
      }
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['endDate'])
      }
    })
  })

  describe('Create Event Schema Validation', () => {
    it('should validate a valid create event request', () => {
      const result = CreateEventSchema.safeParse(validCreateEventRequest)
      expect(result.success).toBe(true)
    })

    it('should reject create event request with invalid organizer ID', () => {
      const invalidRequest = { ...validCreateEventRequest, organizerId: 'invalid-uuid' }
      const result = CreateEventSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['organizerId'])
      }
    })

    it('should reject create event request with empty title', () => {
      const invalidRequest = { ...validCreateEventRequest, title: '' }
      const result = CreateEventSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })
  })

  describe('Update Event Schema Validation', () => {
    it('should validate a valid update event request', () => {
      const result = UpdateEventSchema.safeParse(validUpdateEventRequest)
      expect(result.success).toBe(true)
    })

    it('should reject update event request with empty title', () => {
      const invalidRequest = { ...validUpdateEventRequest, title: '' }
      const result = UpdateEventSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title'])
      }
    })
  })

  describe('Event List Query Schema Validation', () => {
    it('should validate a valid event list query', () => {
      const result = EventListQuerySchema.safeParse(validEventListQuery)
      expect(result.success).toBe(true)
    })

    it('should reject event list query with invalid page', () => {
      const invalidQuery = { ...validEventListQuery, page: 0 }
      const result = EventListQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['page'])
      }
    })

    it('should reject event list query with invalid limit', () => {
      const invalidQuery = { ...validEventListQuery, limit: 101 }
      const result = EventListQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['limit'])
      }
    })
  })

  describe('Event Search Schema Validation', () => {
    it('should validate a valid event search request', () => {
      const result = EventSearchSchema.safeParse(validEventSearchRequest)
      expect(result.success).toBe(true)
    })

    it('should reject event search request with empty query', () => {
      const invalidRequest = { ...validEventSearchRequest, query: '' }
      const result = EventSearchSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['query'])
      }
    })

    it('should reject event search request with query exceeding 100 characters', () => {
      const invalidRequest = { ...validEventSearchRequest, query: 'a'.repeat(101) }
      const result = EventSearchSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['query'])
      }
    })
  })

  describe('EventValidator', () => {
    describe('validateTitle', () => {
      it('should validate a valid title', () => {
        const result = EventValidator.validateTitle('Tech Conference 2024')
        expect(result.isValid).toBe(true)
      })

      it('should reject empty title', () => {
        const result = EventValidator.validateTitle('')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event title is required')
      })

      it('should reject title exceeding 100 characters', () => {
        const result = EventValidator.validateTitle('a'.repeat(101))
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event title cannot exceed 100 characters')
      })
    })

    describe('validateDescription', () => {
      it('should validate a valid description', () => {
        const result = EventValidator.validateDescription('Annual technology conference')
        expect(result.isValid).toBe(true)
      })

      it('should reject empty description', () => {
        const result = EventValidator.validateDescription('')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event description is required')
      })

      it('should reject description exceeding 1000 characters', () => {
        const result = EventValidator.validateDescription('a'.repeat(1001))
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event description cannot exceed 1000 characters')
      })
    })

    describe('validateCapacity', () => {
      it('should validate a valid capacity', () => {
        const result = EventValidator.validateCapacity(500)
        expect(result.isValid).toBe(true)
      })

      it('should reject capacity less than 1', () => {
        const result = EventValidator.validateCapacity(0)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event capacity must be at least 1')
      })

      it('should reject capacity exceeding 10000', () => {
        const result = EventValidator.validateCapacity(10001)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Event capacity cannot exceed 10000')
      })
    })

    describe('validateDates', () => {
      it('should validate valid dates', () => {
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        const result = EventValidator.validateDates(
          futureDate,
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString() // 1 year + 2 days from now
        )
        expect(result.isValid).toBe(true)
      })

      it('should reject end date before start date', () => {
        const result = EventValidator.validateDates(
          '2024-06-03T17:00:00Z',
          '2024-06-01T09:00:00Z'
        )
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('End date must be after start date')
      })

      it('should reject start date in the past', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const futureEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        const result = EventValidator.validateDates(pastDate, futureEndDate)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Start date cannot be in the past')
      })
    })

    describe('validateMetadata', () => {
      it('should validate valid metadata', () => {
        const result = EventValidator.validateMetadata(validEventMetadata)
        expect(result.isValid).toBe(true)
      })

      it('should reject metadata with too many tags', () => {
        const invalidMetadata = { 
          ...validEventMetadata, 
          tags: Array(11).fill('tag')
        }
        const result = EventValidator.validateMetadata(invalidMetadata)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Cannot have more than 10 tags')
      })

      it('should reject metadata with too many categories', () => {
        const invalidMetadata = { 
          ...validEventMetadata, 
          categories: Array(6).fill('category')
        }
        const result = EventValidator.validateMetadata(invalidMetadata)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Cannot have more than 5 categories')
      })

      it('should reject metadata with invalid coordinates', () => {
        const invalidMetadata = { 
          ...validEventMetadata, 
          latitude: 91,
          longitude: 181
        }
        const result = EventValidator.validateMetadata(invalidMetadata)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Invalid coordinates')
      })
    })
  })

  describe('EventService', () => {
    describe('isDraft', () => {
      it('should return true for draft event', () => {
        const result = EventService.isDraft(validEvent)
        expect(result).toBe(true)
      })

      it('should return false for published event', () => {
        const publishedEvent = { ...validEvent, status: 'published' }
        const result = EventService.isDraft(publishedEvent)
        expect(result).toBe(false)
      })
    })

    describe('isPublished', () => {
      it('should return true for published event', () => {
        const publishedEvent = { ...validEvent, status: 'published' }
        const result = EventService.isPublished(publishedEvent)
        expect(result).toBe(true)
      })

      it('should return false for draft event', () => {
        const result = EventService.isPublished(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('isLive', () => {
      it('should return true for live event', () => {
        const now = new Date()
        const liveEvent = { 
          ...validEvent, 
          status: 'live',
          startDate: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          endDate: new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1 hour from now
        }
        const result = EventService.isLive(liveEvent)
        expect(result).toBe(true)
      })

      it('should return false for draft event', () => {
        const result = EventService.isLive(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('isEnded', () => {
      it('should return true for ended event', () => {
        const endedEvent = { ...validEvent, status: 'ended' }
        const result = EventService.isEnded(endedEvent)
        expect(result).toBe(true)
      })

      it('should return false for draft event', () => {
        const result = EventService.isEnded(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('isCancelled', () => {
      it('should return true for cancelled event', () => {
        const cancelledEvent = { ...validEvent, status: 'cancelled' }
        const result = EventService.isCancelled(cancelledEvent)
        expect(result).toBe(true)
      })

      it('should return false for draft event', () => {
        const result = EventService.isCancelled(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('isPublic', () => {
      it('should return true for public event', () => {
        const result = EventService.isPublic(validEvent)
        expect(result).toBe(true)
      })

      it('should return false for private event', () => {
        const privateEvent = { ...validEvent, isPublic: false }
        const result = EventService.isPublic(privateEvent)
        expect(result).toBe(false)
      })
    })

    describe('isFull', () => {
      it('should return true when event is full', () => {
        const fullEvent = { ...validEvent, attendeeCount: 500, capacity: 500 }
        const result = EventService.isFull(fullEvent)
        expect(result).toBe(true)
      })

      it('should return false when event has capacity', () => {
        const result = EventService.isFull(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('getAvailableSpots', () => {
      it('should return correct available spots', () => {
        const result = EventService.getAvailableSpots(validEvent)
        expect(result).toBe(500)
      })

      it('should return 0 when event is full', () => {
        const fullEvent = { ...validEvent, attendeeCount: 500, capacity: 500 }
        const result = EventService.getAvailableSpots(fullEvent)
        expect(result).toBe(0)
      })
    })

    describe('getDurationHours', () => {
      it('should return correct duration in hours', () => {
        const result = EventService.getDurationHours(validEvent)
        expect(result).toBe(56) // 3 days * 24 hours - 8 hours = 56 hours
      })
    })

    describe('isStartingSoon', () => {
      it('should return true when event starts within 24 hours', () => {
        const soonEvent = { 
          ...validEvent, 
          startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
        const result = EventService.isStartingSoon(soonEvent)
        expect(result).toBe(true)
      })

      it('should return false when event starts in more than 24 hours', () => {
        const result = EventService.isStartingSoon(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('isEndingSoon', () => {
      it('should return true when event ends within 24 hours', () => {
        const endingSoonEvent = { 
          ...validEvent, 
          endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
        const result = EventService.isEndingSoon(endingSoonEvent)
        expect(result).toBe(true)
      })

      it('should return false when event ends in more than 24 hours', () => {
        const result = EventService.isEndingSoon(validEvent)
        expect(result).toBe(false)
      })
    })

    describe('getLocation', () => {
      it('should return location when available', () => {
        const result = EventService.getLocation(validEvent)
        expect(result).toBe('San Francisco Convention Center')
      })

      it('should return empty string when location not available', () => {
        const eventWithoutLocation = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, location: undefined }
        }
        const result = EventService.getLocation(eventWithoutLocation)
        expect(result).toBe('')
      })
    })

    describe('getAddress', () => {
      it('should return address when available', () => {
        const result = EventService.getAddress(validEvent)
        expect(result).toBe('123 Main St, San Francisco, CA 94102')
      })

      it('should return empty string when address not available', () => {
        const eventWithoutAddress = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, address: undefined }
        }
        const result = EventService.getAddress(eventWithoutAddress)
        expect(result).toBe('')
      })
    })

    describe('getCity', () => {
      it('should return city when available', () => {
        const result = EventService.getCity(validEvent)
        expect(result).toBe('San Francisco')
      })

      it('should return empty string when city not available', () => {
        const eventWithoutCity = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, city: undefined }
        }
        const result = EventService.getCity(eventWithoutCity)
        expect(result).toBe('')
      })
    })

    describe('getState', () => {
      it('should return state when available', () => {
        const result = EventService.getState(validEvent)
        expect(result).toBe('CA')
      })

      it('should return empty string when state not available', () => {
        const eventWithoutState = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, state: undefined }
        }
        const result = EventService.getState(eventWithoutState)
        expect(result).toBe('')
      })
    })

    describe('getCountry', () => {
      it('should return country when available', () => {
        const result = EventService.getCountry(validEvent)
        expect(result).toBe('USA')
      })

      it('should return empty string when country not available', () => {
        const eventWithoutCountry = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, country: undefined }
        }
        const result = EventService.getCountry(eventWithoutCountry)
        expect(result).toBe('')
      })
    })

    describe('getTimezone', () => {
      it('should return timezone when available', () => {
        const result = EventService.getTimezone(validEvent)
        expect(result).toBe('America/Los_Angeles')
      })

      it('should return default timezone when not available', () => {
        const eventWithoutTimezone = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, timezone: undefined }
        }
        const result = EventService.getTimezone(eventWithoutTimezone)
        expect(result).toBe('UTC')
      })
    })

    describe('getTags', () => {
      it('should return tags when available', () => {
        const result = EventService.getTags(validEvent)
        expect(result).toEqual(['technology', 'conference', 'networking'])
      })

      it('should return empty array when tags not available', () => {
        const eventWithoutTags = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, tags: [] }
        }
        const result = EventService.getTags(eventWithoutTags)
        expect(result).toEqual([])
      })
    })

    describe('getCategories', () => {
      it('should return categories when available', () => {
        const result = EventService.getCategories(validEvent)
        expect(result).toEqual(['Technology', 'Business'])
      })

      it('should return empty array when categories not available', () => {
        const eventWithoutCategories = { 
          ...validEvent, 
          metadata: { ...validEvent.metadata, categories: [] }
        }
        const result = EventService.getCategories(eventWithoutCategories)
        expect(result).toEqual([])
      })
    })

    describe('hasTag', () => {
      it('should return true when event has tag', () => {
        const result = EventService.hasTag(validEvent, 'technology')
        expect(result).toBe(true)
      })

      it('should return false when event does not have tag', () => {
        const result = EventService.hasTag(validEvent, 'mobile')
        expect(result).toBe(false)
      })
    })

    describe('hasCategory', () => {
      it('should return true when event has category', () => {
        const result = EventService.hasCategory(validEvent, 'Technology')
        expect(result).toBe(true)
      })

      it('should return false when event does not have category', () => {
        const result = EventService.hasCategory(validEvent, 'Mobile')
        expect(result).toBe(false)
      })
    })

    describe('getTagCount', () => {
      it('should return correct tag count', () => {
        const result = EventService.getTagCount(validEvent)
        expect(result).toBe(3)
      })
    })

    describe('getCategoryCount', () => {
      it('should return correct category count', () => {
        const result = EventService.getCategoryCount(validEvent)
        expect(result).toBe(2)
      })
    })

    describe('getStatusDisplayText', () => {
      it('should return correct display text for draft', () => {
        const result = EventService.getStatusDisplayText(validEvent)
        expect(result).toBe('Draft')
      })

      it('should return correct display text for published', () => {
        const publishedEvent = { ...validEvent, status: 'published' }
        const result = EventService.getStatusDisplayText(publishedEvent)
        expect(result).toBe('Published')
      })
    })

    describe('getTypeDisplayText', () => {
      it('should return correct display text for conference', () => {
        const result = EventService.getTypeDisplayText(validEvent)
        expect(result).toBe('Conference')
      })

      it('should return correct display text for workshop', () => {
        const workshopEvent = { ...validEvent, type: 'workshop' }
        const result = EventService.getTypeDisplayText(workshopEvent)
        expect(result).toBe('Workshop')
      })
    })

    describe('getCoverImageUrl', () => {
      it('should return cover image URL when available', () => {
        const result = EventService.getCoverImageUrl(validEvent)
        expect(result).toBe('https://example.com/cover.jpg')
      })

      it('should return default URL when cover image not available', () => {
        const eventWithoutCover = { ...validEvent, coverImageUrl: undefined }
        const result = EventService.getCoverImageUrl(eventWithoutCover)
        expect(result).toBe('/default-event-cover.jpg')
      })
    })

    describe('getEventQualityScore', () => {
      it('should return event quality score', () => {
        const result = EventService.getEventQualityScore(validEvent)
        expect(result).toBeGreaterThan(0)
        expect(result).toBeLessThanOrEqual(100)
      })
    })
  })
})
