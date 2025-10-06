/**
 * API Client
 * 
 * Comprehensive API client for the collaborative whiteboard application.
 * Handles authentication, error handling, retries, and request/response interceptors.
 * 
 * @fileoverview API client with Next.js App Router integration
 * @version 1.0.0
 */

import { supabase } from '@/lib/supabase/client'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
const API_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Request/Response Types
interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  data?: any
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  status: number
}

// API Client Class
export class ApiClient {
  private baseURL: string
  private timeout: number
  private maxRetries: number
  private retryDelay: number
  private supabase: any

  constructor() {
    this.baseURL = API_BASE_URL
    this.timeout = API_TIMEOUT
    this.maxRetries = MAX_RETRIES
    this.retryDelay = RETRY_DELAY
    this.supabase = supabase
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
      
      return {
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.warn('Failed to get auth headers:', error)
      return {
        'Content-Type': 'application/json'
      }
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    const { method, url, data, headers = {}, timeout = this.timeout, retries = 0 } = request
    
    try {
      const authHeaders = await this.getAuthHeaders()
      const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(fullUrl, {
        method,
        headers: {
          ...authHeaders,
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new ApiError(
          responseData.error || 'Request failed',
          responseData.code || 'REQUEST_FAILED',
          responseData.details,
          new Date().toISOString(),
          response.status
        )
      }
      
      return {
        success: true,
        data: responseData.data || responseData,
        timestamp: new Date().toISOString(),
        status: response.status
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Handle network errors and retries
      if (retries < this.maxRetries && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retries))
        return this.makeRequest({ ...request, retries: retries + 1 })
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
        error,
        new Date().toISOString(),
        0
      )
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (error.name === 'AbortError') return false
    if (error.status >= 400 && error.status < 500) return false
    return true
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * GET request
   */
  async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      url,
      headers
    })
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      url,
      data,
      headers
    })
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      url,
      data,
      headers
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      url,
      headers
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PATCH',
      url,
      data,
      headers
    })
  }
}

// Custom Error Class
export class ApiError extends Error {
  public code: string
  public details?: any
  public timestamp: string
  public status: number

  constructor(message: string, code: string, details?: any, timestamp?: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.timestamp = timestamp || new Date().toISOString()
    this.status = status || 0
  }
}

// Singleton instance
export const apiClient = new ApiClient()

// Export types
export type { ApiRequest, ApiResponse }
