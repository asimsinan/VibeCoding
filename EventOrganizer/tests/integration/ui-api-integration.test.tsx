import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIClient, APIResponse } from '../../src/lib/api/client'
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../src/lib/api/hooks'
import { useEventStore, useAuthStore } from '../../src/lib/stores'
import { webSocketService } from '../../src/lib/real-time/WebSocketService'
import { cacheManager } from '../../src/lib/cache'
import { ToastProvider, useToast } from '../../src/components/ui/UserFeedback'
import { ErrorBoundary } from '../../src/components/ui/LoadingStates'
import * as React from 'react'

// Mock API client
const mockAPIClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  healthCheck: jest.fn(),
  getCircuitBreakerStatus: jest.fn()
}

// Mock WebSocket service
const mockWebSocketService = {
  subscribeToEvents: jest.fn(),
  subscribeToSessions: jest.fn(),
  subscribeToAttendees: jest.fn(),
  subscribeToNotifications: jest.fn(),
  subscribeToConnections: jest.fn(),
  subscribeToMessages: jest.fn(),
  subscribeToUserPresence: jest.fn(),
  broadcastEvent: jest.fn(),
  cleanup: jest.fn(),
  getConnectionStatus: jest.fn()
}

// Mock cache manager
const mockCacheManager = {
  invalidatePattern: jest.fn(),
  invalidateAll: jest.fn(),
  getStats: jest.fn(),
  destroy: jest.fn()
}

// Mock modules
jest.mock('../../src/lib/api/client', () => ({
  APIClient: jest.fn().mockImplementation(() => mockAPIClient),
  apiClient: mockAPIClient
}))

jest.mock('../../src/lib/real-time/WebSocketService', () => ({
  webSocketService: mockWebSocketService
}))

jest.mock('../../src/lib/cache', () => ({
  cacheManager: mockCacheManager
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  )
}

// Test component for API hooks
function TestComponent() {
  const { data: events, isLoading, error } = useEvents()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  const { addToast } = useToast()

  const handleCreateEvent = async () => {
    try {
      await createEvent.mutateAsync({
        name: 'Test Event',
        description: 'Test Description',
        startDate: '2024-07-20T09:00:00Z',
        endDate: '2024-07-20T17:00:00Z',
        location: 'Virtual',
        organizerId: 'user123',
        maxAttendees: 100,
        currentAttendees: 0,
        ticketPrice: 0,
        currency: 'USD',
        category: 'conference',
        tags: ['tech'],
        status: 'scheduled'
      })
      addToast({ type: 'success', title: 'Event created successfully' })
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to create event' })
    }
  }

  const handleUpdateEvent = async () => {
    try {
      await updateEvent.mutateAsync({
        id: 'event123',
        data: { name: 'Updated Event' }
      })
      addToast({ type: 'success', title: 'Event updated successfully' })
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to update event' })
    }
  }

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent.mutateAsync('event123')
      addToast({ type: 'success', title: 'Event deleted successfully' })
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to delete event' })
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <div data-testid="events-count">{events?.length || 0}</div>
      <button onClick={handleCreateEvent} data-testid="create-event">
        Create Event
      </button>
      <button onClick={handleUpdateEvent} data-testid="update-event">
        Update Event
      </button>
      <button onClick={handleDeleteEvent} data-testid="delete-event">
        Delete Event
      </button>
    </div>
  )
}

describe('UI-API Integration Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Reset all mocks
    jest.clearAllMocks()
    
    // Reset stores
    useEventStore.getState().setEvents([])
    useAuthStore.getState().setUser(null)
    
    // Reset cache
    cacheManager.invalidateAll()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('API Client Integration', () => {
    it('should handle successful API responses', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: [
          {
            id: 'event1',
            name: 'Test Event 1',
            description: 'Test Description 1',
            startDate: '2024-07-20T09:00:00Z',
            endDate: '2024-07-20T17:00:00Z',
            location: 'Virtual',
            organizerId: 'user123',
            maxAttendees: 100,
            currentAttendees: 0,
            ticketPrice: 0,
            currency: 'USD',
            category: 'conference',
            tags: ['tech'],
            status: 'scheduled',
            createdAt: '2024-07-19T10:00:00Z',
            updatedAt: '2024-07-19T10:00:00Z'
          }
        ],
        timestamp: new Date().toISOString()
      }

      mockAPIClient.get.mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('1')
      })

      expect(mockAPIClient.get).toHaveBeenCalledWith('/events')
    })

    it('should handle API errors gracefully', async () => {
      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.get.mockResolvedValue(mockError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should handle authentication errors', async () => {
      const mockAuthError: APIResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.get.mockResolvedValue(mockAuthError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should implement retry logic for failed requests', async () => {
      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })

      // Should have been called multiple times due to retry logic
      expect(mockAPIClient.get).toHaveBeenCalledTimes(3)
    })

    it('should implement circuit breaker pattern', async () => {
      mockAPIClient.getCircuitBreakerStatus.mockReturnValue({
        state: 'OPEN',
        failures: 5
      })

      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_OPEN',
          message: 'Circuit breaker is open',
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.get.mockResolvedValue(mockError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })

      expect(mockAPIClient.getCircuitBreakerStatus).toHaveBeenCalled()
    })
  })

  describe('State Management Integration', () => {
    it('should sync API data with Zustand store', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: [
          {
            id: 'event1',
            name: 'Test Event 1',
            description: 'Test Description 1',
            startDate: '2024-07-20T09:00:00Z',
            endDate: '2024-07-20T17:00:00Z',
            location: 'Virtual',
            organizerId: 'user123',
            maxAttendees: 100,
            currentAttendees: 0,
            ticketPrice: 0,
            currency: 'USD',
            category: 'conference',
            tags: ['tech'],
            status: 'scheduled',
            createdAt: '2024-07-19T10:00:00Z',
            updatedAt: '2024-07-19T10:00:00Z'
          }
        ],
        timestamp: new Date().toISOString()
      }

      mockAPIClient.get.mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('1')
      })

      // Check if store was updated
      const events = useEventStore.getState().events
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Test Event 1')
    })

    it('should handle optimistic updates', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: {
          id: 'event1',
          name: 'Updated Event',
          description: 'Test Description 1',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        },
        timestamp: new Date().toISOString()
      }

      mockAPIClient.put.mockResolvedValue(mockResponse)

      // Set initial state
      useEventStore.getState().setEvents([
        {
          id: 'event1',
          name: 'Test Event 1',
          description: 'Test Description 1',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        }
      ])

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('update-event'))

      await waitFor(() => {
        expect(mockAPIClient.put).toHaveBeenCalledWith('/events/event123', { name: 'Updated Event' })
      })

      // Check if store was updated
      const events = useEventStore.getState().events
      expect(events[0].name).toBe('Updated Event')
    })
  })

  describe('Real-time Integration', () => {
    it('should handle real-time event updates', async () => {
      const mockCallback = jest.fn()
      mockWebSocketService.subscribeToEvents.mockReturnValue(() => {})

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Simulate real-time event
      const realTimeEvent = {
        type: 'event_updated',
        payload: {
          id: 'event1',
          name: 'Updated Event Name',
          description: 'Test Description 1',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        },
        timestamp: new Date().toISOString(),
        userId: 'user123'
      }

      // Get the callback that was passed to subscribeToEvents
      const subscribeCall = mockWebSocketService.subscribeToEvents.mock.calls[0]
      const callback = subscribeCall[0]

      // Call the callback with the real-time event
      callback(realTimeEvent)

      expect(mockWebSocketService.subscribeToEvents).toHaveBeenCalled()
    })

    it('should handle connection status changes', async () => {
      mockWebSocketService.getConnectionStatus.mockReturnValue({
        isConnected: false,
        connectionStatus: 'disconnected',
        lastActivity: null,
        error: 'Connection failed'
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(mockWebSocketService.getConnectionStatus).toHaveBeenCalled()
    })
  })

  describe('Caching Integration', () => {
    it('should use cache for repeated requests', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: [
          {
            id: 'event1',
            name: 'Test Event 1',
            description: 'Test Description 1',
            startDate: '2024-07-20T09:00:00Z',
            endDate: '2024-07-20T17:00:00Z',
            location: 'Virtual',
            organizerId: 'user123',
            maxAttendees: 100,
            currentAttendees: 0,
            ticketPrice: 0,
            currency: 'USD',
            category: 'conference',
            tags: ['tech'],
            status: 'scheduled',
            createdAt: '2024-07-19T10:00:00Z',
            updatedAt: '2024-07-19T10:00:00Z'
          }
        ],
        timestamp: new Date().toISOString()
      }

      mockAPIClient.get.mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('1')
      })

      // Re-render to trigger cache usage
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should only be called once due to caching
      expect(mockAPIClient.get).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache on mutations', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: {
          id: 'event1',
          name: 'New Event',
          description: 'Test Description 1',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        },
        timestamp: new Date().toISOString()
      }

      mockAPIClient.post.mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('create-event'))

      await waitFor(() => {
        expect(mockAPIClient.post).toHaveBeenCalled()
      })

      expect(cacheManager.invalidatePattern).toHaveBeenCalledWith('events')
    })
  })

  describe('Error Handling Integration', () => {
    it('should display error messages to users', async () => {
      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data',
          details: { name: 'Name is required' },
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.get.mockResolvedValue(mockError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      mockAPIClient.get.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should handle timeout errors', async () => {
      mockAPIClient.get.mockRejectedValue(new Error('Request timeout'))

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })
  })

  describe('User Feedback Integration', () => {
    it('should show success toast on successful operations', async () => {
      const mockResponse: APIResponse = {
        success: true,
        data: {
          id: 'event1',
          name: 'New Event',
          description: 'Test Description 1',
          startDate: '2024-07-20T09:00:00Z',
          endDate: '2024-07-20T17:00:00Z',
          location: 'Virtual',
          organizerId: 'user123',
          maxAttendees: 100,
          currentAttendees: 0,
          ticketPrice: 0,
          currency: 'USD',
          category: 'conference',
          tags: ['tech'],
          status: 'scheduled',
          createdAt: '2024-07-19T10:00:00Z',
          updatedAt: '2024-07-19T10:00:00Z'
        },
        timestamp: new Date().toISOString()
      }

      mockAPIClient.post.mockResolvedValue(mockResponse)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('create-event'))

      await waitFor(() => {
        expect(screen.getByText('Event created successfully')).toBeInTheDocument()
      })
    })

    it('should show error toast on failed operations', async () => {
      const mockError: APIResponse = {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: 'Failed to create event',
          timestamp: new Date().toISOString()
        }
      }

      mockAPIClient.post.mockResolvedValue(mockError)

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('create-event'))

      await waitFor(() => {
        expect(screen.getByText('Failed to create event')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `event${i}`,
        name: `Test Event ${i}`,
        description: `Test Description ${i}`,
        startDate: '2024-07-20T09:00:00Z',
        endDate: '2024-07-20T17:00:00Z',
        location: 'Virtual',
        organizerId: 'user123',
        maxAttendees: 100,
        currentAttendees: 0,
        ticketPrice: 0,
        currency: 'USD',
        category: 'conference',
        tags: ['tech'],
        status: 'scheduled',
        createdAt: '2024-07-19T10:00:00Z',
        updatedAt: '2024-07-19T10:00:00Z'
      }))

      const mockResponse: APIResponse = {
        success: true,
        data: largeDataset,
        timestamp: new Date().toISOString()
      }

      mockAPIClient.get.mockResolvedValue(mockResponse)

      const startTime = performance.now()

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('1000')
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })

    it('should implement proper loading states', async () => {
      // Mock a delayed response
      mockAPIClient.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: [],
            timestamp: new Date().toISOString()
          }), 100)
        )
      )

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Should show loading state initially
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('events-count')).toHaveTextContent('0')
      })
    })
  })
})
