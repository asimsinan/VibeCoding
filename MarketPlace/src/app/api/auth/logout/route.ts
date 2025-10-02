// Authentication API - Logout
// API route for user logout

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // For JWT tokens, logout is handled client-side by removing the token
    // In a more sophisticated system, you might maintain a blacklist of tokens
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}