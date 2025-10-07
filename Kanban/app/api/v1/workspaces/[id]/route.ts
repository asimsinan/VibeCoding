/**
 * Workspaces API Routes - Get, update, and delete workspace
 * FR-001: API-First Design - Workspaces API implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiService } from '../../../../../src/lib/api/services/apiService';
import { getApiMiddleware } from '../../../../../src/lib/api/middleware/apiMiddleware';
import { createValidationMiddleware } from '../../../../../src/lib/api/middleware/apiMiddleware';
import { validateUpdateWorkspaceRequest } from '../../../../../src/lib/api/validation/apiValidation';
import { initializeApiClient } from '../../../../../src/lib/api/init';
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
      
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
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

      // Get workspace (check if user owns it or is a member)
      const { data: ownedWorkspace, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
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

      return NextResponse.json({
        data: ownedWorkspace,
        meta: {
          total: 1,
          limit: 1,
          offset: 0,
          has_more: false,
        },
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300',
        },
      });
    } catch (error) {
      console.error('Get workspace error:', error);
      throw error;
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return middleware.handleRequest(request, async (req) => {
    try {
      const { id: workspaceId } = await params;

      // Validate request body
      const validationMiddleware = createValidationMiddleware(validateUpdateWorkspaceRequest);
      const workspaceData = await validationMiddleware(req);

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
      
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
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

      // Verify user owns the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, created_by')
        .eq('id', workspaceId)
        .eq('created_by', authData.user.id)
        .single();

      if (workspaceError || !workspace) {
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

      // Update the workspace
      const { data: updatedWorkspace, error: updateError } = await supabase
        .from('workspaces')
        .update({
          name: workspaceData.name,
          description: workspaceData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase workspace update error:', updateError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update workspace',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return NextResponse.json({
        data: updatedWorkspace,
        meta: {
          total: 1,
          limit: 1,
          offset: 0,
          has_more: false,
        },
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('Update workspace error:', error);
      throw error;
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return middleware.handleRequest(request, async (req) => {
    try {
      const { id: workspaceId } = await params;

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
      
      // Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
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

      // Verify user owns the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, created_by')
        .eq('id', workspaceId)
        .eq('created_by', authData.user.id)
        .single();

      if (workspaceError || !workspace) {
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

      // Delete all boards in the workspace first
      const { error: boardsError } = await supabase
        .from('boards')
        .delete()
        .eq('workspace_id', workspaceId);

      if (boardsError) {
        console.error('Error deleting boards:', boardsError);
        // Continue with workspace deletion even if boards deletion fails
      }

      // Delete all workspace members
      const { error: membersError } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId);

      if (membersError) {
        console.error('Error deleting workspace members:', membersError);
        // Continue with workspace deletion even if members deletion fails
      }

      // Delete all invitations for this workspace
      const { error: invitationsError } = await supabase
        .from('invitations')
        .delete()
        .eq('workspace_id', workspaceId);

      if (invitationsError) {
        console.error('Error deleting invitations:', invitationsError);
        // Continue with workspace deletion even if invitations deletion fails
      }

      // Finally, delete the workspace
      const { error: deleteError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (deleteError) {
        console.error('Supabase workspace deletion error:', deleteError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete workspace',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return NextResponse.json(
        { success: true, message: 'Workspace deleted successfully' },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    } catch (error) {
      console.error('Delete workspace error:', error);
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
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  });
}
