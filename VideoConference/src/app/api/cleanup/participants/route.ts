import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

/**
 * Automated cleanup endpoint for stale participants
 * This should be called periodically (e.g., every 30-60 seconds) by:
 * - A cron job (using services like Vercel Cron, AWS EventBridge, etc.)
 * - A client-side interval (less reliable)
 * - A separate background worker
 */
export async function POST(_request: NextRequest) {
  try {
    await serviceFactory.initialize();
    
    // Update last_seen for all connected participants (heartbeat)
    // This would be called by active clients to keep themselves alive
    const participantId = _request.headers.get('X-Participant-Id');
    if (participantId) {
      const participantRepo = serviceFactory.getRepositoryFactory().getParticipantRepository();
      
      // Update last_seen and ensure participant is marked as connected
      await participantRepo.updateLastSeen(participantId);
      
      // If participant was marked as disconnected, mark them as connected again
      const supabase = databaseService.getSupabaseClient();
      await (supabase as any)
        .from('participants')
        .update({ 
          is_connected: true, 
          connection_state: 'connected' 
        })
        .eq('id', participantId)
        .eq('is_connected', false);
    }
    
    // Use direct cleanup method instead of complex SQL parsing
    const cleanupResult = await databaseService.cleanupStaleParticipantsDirect();
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      staleParticipantsMarked: cleanupResult.staleMarked,
      staleParticipantsDeleted: cleanupResult.staleDeleted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in automated cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check cleanup status
 */
export async function GET(_request: NextRequest) {
  try {
    await serviceFactory.initialize();
    
    // Get stats about participants using direct Supabase client
    const supabase = databaseService.getSupabaseClient();
    
    // Get connected participants count
    const { count: connectedCount } = await (supabase as any)
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('is_connected', true);
    
    // Get disconnected participants count
    const { count: disconnectedCount } = await (supabase as any)
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('is_connected', false);
    
    // Get stale participants count (disconnected for more than 30 seconds)
    const staleThreshold = new Date(Date.now() - 30 * 1000).toISOString();
    const { count: staleCount } = await (supabase as any)
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('is_connected', false)
      .lt('last_seen', staleThreshold);
    
    return NextResponse.json({
      success: true,
      stats: {
        connectedParticipants: connectedCount || 0,
        disconnectedParticipants: disconnectedCount || 0,
        staleParticipants: staleCount || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
