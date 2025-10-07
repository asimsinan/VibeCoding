/**
 * Boards API Routes - List and create boards within a workspace
 * FR-001: API-First Design - Boards API implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiService } from '../../../../../../src/lib/api/services/apiService';
import { getApiMiddleware } from '../../../../../../src/lib/api/middleware/apiMiddleware';
import { createValidationMiddleware } from '../../../../../../src/lib/api/middleware/apiMiddleware';
import { validateCreateBoardRequest } from '../../../../../../src/lib/api/validation/apiValidation';
import { initializeApiClient } from '../../../../../../src/lib/api/init';
import { createClient } from '@supabase/supabase-js';

// Initialize API client
initializeApiClient();

const apiService = getApiService();
const middleware = getApiMiddleware();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return middleware.handleRequest(request, async (req) => {
    try {
      const { id: workspaceId } = await params;

      // Get boards from Supabase
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

      // Verify user has access to workspace (owner OR member)
      const { data: ownedWorkspace, error: ownedError } = await supabase
        .from('workspaces')
        .select('id, created_by')
        .eq('id', workspaceId)
        .eq('created_by', authData.user.id)
        .single();

      const { data: memberWorkspace, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', authData.user.id)
        .eq('status', 'accepted')
        .single();

      if ((ownedError && memberError) || (!ownedWorkspace && !memberWorkspace)) {
        return NextResponse.json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workspace not found or access denied',
          },
        }, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get boards for the workspace
      const { data: boards, error: boardsError } = await supabase
        .from('boards')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (boardsError) {
        console.error('Supabase boards fetch error:', boardsError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch boards',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return NextResponse.json({
        data: boards || [],
        meta: {
          total: boards?.length || 0,
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
      console.error('Get boards error:', error);
      throw error;
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return middleware.handleRequest(request, async (req) => {
    try {
      const { id: workspaceId } = await params;

      // Validate request body
      const validationMiddleware = createValidationMiddleware(validateCreateBoardRequest);
      const boardData = await validationMiddleware(req);

      // Create board in Supabase
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

      // Verify user has access to workspace (owner OR member)
      const { data: ownedWorkspace, error: ownedError } = await supabase
        .from('workspaces')
        .select('id, created_by')
        .eq('id', workspaceId)
        .eq('created_by', authData.user.id)
        .single();

      const { data: memberWorkspace, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', authData.user.id)
        .eq('status', 'accepted')
        .single();

      if ((ownedError && memberError) || (!ownedWorkspace && !memberWorkspace)) {
        return NextResponse.json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workspace not found or access denied',
          },
        }, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Create the board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          title: boardData.title,
          description: boardData.description,
          workspace_id: workspaceId,
          created_by: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (boardError) {
        console.error('Supabase board creation error:', boardError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create board',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Create default columns for the board
      const { error: columnsError } = await supabase
        .from('columns')
        .insert([
          {
            title: 'To Do',
            board_id: board.id,
            position: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            title: 'In Progress',
            board_id: board.id,
            position: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            title: 'Done',
            board_id: board.id,
            position: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (columnsError) {
        console.error('Supabase columns creation error:', columnsError);
        // Don't fail the request, just log the error
      }

      return NextResponse.json({
        data: {
          id: board.id,
          title: board.title,
          description: board.description,
          workspace_id: board.workspace_id,
          created_by: board.created_by,
          created_at: board.created_at,
          updated_at: board.updated_at,
        },
      }, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Create board error:', error);
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
      },
    });
  });
}
