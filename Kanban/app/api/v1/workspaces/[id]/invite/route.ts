import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    
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
    
    // Verify user is workspace owner (only owners can invite)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, created_by')
      .eq('id', workspaceId)
      .eq('created_by', authData.user.id)
      .single();
    
    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();
    
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }
    
    // Add user to workspace with pending status
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'member',
        status: 'pending',
        invited_at: new Date().toISOString(),
        invited_by: authData.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (memberError) {
      console.error('Supabase member creation error:', memberError);
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'User invited successfully',
      member: {
        id: member.id,
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('Workspace invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
