import { NextRequest, NextResponse } from 'next/server'
import { DataTransformService } from '@/lib/mood-api/client/DataTransformService'
import PostgresAdapter from '@/lib/api-storage/postgres-adapter'
import { getTodayLocal } from '@/lib/utils/dateUtils'

// Initialize PostgreSQL database
const db = PostgresAdapter.getInstance()

export async function GET(request: NextRequest) {
  try {
    // Debug: Log environment variables and database connection
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('NODE_ENV:', process.env.NODE_ENV)

    // Test database connection
    try {
      const isHealthy = await db.healthCheck()
      console.log('Database connection test result:', isHealthy)
      if (!isHealthy) {
        return NextResponse.json(
          { error: 'Database connection failed', details: 'Health check failed' },
          { status: 503 }
        )
      }
    } catch (dbTestError) {
      console.error('Database connection test failed:', dbTestError)
      return NextResponse.json(
        { error: 'Database connection failed', details: dbTestError instanceof Error ? dbTestError.message : 'Unknown database error' },
        { status: 503 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

            // Get mood entries from PostgreSQL database
            let entries
            
            try {
              if (startDate && endDate) {
              entries = await db.getMoodEntriesByDateRange('default-user', startDate, endDate)
            } else {
              entries = await db.getAllMoodEntries('default-user')
            }

    // Transform API response to UI format
    const transformedEntries = entries.map(entry => {
      // Handle date conversion - entry_date is a string from PostgreSQL
      const date = new Date(entry.entry_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const entryDate = `${year}-${month}-${day}`;

      return {
        id: entry.id, // UUID from database
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
    });

            // Apply pagination
            const limitNum = limit ? parseInt(limit) : 50
            const offsetNum = offset ? parseInt(offset) : 0
            const paginatedEntries = transformedEntries.slice(offsetNum, offsetNum + limitNum)

            return NextResponse.json({
              data: paginatedEntries,
              pagination: {
                total: transformedEntries.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < transformedEntries.length
              }
            })
            } catch (dbError) {
              console.error('❌ Database error:', dbError)
              return NextResponse.json(
                { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
                { status: 500 }
              )
            }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching mood entries:', error)
    console.error('❌ Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch mood entries',
          details: errorMessage
        } 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.rating || body.rating < 1 || body.rating > 10) {
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

    // Create mood entry in PostgreSQL database
    const newEntry = await db.createMoodEntry({
      user_id: 'default-user',
      rating: body.rating,
      notes: body.notes || null,
      entry_date: body.entryDate || getTodayLocal(),
      date: body.entryDate || getTodayLocal(), // Also provide date for compatibility
      status: 'active',
      tags: body.tags || [],
      metadata: body.metadata || {}
    })

    return NextResponse.json(newEntry, { status: 201 })

  } catch (error: any) {
    console.error('Error creating mood entry:', error)
    
    // Handle duplicate key constraint (user already has an entry for this date)
    if (error.code === '23505' && error.constraint === 'mood_entries_user_id_date_key') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DUPLICATE_ENTRY', 
            message: 'You already have a mood entry for this date. Please update your existing entry instead.' 
          } 
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create mood entry' 
        } 
      },
      { status: 500 }
    )
  }
}
