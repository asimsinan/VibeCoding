import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This will fail initially - no implementation yet
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'NOT_IMPLEMENTED', 
        message: 'API endpoint not implemented yet' 
      } 
    },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  // This will fail initially - no implementation yet
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'NOT_IMPLEMENTED', 
        message: 'API endpoint not implemented yet' 
      } 
    },
    { status: 501 }
  )
}
