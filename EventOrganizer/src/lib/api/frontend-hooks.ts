/**
 * React Query Hooks for Frontend API
 * 
 * Provides React Query hooks for efficient data fetching and caching
 * 
 * @fileoverview React Query Hooks for Virtual Event Organizer Frontend
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { apiClient, Event, Session, CreateEventRequest, CreateSessionRequest } from './frontend-client'

// Query keys
export const queryKeys = {
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.sessions.lists(), filters] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.notifications.lists(), filters] as const,
  },
  connections: {
    all: ['connections'] as const,
    lists: () => [...queryKeys.connections.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.connections.lists(), filters] as const,
  },
}

// Event hooks
export const useEvents = (
  params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    isPublic?: boolean
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.events.list(params || {}),
    queryFn: () => apiClient.getEvents(params),
    ...options,
  })
}

export const useEvent = (id: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => apiClient.getEvent(id),
    enabled: !!id,
    ...options,
  })
}

export const useCreateEvent = (options?: UseMutationOptions<any, Error, CreateEventRequest>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEventRequest) => apiClient.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() })
    },
    ...options,
  })
}

export const useUpdateEvent = (options?: UseMutationOptions<any, Error, { id: string; data: Partial<CreateEventRequest> }>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() })
    },
    ...options,
  })
}

export const useDeleteEvent = (options?: UseMutationOptions<any, Error, string>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() })
    },
    ...options,
  })
}

export const useRegisterForEvent = (options?: UseMutationOptions<any, Error, string>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (eventId: string) => apiClient.registerForEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() })
    },
    ...options,
  })
}

// Session hooks
export const useSessions = (
  eventId?: string,
  params?: {
    page?: number
    limit?: number
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.sessions.list({ eventId, ...params }),
    queryFn: () => apiClient.getSessions(eventId, params),
    ...options,
  })
}

export const useSession = (id: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => apiClient.getSession(id),
    enabled: !!id,
    ...options,
  })
}

export const useCreateSession = (options?: UseMutationOptions<any, Error, CreateSessionRequest>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => apiClient.createSession(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(data.eventId) })
    },
    ...options,
  })
}

export const useUpdateSession = (options?: UseMutationOptions<any, Error, { id: string; data: Partial<CreateSessionRequest> }>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updateSession(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() })
    },
    ...options,
  })
}

export const useDeleteSession = (options?: UseMutationOptions<any, Error, string>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.lists() })
    },
    ...options,
  })
}

// Notification hooks
export const useNotifications = (
  params?: {
    page?: number
    limit?: number
    type?: string
    priority?: string
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(params || {}),
    queryFn: () => apiClient.getNotifications(params),
    ...options,
  })
}

export const useSendNotification = (options?: UseMutationOptions<any, Error, any>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() })
    },
    ...options,
  })
}

// Connection hooks
export const useConnections = (
  params?: {
    page?: number
    limit?: number
    status?: string
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.connections.list(params || {}),
    queryFn: () => apiClient.getConnections(params),
    ...options,
  })
}

export const useRequestConnection = (options?: UseMutationOptions<any, Error, any>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.requestConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() })
    },
    ...options,
  })
}

export const useAcceptConnection = (options?: UseMutationOptions<any, Error, string>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (connectionId: string) => apiClient.acceptConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.lists() })
    },
    ...options,
  })
}

// Utility hooks
export const useInvalidateAllQueries = () => {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries()
  }
}
