/**
 * Frontend API Client
 * 
 * Provides a clean interface for frontend components to interact with the API
 * without importing Node.js-specific services directly.
 * 
 * @fileoverview Frontend API Client for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Types
export interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  capacity: number
  attendeeCount: number
  status: 'draft' | 'published' | 'live' | 'ended' | 'cancelled'
  organizerId: string
  isPublic: boolean
  type: string
  location?: string
  timezone: string
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateEventRequest {
  title: string
  description: string
  startDate: string
  endDate: string
  capacity: number
  isPublic?: boolean
  type?: string
  location?: string
  timezone?: string
}

export interface Session {
  id: string
  eventId: string
  title: string
  description: string
  speaker: {
    name: string
    isExternal: boolean
    bio?: string
    email?: string
    linkedin?: string
  }
  startTime: string
  endTime: string
  type: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  currentAttendees: number
  maxAttendees?: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateSessionRequest {
  eventId: string
  title: string
  description: string
  speaker: string
  startTime: string
  endTime: string
}

export interface User {
  id: string
  email: string
  role: 'organizer' | 'attendee' | 'admin'
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
    avatar?: string
  }
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

class FrontendAPIClient {
  private client: AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error)
      }
    )
  }

  // Authentication methods
  setAuthToken(token: string | null) {
    this.authToken = token
  }

  // Event methods
  async getEvents(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    isPublic?: boolean
  }): Promise<APIResponse<PaginatedResponse<Event>>> {
    const response = await this.client.get('/events', { params })
    return response.data
  }

  async getEvent(id: string): Promise<APIResponse<Event>> {
    const response = await this.client.get(`/events/${id}`)
    return response.data
  }

  async createEvent(eventData: CreateEventRequest): Promise<APIResponse<Event>> {
    const response = await this.client.post('/events', eventData)
    return response.data
  }

  async updateEvent(id: string, eventData: Partial<CreateEventRequest>): Promise<APIResponse<Event>> {
    const response = await this.client.put(`/events/${id}`, eventData)
    return response.data
  }

  async deleteEvent(id: string): Promise<APIResponse<void>> {
    const response = await this.client.delete(`/events/${id}`)
    return response.data
  }

  async registerForEvent(eventId: string): Promise<APIResponse<void>> {
    const response = await this.client.post(`/events/${eventId}/register`)
    return response.data
  }

  // Session methods
  async getSessions(eventId?: string, params?: {
    page?: number
    limit?: number
  }): Promise<APIResponse<PaginatedResponse<Session>>> {
    const url = eventId ? `/events/${eventId}/sessions` : '/sessions'
    const response = await this.client.get(url, { params })
    return response.data
  }

  async getSession(id: string): Promise<APIResponse<Session>> {
    const response = await this.client.get(`/sessions/${id}`)
    return response.data
  }

  async createSession(sessionData: CreateSessionRequest): Promise<APIResponse<Session>> {
    const response = await this.client.post('/sessions', sessionData)
    return response.data
  }

  async updateSession(id: string, sessionData: Partial<CreateSessionRequest>): Promise<APIResponse<Session>> {
    const response = await this.client.put(`/sessions/${id}`, sessionData)
    return response.data
  }

  async deleteSession(id: string): Promise<APIResponse<void>> {
    const response = await this.client.delete(`/sessions/${id}`)
    return response.data
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number
    limit?: number
    type?: string
    priority?: string
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    const response = await this.client.get('/notifications', { params })
    return response.data
  }

  async sendNotification(notificationData: {
    title: string
    message: string
    type: string
    priority: string
    eventId?: string
  }): Promise<APIResponse<any>> {
    const response = await this.client.post('/notifications', notificationData)
    return response.data
  }

  // Networking methods
  async getConnections(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<APIResponse<PaginatedResponse<any>>> {
    const response = await this.client.get('/networking/connections', { params })
    return response.data
  }

  async requestConnection(connectionData: {
    recipientId: string
    message: string
  }): Promise<APIResponse<any>> {
    const response = await this.client.post('/networking/connect', connectionData)
    return response.data
  }

  async acceptConnection(connectionId: string): Promise<APIResponse<any>> {
    const response = await this.client.post(`/networking/connections/${connectionId}/accept`)
    return response.data
  }
}

// Create singleton instance
export const apiClient = new FrontendAPIClient()

// Export types and client
export default apiClient
