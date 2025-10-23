import { NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json(
      {
        success: true,
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
