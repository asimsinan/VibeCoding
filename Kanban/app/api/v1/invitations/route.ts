import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
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
    
    // Get user's pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        status,
        invited_at,
        role,
        invited_by,
        workspaces (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', authData.user.id)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });
    
    if (invitationsError) {
      console.error('Supabase invitations fetch error:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }
    
    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Invitations fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    
    // Parse request body
    const body = await request.json();
    const { invitationId, action } = body; // action: 'accept' or 'decline'
    
    if (!invitationId || !action) {
      return NextResponse.json({ error: 'Invitation ID and action are required' }, { status: 400 });
    }
    
    if (action === 'accept') {
      // Accept invitation
      const { data: invitation, error: updateError } = await supabase
        .from('workspace_members')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('user_id', authData.user.id)
        .eq('status', 'pending')
        .select()
        .single();
      
      if (updateError || !invitation) {
        return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Invitation accepted successfully',
        invitation 
      });
    } else if (action === 'decline') {
      // Decline invitation
      const { error: deleteError } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', invitationId)
        .eq('user_id', authData.user.id)
        .eq('status', 'pending');
      
      if (deleteError) {
        return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Invitation declined' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Invitation update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
