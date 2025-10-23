import request from 'supertest';
import app from '../../../src/app';
import { CommentService } from '../../../src/lib/services/comment';

// Mock services
jest.mock('../../../src/lib/services/comment');

describe('CommentController', () => {
  let mockCommentService: jest.Mocked<CommentService>;

  beforeEach(() => {
    mockCommentService = new CommentService({} as any, {} as any, {} as any) as jest.Mocked<CommentService>;
    (CommentService as jest.MockedClass<typeof CommentService>).mockImplementation(() => mockCommentService);
  });

  describe('POST /api/v1/campaigns/:id/comments', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        content: 'Great campaign! I love this project.',
        parentId: null
      };

      mockCommentService.createComment.mockResolvedValue({
        success: true,
        comment: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          content: commentData.content,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: 'user-456',
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .set('Authorization', 'Bearer user-token')
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.content).toBe(commentData.content);
    });

    it('should create reply successfully', async () => {
      const replyData = {
        content: 'Thanks for the feedback!',
        parentId: 'comment-111'
      };

      mockCommentService.createReply.mockResolvedValue({
        success: true,
        comment: {
          id: 'comment-222',
          content: replyData.content,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: 'user-456',
          parentId: 'comment-111',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .set('Authorization', 'Bearer user-token')
        .send(replyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.parentId).toBe(replyData.parentId);
    });

    it('should return 400 for invalid comment data', async () => {
      const invalidData = {
        content: '', // Invalid empty content
        parentId: null
      };

      mockCommentService.createComment.mockResolvedValue({
        success: false,
        error: 'Invalid comment content'
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .set('Authorization', 'Bearer user-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const commentData = {
        content: 'Great campaign!',
        parentId: null
      };

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .send(commentData);

      expect(response.status).toBe(401);
    });

    it('should return 404 for 550e8400-e29b-41d4-a716-446655440999 campaign', async () => {
      const commentData = {
        content: 'Great campaign!',
        parentId: null
      };

      mockCommentService.createComment.mockResolvedValue({
        success: false,
        error: 'Campaign not found'
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999/comments')
        .set('Authorization', 'Bearer user-token')
        .send(commentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/campaigns/:id/comments', () => {
    it('should get campaign comments', async () => {
      const comments = [
        {
          id: 'comment-1',
          content: 'Great campaign!',
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: 'user-1',
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          replies: [
            {
              id: 'comment-2',
              content: 'I agree!',
              campaignId: '550e8400-e29b-41d4-a716-446655440000',
              authorId: 'user-2',
              parentId: 'comment-1',
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              replies: []
            }
          ]
        }
      ];

      mockCommentService.getCampaignComments.mockResolvedValue({
        success: true,
        comments,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].replies).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/comments')
        .query({ page: 0, limit: 0 });

      expect(response.status).toBe(400);
    });

    it('should return 404 for 550e8400-e29b-41d4-a716-446655440999 campaign', async () => {
      mockCommentService.getCampaignComments.mockResolvedValue({
        success: false,
        error: 'Campaign not found'
      });

      const response = await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999/comments');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/comments/:id', () => {
    it('should update comment successfully', async () => {
      const updateData = {
        content: 'Updated comment content'
      };

      mockCommentService.updateComment.mockResolvedValue({
        success: true,
        comment: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          content: updateData.content,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: 'user-456',
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .put('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toBe(updateData.content);
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        content: '' // Invalid empty content
      };

      mockCommentService.updateComment.mockResolvedValue({
        success: false,
        error: 'Invalid comment content'
      });

      const response = await request(app)
        .put('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', 'Bearer user-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized update', async () => {
      const updateData = {
        content: 'Updated comment content'
      };

      mockCommentService.updateComment.mockResolvedValue({
        success: false,
        error: 'Unauthorized to edit this comment'
      });

      const response = await request(app)
        .put('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized request', async () => {
      const updateData = {
        content: 'Updated comment content'
      };

      const response = await request(app)
        .put('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should delete comment successfully', async () => {
      mockCommentService.deleteComment.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .delete('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for unauthorized deletion', async () => {
      mockCommentService.deleteComment.mockResolvedValue({
        success: false,
        error: 'Unauthorized to delete this comment'
      });

      const response = await request(app)
        .delete('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .delete('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/comments/:id/moderate', () => {
    it('should moderate comment successfully', async () => {
      const moderationData = {
        action: 'APPROVE',
        reason: 'Content is appropriate'
      };

      mockCommentService.moderateComment.mockResolvedValue({
        success: true,
        comment: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          content: 'Comment to moderate',
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          authorId: 'user-456',
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001/moderate')
        .set('Authorization', 'Bearer admin-token')
        .send(moderationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();
    });

    it('should return 400 for invalid moderation data', async () => {
      const invalidData = {
        action: 'INVALID',
        reason: 'Invalid reason'
      };

      const response = await request(app)
        .post('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001/moderate')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should return 403 for non-admin user', async () => {
      const moderationData = {
        action: 'APPROVE',
        reason: 'Content is appropriate'
      };

      const response = await request(app)
        .post('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001/moderate')
        .set('Authorization', 'Bearer user-token')
        .send(moderationData);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthorized request', async () => {
      const moderationData = {
        action: 'APPROVE',
        reason: 'Content is appropriate'
      };

      const response = await request(app)
        .post('/api/v1/comments/550e8400-e29b-41d4-a716-446655440001/moderate')
        .send(moderationData);

      expect(response.status).toBe(401);
    });
  });
});
