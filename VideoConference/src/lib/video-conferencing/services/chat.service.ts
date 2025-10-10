import { DatabaseService } from './database.service';

export interface ChatMessage {
  id: string;
  roomId: string;
  participantId: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
  participant_name?: string;
}

export interface MessageSearchResult extends ChatMessage {
  participant_name: string;
}

export class ChatService {
  private readonly MAX_MESSAGE_LENGTH = 1000;
  private readonly MAX_SEARCH_LENGTH = 100;

  constructor(private databaseService: DatabaseService) {}

  /**
   * Send a message to a room
   */
  async sendMessage(roomId: string, participantId: string, content: string): Promise<ChatMessage> {
    this.validateMessageContent(content);

    const sanitizedContent = this.sanitizeMessageContent(content);

    try {
      // First get the participant name using direct Supabase client
      const { data: participantData, error: participantError } = await (this.databaseService.getSupabaseClient() as any)
        .from('participants')
        .select('name')
        .eq('id', participantId)
        .single();
      
      if (participantError || !participantData) {
        throw new Error('Participant not found');
      }

      // Use direct Supabase client for message insertion
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .insert({
          room_id: roomId,
          participant_id: participantId,
          content: sanitizedContent,
          message_type: 'text',
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Supabase message insert error:', error);
        throw new Error(`Failed to insert message: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to send message');
      }

      return data[0] as unknown as ChatMessage;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get messages for a room
   */
  async getMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select(`
          *,
          participants!inner(name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, participantId: string): Promise<void> {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid message ID');
    }

    if (!participantId || typeof participantId !== 'string') {
      throw new Error('Invalid participant ID');
    }

    try {
      const { error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('participant_id', participantId);

      if (error) {
        throw new Error('Message not found or access denied');
      }
    } catch (error) {
      throw new Error(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, participantId: string, newContent: string): Promise<ChatMessage> {
    this.validateMessageContent(newContent);

    const sanitizedContent = this.sanitizeMessageContent(newContent);

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .update({
          content: sanitizedContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('participant_id', participantId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Message not found or access denied');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to edit message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get message count for a room
   */
  async getMessageCount(roomId: string): Promise<number> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    try {
      const { count, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to get message count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search messages in a room
   */
  async searchMessages(
    roomId: string, 
    query: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<MessageSearchResult[]> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (query.length > this.MAX_SEARCH_LENGTH) {
      throw new Error(`Search query cannot exceed ${this.MAX_SEARCH_LENGTH} characters`);
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select(`
          *,
          participants!inner(name)
        `)
        .eq('room_id', roomId)
        .ilike('content', `%${query.trim()}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get recent messages for a room
   */
  async getRecentMessages(roomId: string, hours: number = 24): Promise<ChatMessage[]> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    if (hours < 1 || hours > 168) { // Max 1 week
      throw new Error('Hours must be between 1 and 168');
    }

    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select(`
          *,
          participants!inner(name)
        `)
        .eq('room_id', roomId)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get recent messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId: string): Promise<ChatMessage | null> {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Invalid message ID');
    }

    try {
      const { data, error } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select(`
          *,
          participants!inner(name)
        `)
        .eq('id', messageId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate message content
   */
  validateMessageContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content is required');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (trimmedContent.length > this.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message content cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`);
    }

    // Check for invalid characters (null bytes, control characters except newline and tab)
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(content)) {
      throw new Error('Message content contains invalid characters');
    }
  }

  /**
   * Sanitize message content
   */
  sanitizeMessageContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Remove HTML tags
    let sanitized = content.replace(/<[^>]*>/g, '');

    // Remove null bytes and control characters (except newline and tab)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Check if message is editable (within time limit)
   */
  isMessageEditable(message: ChatMessage, timeLimitMinutes: number = 15): boolean {
    if (!message || !message.timestamp) {
      return false;
    }

    const messageTime = new Date(message.timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - messageTime.getTime();
    const timeDiffMinutes = timeDiff / (1000 * 60);

    return timeDiffMinutes <= timeLimitMinutes;
  }

  /**
   * Get message statistics for a room
   */
  async getMessageStatistics(roomId: string): Promise<{
    totalMessages: number;
    messagesToday: number;
    messagesThisWeek: number;
    averageMessagesPerHour: number;
  }> {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Invalid room ID');
    }

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Get total messages
      const { count: totalCount, error: totalError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (totalError) {
        throw totalError;
      }

      // Get messages today
      const { count: todayCount, error: todayError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .gte('created_at', today);

      if (todayError) {
        throw todayError;
      }

      // Get messages this week
      const { count: weekCount, error: weekError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .gte('created_at', weekAgo);

      if (weekError) {
        throw weekError;
      }

      // Get messages last 24 hours
      const { count: last24hCount, error: last24hError } = await (this.databaseService.getSupabaseClient() as any)
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .gte('created_at', dayAgo);

      if (last24hError) {
        throw last24hError;
      }

      const total = totalCount || 0;
      const todayMsgs = todayCount || 0;
      const thisWeek = weekCount || 0;
      const last24h = last24hCount || 0;

      return {
        totalMessages: total,
        messagesToday: todayMsgs,
        messagesThisWeek: thisWeek,
        averageMessagesPerHour: last24h / 24
      };
    } catch (error) {
      throw new Error(`Failed to get message statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
