import { ChatService } from '../../lib/video-conferencing/services/chat.service';
import { RoomModel, ParticipantModel } from '../../lib/video-conferencing/models';
import { DatabaseService } from '../../lib/video-conferencing/services/database.service';

// Mock DatabaseService
jest.mock('../../lib/video-conferencing/services/database.service');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    chatService = new ChatService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';
      const content = 'Hello, world!';

      const mockMessage = {
        id: 'message-id',
        roomId,
        participantId,
        content,
        timestamp: new Date().toISOString()
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockMessage],
        rowCount: 1
      });

      const result = await chatService.sendMessage(roomId, participantId, content);

      expect(result).toBeDefined();
      expect(result.content).toBe(content);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        expect.arrayContaining([roomId, participantId, content])
      );
    });

    it('should throw error if content is empty', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';
      const content = '';

      await expect(chatService.sendMessage(roomId, participantId, content))
        .rejects.toThrow('Message content is required');
    });

    it('should throw error if content is too long', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';
      const content = 'a'.repeat(1001); // Exceeds 1000 character limit

      await expect(chatService.sendMessage(roomId, participantId, content))
        .rejects.toThrow('Message content cannot exceed 1000 characters');
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      const participantId = 'test-participant-id';
      const content = 'Hello, world!';

      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(chatService.sendMessage(roomId, participantId, content))
        .rejects.toThrow('Failed to send message: Database error');
    });
  });

  describe('getMessages', () => {
    it('should get messages successfully', async () => {
      const roomId = 'test-room-id';
      const limit = 50;
      const offset = 0;

      const mockMessages = [
        {
          id: 'message-1',
          roomId,
          participantId: 'participant-1',
          content: 'Hello world',
          timestamp: new Date().toISOString(),
          participant_name: 'User 1'
        },
        {
          id: 'message-2',
          roomId,
          participantId: 'participant-2',
          content: 'Hi there',
          timestamp: new Date().toISOString(),
          participant_name: 'User 2'
        }
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockMessages,
        rowCount: 2
      });

      const result = await chatService.getMessages(roomId, limit, offset);

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello world');
      expect(result[1].content).toBe('Hi there');
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT m.*, p.name as participant_name'),
        [roomId, limit, offset]
      );
    });

    it('should return empty array if no messages', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await chatService.getMessages(roomId);

      expect(result).toHaveLength(0);
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(chatService.getMessages(roomId))
        .rejects.toThrow('Failed to get messages: Database error');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      const messageId = 'test-message-id';
      const participantId = 'test-participant-id';

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      await expect(chatService.deleteMessage(messageId, participantId)).resolves.toBeUndefined();

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM messages'),
        [messageId, participantId]
      );
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message';
      const participantId = 'test-participant-id';

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(chatService.deleteMessage(messageId, participantId))
        .rejects.toThrow('Message not found or access denied');
    });

    it('should throw error if database query fails', async () => {
      const messageId = 'test-message-id';
      const participantId = 'test-participant-id';

      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(chatService.deleteMessage(messageId, participantId))
        .rejects.toThrow('Failed to delete message: Database error');
    });
  });

  describe('editMessage', () => {
    it('should edit message successfully', async () => {
      const messageId = 'test-message-id';
      const participantId = 'test-participant-id';
      const newContent = 'Edited message';

      const mockUpdatedMessage = {
        id: messageId,
        content: newContent,
        edited: true,
        edited_at: new Date().toISOString()
      };

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [mockUpdatedMessage],
        rowCount: 1
      });

      const result = await chatService.editMessage(messageId, participantId, newContent);

      expect(result).toBeDefined();
      expect(result.content).toBe(newContent);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages SET'),
        [newContent, messageId, participantId]
      );
    });

    it('should throw error if new content is empty', async () => {
      const messageId = 'test-message-id';
      const participantId = 'test-participant-id';
      const newContent = '';

      await expect(chatService.editMessage(messageId, participantId, newContent))
        .rejects.toThrow('Message content is required');
    });

    it('should throw error if new content is too long', async () => {
      const messageId = 'test-message-id';
      const participantId = 'test-participant-id';
      const newContent = 'a'.repeat(1001);

      await expect(chatService.editMessage(messageId, participantId, newContent))
        .rejects.toThrow('Message content cannot exceed 1000 characters');
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message';
      const participantId = 'test-participant-id';
      const newContent = 'Edited message';

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      await expect(chatService.editMessage(messageId, participantId, newContent))
        .rejects.toThrow('Message not found or access denied');
    });
  });

  describe('getMessageCount', () => {
    it('should get message count successfully', async () => {
      const roomId = 'test-room-id';
      const expectedCount = 25;

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [{ count: expectedCount }],
        rowCount: 1
      });

      const result = await chatService.getMessageCount(roomId);

      expect(result).toBe(expectedCount);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        [roomId]
      );
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(chatService.getMessageCount(roomId))
        .rejects.toThrow('Failed to get message count: Database error');
    });
  });

  describe('searchMessages', () => {
    it('should search messages successfully', async () => {
      const roomId = 'test-room-id';
      const query = 'hello';
      const limit = 20;
      const offset = 0;

      const mockMessages = [
        {
          id: 'message-1',
          roomId,
          participantId: 'participant-1',
          content: 'Hello world',
          timestamp: new Date().toISOString(),
          participant_name: 'User 1'
        }
      ];

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: mockMessages,
        rowCount: 1
      });

      const result = await chatService.searchMessages(roomId, query, limit, offset);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Hello world');
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.room_id = $1 AND m.content ILIKE $2'),
        [roomId, `%${query}%`, limit, offset]
      );
    });

    it('should return empty array if no matches', async () => {
      const roomId = 'test-room-id';
      const query = 'nonexistent';

      mockDatabaseService.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const result = await chatService.searchMessages(roomId, query);

      expect(result).toHaveLength(0);
    });

    it('should throw error if search query is empty', async () => {
      const roomId = 'test-room-id';
      const query = '';

      await expect(chatService.searchMessages(roomId, query))
        .rejects.toThrow('Search query cannot be empty');
    });

    it('should throw error if database query fails', async () => {
      const roomId = 'test-room-id';
      const query = 'hello';

      mockDatabaseService.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(chatService.searchMessages(roomId, query))
        .rejects.toThrow('Failed to search messages: Database error');
    });
  });

  describe('validateMessageContent', () => {
    it('should validate message content successfully', () => {
      const validContent = 'This is a valid message';
      expect(() => chatService.validateMessageContent(validContent)).not.toThrow();
    });

    it('should throw error for empty content', () => {
      expect(() => chatService.validateMessageContent(''))
        .toThrow('Message content is required');
    });

    it('should throw error for content that is only whitespace', () => {
      expect(() => chatService.validateMessageContent('   '))
        .toThrow('Message content cannot be empty');
    });

    it('should throw error for content that is too long', () => {
      const longContent = 'a'.repeat(1001);
      expect(() => chatService.validateMessageContent(longContent))
        .toThrow('Message content cannot exceed 1000 characters');
    });

    it('should throw error for content with invalid characters', () => {
      const invalidContent = 'Message with \x00 null character';
      expect(() => chatService.validateMessageContent(invalidContent))
        .toThrow('Message content contains invalid characters');
    });
  });

  describe('sanitizeMessageContent', () => {
    it('should sanitize message content', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = chatService.sanitizeMessageContent(input);
      expect(result).toBe('Hello alert("xss") world');
    });

    it('should preserve valid content', () => {
      const input = 'Hello, world! This is a normal message.';
      const result = chatService.sanitizeMessageContent(input);
      expect(result).toBe(input);
    });

    it('should handle empty content', () => {
      const result = chatService.sanitizeMessageContent('');
      expect(result).toBe('');
    });
  });
});
