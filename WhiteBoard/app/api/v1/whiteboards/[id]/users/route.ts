/**
 * Users API Routes
 * Handles user presence operations for a specific whiteboard
 * 
 * @fileoverview API routes for user presence management
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/whiteboard/services/userService'
import { GetActiveUsersResponse } from '@/contracts/types/api'
import { HttpStatus, ErrorCode } from '@/contracts/types/api'

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

    // Get active users for whiteboard
    const activeUsers = await UserService.getActiveUsersForWhiteboard(whiteboardId)

    const response: GetActiveUsersResponse = {
      success: true,
      data: {
        users: activeUsers.map(user => ({
          id: user.id,
          displayName: user.displayName,
          lastSeen: user.lastSeen.toISOString(),
          cursorPosition: user.cursorPosition,
          whiteboardId: whiteboardId
        }))
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Error in GET /api/v1/whiteboards/[id]/users:', error)
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
