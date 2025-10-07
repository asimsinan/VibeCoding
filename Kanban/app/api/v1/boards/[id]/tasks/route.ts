/**
 * Tasks API Routes - List and create tasks within a board
 * FR-001: API-First Design - Tasks API implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiService } from '../../../../../../src/lib/api/services/apiService';
import { getApiMiddleware } from '../../../../../../src/lib/api/middleware/apiMiddleware';
import { createValidationMiddleware } from '../../../../../../src/lib/api/middleware/apiMiddleware';
import { validateCreateTaskRequest } from '../../../../../../src/lib/api/validation/apiValidation';
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
      const { id: boardId } = await params;

      // Get tasks from Supabase
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

      // Verify user has access to board (workspace owner OR member)
      const { data: ownedBoard, error: ownedError } = await supabase
        .from('boards')
        .select(`
          id, 
          workspace_id,
          workspaces!inner(created_by)
        `)
        .eq('id', boardId)
        .eq('workspaces.created_by', authData.user.id)
        .single();

      const { data: memberBoard, error: memberError } = await supabase
        .from('boards')
        .select(`
          id, 
          workspace_id,
          workspaces!inner(id)
        `)
        .eq('id', boardId)
        .single();

      // Check if user is a member of the workspace
      let isMember = false;
      if (memberBoard && !memberError) {
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', memberBoard.workspace_id)
          .eq('user_id', authData.user.id)
          .eq('status', 'accepted')
          .single();
        
        isMember = !membershipError && !!membership;
      }

      if ((ownedError && memberError) || (!ownedBoard && !memberBoard) || (!ownedBoard && !isMember)) {
        return NextResponse.json({
          error: {
            code: 'NOT_FOUND',
            message: 'Board not found or access denied',
          },
        }, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get tasks for the board with columns
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          columns!inner(id, title, position)
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (tasksError) {
        console.error('Supabase tasks fetch error:', tasksError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch tasks',
          },
        }, {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get columns for the board
      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (columnsError) {
        console.error('Supabase columns fetch error:', columnsError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch columns',
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
          tasks: tasks || [],
          columns: columns || [],
        },
        meta: {
          total: tasks?.length || 0,
          limit: 100,
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
      console.error('Get tasks error:', error);
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
      const { id: boardId } = await params;

      // Validate request body
      const validationMiddleware = createValidationMiddleware(validateCreateTaskRequest);
      const taskData = await validationMiddleware(req);

      // Create task in Supabase
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

      // Verify user has access to board (workspace owner OR member)
      const { data: ownedBoard, error: ownedError } = await supabase
        .from('boards')
        .select(`
          id, 
          workspace_id,
          workspaces!inner(created_by)
        `)
        .eq('id', boardId)
        .eq('workspaces.created_by', authData.user.id)
        .single();

      const { data: memberBoard, error: memberError } = await supabase
        .from('boards')
        .select(`
          id, 
          workspace_id,
          workspaces!inner(id)
        `)
        .eq('id', boardId)
        .single();

      // Check if user is a member of the workspace
      let isMember = false;
      if (memberBoard && !memberError) {
        const { data: membership, error: membershipError } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', memberBoard.workspace_id)
          .eq('user_id', authData.user.id)
          .eq('status', 'accepted')
          .single();
        
        isMember = !membershipError && !!membership;
      }

      if ((ownedError && memberError) || (!ownedBoard && !memberBoard) || (!ownedBoard && !isMember)) {
        return NextResponse.json({
          error: {
            code: 'NOT_FOUND',
            message: 'Board not found or access denied',
          },
        }, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get the first column (To Do) for the new task
      const { data: firstColumn, error: columnError } = await supabase
        .from('columns')
        .select('id')
        .eq('board_id', boardId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (columnError || !firstColumn) {
        return NextResponse.json({
          error: {
            code: 'NOT_FOUND',
            message: 'No columns found for this board',
          },
        }, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Get the next position for the task
      const { data: lastTask, error: positionError } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', firstColumn.id)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = lastTask ? lastTask.position + 1 : 0;

      // Create the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          board_id: boardId,
          column_id: firstColumn.id,
          position: nextPosition,
          status: 'todo',
          priority: taskData.priority || 'medium',
          assignee_id: taskData.assignee_id || null,
          due_date: taskData.due_date || null,
          created_by: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (taskError) {
        console.error('Supabase task creation error:', taskError);
        return NextResponse.json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create task',
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
          id: task.id,
          title: task.title,
          description: task.description,
          board_id: task.board_id,
          column_id: task.column_id,
          position: task.position,
          status: task.status,
          priority: task.priority,
          assignee_id: task.assignee_id,
          due_date: task.due_date,
          created_by: task.created_by,
          created_at: task.created_at,
          updated_at: task.updated_at,
        },
      }, {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Create task error:', error);
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
