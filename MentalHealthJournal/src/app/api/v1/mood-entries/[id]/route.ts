import { NextRequest, NextResponse } from 'next/server'
import PostgresAdapter from '@/lib/api-storage/postgres-adapter'

// Initialize PostgreSQL database
const db = PostgresAdapter.getInstance()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

            // Get mood entry from PostgreSQL database
            const entry = await db.getMoodEntry(id)
            
            if (!entry) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: { 
                    code: 'RESOURCE_NOT_FOUND', 
                    message: 'Mood entry not found' 
                  } 
                },
                { status: 404 }
              )
            }

            // Transform API response to UI format
            const entryDate = (entry.entry_date as any) instanceof Date
              ? (entry.entry_date as unknown as Date).toISOString().split('T')[0]
              : (entry.entry_date || entry.date).split('T')[0];
              
            const transformedEntry = {
              id: entry.id, // UUID is already a string
              userId: entry.user_id,
              rating: entry.rating,
              notes: entry.notes,
              date: entryDate, // Convert to date only
              entryDate: entryDate, // Also provide entryDate for compatibility
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
              status: entry.status,
              tags: entry.tags || [],
              metadata: entry.metadata || {}
            };

            return NextResponse.json(transformedEntry)

  } catch (error) {
    console.error('Error fetching mood entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch mood entry' 
        } 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate rating if provided
    if (body.rating && (body.rating < 1 || body.rating > 10)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Rating must be between 1 and 10' 
          } 
        },
        { status: 400 }
      )
    }

            // Update mood entry in PostgreSQL database
            const updatedEntry = await db.updateMoodEntry(id, {
              rating: body.rating,
              notes: body.notes,
              entry_date: body.entryDate,
              status: body.status,
              tags: body.tags,
              metadata: body.metadata
            })

            if (!updatedEntry) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Mood entry not found'
                  }
                },
                { status: 404 }
              )
            }

            // Transform API response to UI format
            const entryDate = (updatedEntry.entry_date as any) instanceof Date
              ? (updatedEntry.entry_date as unknown as Date).toISOString().split('T')[0]
              : (updatedEntry.entry_date || updatedEntry.date).split('T')[0];
              
            const transformedEntry = {
              id: updatedEntry.id, // UUID is already a string
              userId: updatedEntry.user_id,
              rating: updatedEntry.rating,
              notes: updatedEntry.notes,
              date: entryDate, // Convert to date only
              entryDate: entryDate, // Also provide entryDate for compatibility
              createdAt: updatedEntry.created_at,
              updatedAt: updatedEntry.updated_at,
              status: updatedEntry.status,
              tags: updatedEntry.tags || [],
              metadata: updatedEntry.metadata || {}
            };

            return NextResponse.json(transformedEntry)

  } catch (error) {
    console.error('Error updating mood entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update mood entry' 
        } 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete mood entry from PostgreSQL database
    const deleted = await db.deleteMoodEntry(id)

    if (!deleted) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INTERNAL_ERROR', 
            message: 'Failed to delete mood entry' 
          } 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mood entry deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting mood entry:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete mood entry' 
        } 
      },
      { status: 500 }
    )
  }
}
