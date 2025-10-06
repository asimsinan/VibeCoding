/**
 * Drawings API Routes
 * Handles drawing operations for a specific whiteboard
 * 
 * @fileoverview API routes for drawing management
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { DrawingService } from '@/lib/whiteboard/services/drawingService'
import { CreateDrawingRequest, AddDrawingResponse, GetDrawingsResponse } from '@/contracts/types/api'
import { HttpStatus, ErrorCode } from '@/contracts/types/api'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // TODO: Implement authentication check
    // const authResult = await authenticateRequest(request)
    // if (!authResult.success) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED, timestamp: new Date().toISOString() },
    //     { status: HttpStatus.UNAUTHORIZED }
    //   )
    // }

    const { id: whiteboardId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(whiteboardId)) {
      return NextResponse.json(
        { 
          error: 'Invalid whiteboard ID format', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Get drawings for whiteboard
    const drawings = await DrawingService.getDrawingsForWhiteboard(whiteboardId)

    const response: GetDrawingsResponse = {
      success: true,
      data: {
        drawings: drawings.map(drawing => ({
          id: drawing.id,
          whiteboardId: drawing.whiteboardId,
          tool: drawing.tool,
          color: drawing.color,
          size: drawing.size,
          points: drawing.points,
          userId: drawing.userId,
          createdAt: drawing.createdAt.toISOString(),
          updatedAt: drawing.updatedAt.toISOString()
        }))
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Error in GET /api/v1/whiteboards/[id]/drawings:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: ErrorCode.INTERNAL_ERROR, 
        timestamp: new Date().toISOString() 
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Authenticate request
    const authenticatedRequest = await authenticateRequest(request)
    const { id: whiteboardId } = params
    const body: CreateDrawingRequest = await request.json()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(whiteboardId)) {
      return NextResponse.json(
        { 
          error: 'Invalid whiteboard ID format', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Validate request body
    if (!body.tool || !['pen', 'brush', 'eraser'].includes(body.tool)) {
      return NextResponse.json(
        { 
          error: 'Tool must be pen, brush, or eraser', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (!body.color || !body.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return NextResponse.json(
        { 
          error: 'Color must be a valid hex color', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (!body.size || body.size < 1 || body.size > 50) {
      return NextResponse.json(
        { 
          error: 'Size must be between 1 and 50', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (!body.points || body.points.length === 0) {
      return NextResponse.json(
        { 
          error: 'Points array cannot be empty', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Get user ID from authenticated request
    const userId = authenticatedRequest.user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Create drawing
    const drawing = await DrawingService.createDrawing(whiteboardId, {
      tool: body.tool,
      color: body.color,
      size: body.size,
      points: body.points,
      userId: userId
    })

    const response: AddDrawingResponse = {
      success: true,
      data: {
        id: drawing.id,
        tool: drawing.tool,
        color: drawing.color,
        size: drawing.size,
        points: drawing.points,
        userId: drawing.userId,
        createdAt: drawing.createdAt.toISOString()
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: HttpStatus.CREATED })
  } catch (error) {
    console.error('Error in POST /api/v1/whiteboards/[id]/drawings:', error)
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: ErrorCode.INTERNAL_ERROR, 
        timestamp: new Date().toISOString() 
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
