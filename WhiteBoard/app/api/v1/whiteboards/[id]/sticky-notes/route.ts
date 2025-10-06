/**
 * Sticky Notes API Routes
 * Handles sticky note operations for a specific whiteboard
 * 
 * @fileoverview API routes for sticky note management
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { StickyNoteService } from '@/lib/whiteboard/services/stickyNoteService'
import { CreateStickyNoteRequest, AddStickyNoteResponse, GetStickyNotesResponse } from '@/contracts/types/api'
import { HttpStatus, ErrorCode } from '@/contracts/types/api'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
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

    // Get sticky notes for whiteboard
    const stickyNotes = await StickyNoteService.getStickyNotesForWhiteboard(whiteboardId)
    
    const response: GetStickyNotesResponse = {
      success: true,
      data: {
        stickyNotes: stickyNotes.map(stickyNote => ({
          id: stickyNote.id,
          whiteboardId: stickyNote.whiteboardId,
          content: stickyNote.content,
          position: stickyNote.position,
          color: stickyNote.color,
          userId: stickyNote.userId,
          createdAt: stickyNote.createdAt.toISOString(),
          updatedAt: stickyNote.updatedAt.toISOString()
        }))
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Error in GET /api/v1/whiteboards/[id]/sticky-notes:', error)
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
    const body: CreateStickyNoteRequest = await request.json()

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
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Content is required', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (body.content.length > 500) {
      return NextResponse.json(
        { 
          error: 'Content must be 500 characters or less', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (!body.position || !body.position.x || !body.position.y) {
      return NextResponse.json(
        { 
          error: 'Position with x and y coordinates is required', 
          code: ErrorCode.VALIDATION_ERROR, 
          timestamp: new Date().toISOString() 
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    if (typeof body.position.x !== 'number' || typeof body.position.y !== 'number') {
      return NextResponse.json(
        { 
          error: 'Position coordinates must be numbers', 
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

    // Get user ID from authenticated request
    const userId = authenticatedRequest.user?.id || '550e8400-e29b-41d4-a716-446655440000'

    // Create sticky note
    const stickyNote = await StickyNoteService.createStickyNote(whiteboardId, {
      content: body.content,
      position: body.position,
      color: body.color,
      userId: userId
    })

    const response: AddStickyNoteResponse = {
      success: true,
      data: {
        id: stickyNote.id,
        whiteboardId: whiteboardId,
        content: stickyNote.content,
        position: stickyNote.position,
        color: stickyNote.color,
        userId: stickyNote.userId,
        createdAt: stickyNote.createdAt.toISOString()
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: HttpStatus.CREATED })
  } catch (error) {
    console.error('Error in POST /api/v1/whiteboards/[id]/sticky-notes:', error)
    
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
