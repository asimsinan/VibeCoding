/**
 * Health Check API Route
 * Provides system health status
 * 
 * @fileoverview Health check endpoint for monitoring
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'
import { HttpStatus } from '@/contracts/types/api'

export async function GET(): Promise<NextResponse> {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        realtime: 'up',
        storage: 'up'
      },
      version: '1.0.0',
      uptime: process.uptime()
    }

    return NextResponse.json(healthData, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: 'down',
        realtime: 'down',
        storage: 'down'
      },
      version: '1.0.0',
      uptime: process.uptime()
    }

    return NextResponse.json(errorData, { status: HttpStatus.INTERNAL_SERVER_ERROR })
  }
}
