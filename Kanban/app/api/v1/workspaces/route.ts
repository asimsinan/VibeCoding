/**
 * Workspaces API Routes - List and create workspaces
 * FR-001: API-First Design - Workspaces API implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiService } from '../../../../src/lib/api/services/apiService';
import { getApiMiddleware } from '../../../../src/lib/api/middleware/apiMiddleware';
import { createValidationMiddleware } from '../../../../src/lib/api/middleware/apiMiddleware';
import { validateCreateWorkspaceRequest } from '../../../../src/lib/api/validation/apiValidation';
import { initializeApiClient } from '../../../../src/lib/api/init';
import { createClient } from '@supabase/supabase-js';

// Initialize API client
initializeApiClient();

const apiService = getApiService();
const middleware = getApiMiddleware();

export async function GET(request: NextRequest) {
  return middleware.handleRequest(request, async (req) => {
    try {
      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');

      const params = {
        ...(page && { page: parseInt(page, 10) }),
        ...(limit && { limit: parseInt(limit, 10) }),
      };

      // Get workspaces from Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get user from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Create a client with the user's token
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Set the session with the user's token
      const { data: authData, error: authError } = await userSupabase.auth.getUser(token);
      if (authError || !authData.user) {
        return NextResponse.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        }, {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get workspaces where user is owner OR member
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', authData.user.id);

      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          workspaces (*)
        `)
        .eq('user_id', authData.user.id)
        .eq('status', 'accepted');

      if (ownedError || memberError) {
        console.error('Supabase workspaces fetch error:', ownedError || memberError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch workspaces',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Combine owned and member workspaces
      const memberWorkspaceList = memberWorkspaces?.map(m => m.workspaces).filter(Boolean) || [];
      const allWorkspaces = [...(ownedWorkspaces || []), ...memberWorkspaceList];
      
      // Remove duplicates and sort
      const uniqueWorkspaces = allWorkspaces.filter((workspace, index, self) => 
        index === self.findIndex(w => w.id === workspace.id)
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        data: uniqueWorkspaces,
        meta: {
          total: uniqueWorkspaces.length,
          limit: 10,
          offset: 0,
          has_more: false,
        },
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        },
      });
    } catch (error) {
      console.error('Get workspaces error:', error);
      throw error;
    }
  });
}

export async function POST(request: NextRequest) {
  return middleware.handleRequest(request, async (req) => {
    try {
      // Validate request body
      const validationMiddleware = createValidationMiddleware(validateCreateWorkspaceRequest);
      const workspaceData = await validationMiddleware(req);

      // Create workspace in Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get user from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        }, {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Create a client with the user's token
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Set the session with the user's token
      const { data: authData, error: authError } = await userSupabase.auth.getUser(token);
      if (authError || !authData.user) {
        return NextResponse.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        }, {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceData.name,
          description: workspaceData.description,
          created_by: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (workspaceError) {
        console.error('Supabase workspace creation error:', workspaceError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create workspace',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return NextResponse.json({
        data: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          created_by: workspace.created_by,
          created_at: workspace.created_at,
          updated_at: workspace.updated_at,
        },
      }, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Create workspace error:', error);
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  });
}
