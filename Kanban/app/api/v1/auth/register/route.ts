/**
 * Authentication API Routes - Register endpoint
 * FR-001: API-First Design - Authentication API implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiService } from '../../../../../src/lib/api/services/apiService';
import { ApiMiddleware, createValidationMiddleware } from '../../../../../src/lib/api/middleware/apiMiddleware';
import { validateRegisterRequest } from '../../../../../src/lib/api/validation/apiValidation';
import { initializeApiClient, getInitializedApiClient } from '../../../../../src/lib/api/init';

// Initialize API client
initializeApiClient();

const apiService = getApiService();
// Create middleware without authentication for registration
const middleware = new ApiMiddleware({
  enableAuth: false, // Disable auth for registration
  enableCORS: true,
  enableRateLimit: true,
  enableValidation: true,
});

export async function POST(request: NextRequest) {
  return middleware.handleRequest(request, async (req) => {
    try {
      // Validate request body
      const validationMiddleware = createValidationMiddleware(validateRegisterRequest);
      const registerData = await validationMiddleware(req);
      // Call API service
      const response = await apiService.auth.register(registerData);
      // Set authentication tokens
      if (response.data.session?.access_token && response.data.session?.refresh_token) {
        getInitializedApiClient().setTokens(response.data.session.access_token, response.data.session.refresh_token);
      }
      return NextResponse.json(response.data, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  });
}
export async function OPTIONS(request: NextRequest) {
  return middleware.handleRequest(request, async () => {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  });
}
