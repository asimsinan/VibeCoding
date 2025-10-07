import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeApiClient } from '../../../../../src/lib/api/init';
import { getApiMiddleware } from '../../../../../src/lib/api/middleware/apiMiddleware';
import { validateUpdateTaskRequest } from '../../../../../src/lib/api/validation/apiValidation';

// Initialize API client
initializeApiClient();

const apiMiddleware = getApiMiddleware();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    
    // Get user token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Create Supabase client for user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Verify user token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateUpdateTaskRequest(body);
    
    // First, get the task to check board access
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, board_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access to board (workspace owner OR member)
    const { data: ownedBoard, error: ownedError } = await supabase
      .from('boards')
      .select(`
        id, 
        workspace_id,
        workspaces!inner(created_by)
      `)
      .eq('id', task.board_id)
      .eq('workspaces.created_by', authData.user.id)
      .single();

    const { data: memberBoard, error: memberError } = await supabase
      .from('boards')
      .select(`
        id, 
        workspace_id,
        workspaces!inner(id)
      `)
      .eq('id', task.board_id)
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

    const isOwner = !ownedError && !!ownedBoard;

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Update task in database
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        assignee_id: validatedData.assignee_id,
        due_date: validatedData.due_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase task update error:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    
    // Get user token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Create Supabase client for user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Verify user token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // First, get the task to check board access
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, board_id')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Verify user has access to board (workspace owner OR member)
    const { data: ownedBoard, error: ownedError } = await supabase
      .from('boards')
      .select(`
        id, 
        workspace_id,
        workspaces!inner(created_by)
      `)
      .eq('id', task.board_id)
      .eq('workspaces.created_by', authData.user.id)
      .single();

    const { data: memberBoard, error: memberError } = await supabase
      .from('boards')
      .select(`
        id, 
        workspace_id,
        workspaces!inner(id)
      `)
      .eq('id', task.board_id)
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

    const isOwner = !ownedError && !!ownedBoard;
    
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Delete task from database
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Supabase task delete error:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Task delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
