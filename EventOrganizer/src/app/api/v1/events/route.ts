/**
 * Events API Route
 * 
 * Handles GET requests for events with optional filtering
 * 
 * @fileoverview Events API Route for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublic = searchParams.get('isPublic')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (isPublic === 'true') {
      query = query.eq('status', 'published')
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    if (offset) {
      const offsetNum = parseInt(offset)
      const limitNum = parseInt(limit || '10')
      query = query.range(offsetNum, offsetNum + limitNum - 1)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      events: data || [],
      total: data?.length || 0,
      limit: parseInt(limit || '10'),
      offset: parseInt(offset || '0')
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('events')
      .insert([body] as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
