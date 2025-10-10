import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';
import { randomUUID } from 'crypto';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

// POST /api/rooms/[id]/join - Join a room
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const videoConferencingService = serviceFactory.getVideoConferencingService({
      websocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
      maxParticipants: 2,
      enableScreenShare: true,
      enableChat: true,
      enableRecording: false
    });

    // Initialize the video conferencing service
    await videoConferencingService.initialize();

    const roomId = params.id;
    const body = await _request.json();
    const { participantName, mediaPermissions, userId } = body;

    // Validate required fields
    if (!participantName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Participant name is required'
        },
        { status: 400 }
      );
    }

    // Handle userId validation and creation
    let validUserId = userId;
    
    // If userId is 'anonymous' or not provided, create a temporary user
    if (!userId || userId === 'anonymous') {
      const tempUserId = randomUUID();
      const { error } = await (databaseService.getSupabaseClient() as any)
        .from('user')
        .upsert({
          id: tempUserId,
          email: `temp-${tempUserId}@anonymous.local`,
          name: participantName,
          password_hash: 'temp-hash'
        });
      
      if (error) {
        throw new Error(`Failed to create temporary user: ${error.message}`);
      }
      validUserId = tempUserId;
    } else {
      // Verify the user exists using direct Supabase client
      const { data, error } = await (databaseService.getSupabaseClient() as any)
        .from('user')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        // User doesn't exist, create a temporary user
        const tempUserId = randomUUID();
        const { error: tempError } = await (databaseService.getSupabaseClient() as any)
          .from('user')
          .upsert({
            id: tempUserId,
            email: `temp-${tempUserId}@anonymous.local`,
            name: participantName,
            password_hash: 'temp-hash'
          });
        
        if (tempError) {
          throw new Error(`Failed to create temporary user: ${tempError.message}`);
        }
        validUserId = tempUserId;
      }
    }

    // Check room capacity directly from database - only count connected participants
    const { count, error: countError } = await (databaseService.getSupabaseClient() as any)
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_connected', true);
    
    if (countError) {
      throw new Error(`Failed to count participants: ${countError.message}`);
    }
    const participantCount = count || 0;
    
    
    if (participantCount >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room is full',
          message: 'This room has reached its maximum capacity of 10 participants'
        },
        { status: 400 }
      );
    }

    // Check for existing participant with same user_id in this room (using raw query)
    const roomService = serviceFactory.getRoomService();
    
    
    // Find existing participant by user_id using direct Supabase client
    const { data: existingData, error: existingError } = await (databaseService.getSupabaseClient() as any)
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', validUserId)
      .eq('is_connected', true)
      .limit(1)
      .single();
    
    const existingParticipant = existingError ? null : existingData;
    
    if (existingParticipant) {
    } else {
    }

    // Clean up any disconnected participants for this user in this room
    await (databaseService.getSupabaseClient() as any)
      .from('participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', validUserId)
      .eq('is_connected', false);

    let participant;
    if (existingParticipant) {
      
      // CRITICAL: Delete the old participant completely instead of just marking as disconnected
      await (databaseService.getSupabaseClient() as any)
        .from('participants')
        .delete()
        .eq('id', existingParticipant.id);
      
      // Now create a NEW participant (don't reuse the old ID!)
      const { data: createData, error: createError } = await (databaseService.getSupabaseClient() as any)
        .from('participants')
        .insert({
          room_id: roomId,
          user_id: validUserId,
          name: participantName,
          media_permissions: JSON.stringify(mediaPermissions || { camera: true, microphone: true, screen_share: false }),
          is_connected: true,
          connection_state: 'connected'
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create participant: ${createError.message}`);
      }
      participant = createData;
    } else {
      // Create new participant with user_id
      const { data: createData, error: createError } = await (databaseService.getSupabaseClient() as any)
        .from('participants')
        .insert({
          room_id: roomId,
          user_id: validUserId,
          name: participantName,
          media_permissions: JSON.stringify(mediaPermissions || {
            camera: true,
            microphone: true,
            screen_share: false
          }),
          is_connected: true,
          connection_state: 'connected'
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create participant: ${createError.message}`);
      }
      participant = createData;
    }

    // Update participant's last_seen timestamp to keep them alive
    await (databaseService.getSupabaseClient() as any)
      .from('participants')
      .update({
        last_seen: new Date().toISOString(),
        is_connected: true,
        connection_state: 'connected'
      })
      .eq('id', participant.id);

    // Get room and participants
    const room = await roomService.getRoom(roomId);
    const participants = await roomService.getRoomParticipants(roomId);

    return NextResponse.json({
      success: true,
      data: {
        room: room,
        participant: participant,
        participants: participants
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Room not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Room not found',
            message: 'The requested room does not exist'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Room is full')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Room full',
            message: 'The room has reached its maximum capacity'
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
