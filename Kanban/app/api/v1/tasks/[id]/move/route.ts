import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initializeApiClient } from '../../../../../../src/lib/api/init';
import { validateMoveTaskRequest } from '../../../../../../src/lib/api/validation/apiValidation';

// Initialize API client
initializeApiClient();

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
    const validatedData = validateMoveTaskRequest(body);
    
    // First, get the task to check workspace access
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
    
    // Update task column and position
    const { data, error } = await supabase
      .from('tasks')
      .update({
        column_id: validatedData.column_id,
        position: validatedData.position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase task move error:', error);
      return NextResponse.json({ error: 'Failed to move task' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Task move error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
