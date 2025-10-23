import { CommentService } from '../../../src/lib/services/comment';
import { CommentCore } from '../../../src/lib/core/comment';
import { CommentRepository } from '../../../src/repositories/CommentRepository';
import { CampaignRepository } from '../../../src/repositories/CampaignRepository';

// Mock dependencies
jest.mock('../../../src/lib/core/comment');
jest.mock('../../../src/repositories/CommentRepository');
jest.mock('../../../src/repositories/CampaignRepository');

describe('CommentService', () => {
  let commentService: CommentService;
  let mockCommentCore: jest.Mocked<CommentCore>;
  let mockCommentRepository: jest.Mocked<CommentRepository>;
  let mockCampaignRepository: jest.Mocked<CampaignRepository>;

  beforeEach(() => {
    mockCommentCore = new CommentCore() as jest.Mocked<CommentCore>;
    mockCommentRepository = new CommentRepository({} as any) as jest.Mocked<CommentRepository>;
    mockCampaignRepository = new CampaignRepository({} as any) as jest.Mocked<CampaignRepository>;
    commentService = new CommentService(mockCommentCore, mockCommentRepository, mockCampaignRepository);
  });

  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const commentData = {
        content: 'Great campaign! I love this project.',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: null
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentCore.validateCommentContent.mockReturnValue(true);
      mockCommentCore.moderateComment.mockReturnValue({
        isApproved: true,
        reason: 'Content approved'
      });
      mockCommentCore.generateCommentNotification.mockReturnValue({
        type: 'NEW_COMMENT',
        commentId: 'comment-123',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentCommentId: null,
        message: 'Someone commented on the campaign',
        timestamp: new Date()
      });

      mockCommentRepository.create.mockResolvedValue({
        id: 'comment-123',
        content: commentData.content,
        campaignId: commentData.campaignId,
        authorId: commentData.authorId,
        parentId: commentData.parentId,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await commentService.createComment(commentData);

      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
      expect(mockCampaignRepository.findById).toHaveBeenCalledWith('campaign-123');
      expect(mockCommentCore.validateCommentContent).toHaveBeenCalledWith(commentData.content);
      expect(mockCommentCore.moderateComment).toHaveBeenCalledWith(commentData.content);
    });

    it('should fail for non-existent campaign', async () => {
      const commentData = {
        content: 'Great campaign!',
        campaignId: 'non-existent',
        authorId: 'user-456'
      };

      mockCampaignRepository.findById.mockResolvedValue(null);

      const result = await commentService.createComment(commentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
    });

    it('should fail for invalid content', async () => {
      const commentData = {
        content: '', // Empty content
        campaignId: 'campaign-123',
        authorId: 'user-456'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentCore.validateCommentContent.mockReturnValue(false);

      const result = await commentService.createComment(commentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid comment content');
    });

    it('should fail for inappropriate content', async () => {
      const commentData = {
        content: 'This comment contains inappropriate content',
        campaignId: 'campaign-123',
        authorId: 'user-456'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentCore.validateCommentContent.mockReturnValue(true);
      mockCommentCore.moderateComment.mockReturnValue({
        isApproved: false,
        reason: 'Inappropriate content detected'
      });

      const result = await commentService.createComment(commentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment rejected: Inappropriate content detected');
    });
  });

  describe('createReply', () => {
    it('should create reply successfully', async () => {
      const replyData = {
        content: 'Thanks for the feedback!',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: 'comment-111'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      const parentComment = {
        id: 'comment-111',
        content: 'Original comment',
        campaignId: 'campaign-123',
        authorId: 'user-789',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentRepository.findById.mockResolvedValue(parentComment);
      mockCommentRepository.findByCampaign.mockResolvedValue({
        comments: [parentComment],
        page: 1,
        limit: 20,
        total: 1
      });
      mockCommentCore.validateCommentContent.mockReturnValue(true);
      mockCommentCore.moderateComment.mockReturnValue({
        isApproved: true,
        reason: 'Content approved'
      });
      mockCommentCore.calculateCommentDepth.mockReturnValue(1);

      mockCommentRepository.create.mockResolvedValue({
        id: 'comment-222',
        content: replyData.content,
        campaignId: replyData.campaignId,
        authorId: replyData.authorId,
        parentId: replyData.parentId,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await commentService.createReply(replyData);

      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
      expect(mockCommentRepository.findById).toHaveBeenCalledWith('comment-111');
      expect(mockCommentCore.calculateCommentDepth).toHaveBeenCalled();
    });

    it('should fail for non-existent parent comment', async () => {
      const replyData = {
        content: 'Thanks for the feedback!',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: 'non-existent'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await commentService.createReply(replyData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Parent comment not found');
    });

    it('should fail for maximum depth exceeded', async () => {
      const replyData = {
        content: 'Deep reply',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: 'comment-111'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      const parentComment = {
        id: 'comment-111',
        content: 'Original comment',
        campaignId: 'campaign-123',
        authorId: 'user-789',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentRepository.findById.mockResolvedValue(parentComment);
      mockCommentRepository.findByCampaign.mockResolvedValue({
        comments: [parentComment],
        page: 1,
        limit: 20,
        total: 1
      });
      mockCommentCore.validateCommentContent.mockReturnValue(true);
      mockCommentCore.calculateCommentDepth.mockReturnValue(5); // Max depth exceeded

      const result = await commentService.createReply(replyData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum comment depth exceeded');
    });
  });

  describe('getCampaignComments', () => {
    it('should get comments for campaign', async () => {
      const campaignId = 'campaign-123';
      const comments = [
        {
          id: 'comment-1',
          content: 'Great campaign!',
          campaignId,
          authorId: 'user-1',
          parentId: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'comment-2',
          content: 'I agree!',
          campaignId,
          authorId: 'user-2',
          parentId: 'comment-1',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const campaign = {
        id: campaignId,
        title: 'Test Campaign',
        status: 'ACTIVE',
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCommentRepository.findByCampaign.mockResolvedValue({
        comments,
        total: 2,
        page: 1,
        limit: 20
      });

      mockCommentCore.buildCommentTree.mockReturnValue([
        {
          id: 'comment-1',
          content: 'Great campaign!',
          replies: [
            {
              id: 'comment-2',
              content: 'I agree!',
              replies: []
            }
          ]
        }
      ]);

      const result = await commentService.getCampaignComments(campaignId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.comments).toBeDefined();
      expect(result.pagination.total).toBe(2);
      expect(mockCommentRepository.findByCampaign).toHaveBeenCalledWith(campaignId, 1, 20);
      expect(mockCommentCore.buildCommentTree).toHaveBeenCalledWith(comments);
    });
  });

  describe('updateComment', () => {
    it('should update comment successfully', async () => {
      const commentId = 'comment-123';
      const updateData = {
        content: 'Updated comment content'
      };

      const comment = {
        id: commentId,
        content: 'Original comment',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCommentRepository.findById.mockResolvedValue(comment);
      mockCommentCore.validateCommentContent.mockReturnValue(true);
      mockCommentCore.moderateComment.mockReturnValue({
        isApproved: true,
        reason: 'Content approved'
      });
      mockCommentCore.validateCommentPermissions.mockReturnValue(true);

      mockCommentRepository.update.mockResolvedValue({
        ...comment,
        content: updateData.content
      });

      const result = await commentService.updateComment(commentId, updateData, 'user-456');

      expect(result.success).toBe(true);
      expect(result.comment.content).toBe(updateData.content);
      expect(mockCommentCore.validateCommentPermissions).toHaveBeenCalledWith(comment, { id: 'user-456', role: 'USER' }, 'EDIT');
    });

    it('should fail for non-existent comment', async () => {
      const commentId = 'non-existent';
      const updateData = {
        content: 'Updated comment content'
      };

      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await commentService.updateComment(commentId, updateData, 'user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment not found');
    });

    it('should fail for unauthorized user', async () => {
      const commentId = 'comment-123';
      const updateData = {
        content: 'Updated comment content'
      };

      const comment = {
        id: commentId,
        content: 'Original comment',
        campaignId: 'campaign-123',
        authorId: 'user-789', // Different author
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCommentRepository.findById.mockResolvedValue(comment);
      mockCommentCore.validateCommentPermissions.mockReturnValue(false);

      const result = await commentService.updateComment(commentId, updateData, 'user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized to edit this comment');
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const commentId = 'comment-123';
      const comment = {
        id: commentId,
        content: 'Comment to delete',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCommentRepository.findById.mockResolvedValue(comment);
      mockCommentCore.validateCommentPermissions.mockReturnValue(true);
      mockCommentRepository.delete.mockResolvedValue(undefined);

      const result = await commentService.deleteComment(commentId, 'user-456');

      expect(result.success).toBe(true);
      expect(mockCommentRepository.delete).toHaveBeenCalledWith(commentId, 'user-456');
    });

    it('should fail for non-existent comment', async () => {
      const commentId = 'non-existent';

      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await commentService.deleteComment(commentId, 'user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment not found');
    });
  });

  describe('moderateComment', () => {
    it('should moderate comment successfully', async () => {
      const commentId = 'comment-123';
      const moderationData = {
        action: 'APPROVE' as const,
        reason: 'Content is appropriate'
      };

      const comment = {
        id: commentId,
        content: 'Comment to moderate',
        campaignId: 'campaign-123',
        authorId: 'user-456',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCommentRepository.findById.mockResolvedValue(comment);
      mockCommentRepository.update.mockResolvedValue({
        ...comment
      });

      const result = await commentService.moderateComment(commentId, moderationData, 'admin-123');

      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
      expect(mockCommentRepository.update).toHaveBeenCalledWith(commentId, { content: comment.content }, 'admin-123');
    });

    it('should fail for non-existent comment', async () => {
      const commentId = 'non-existent';
      const moderationData = {
        action: 'APPROVE' as const,
        reason: 'Content is appropriate'
      };

      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await commentService.moderateComment(commentId, moderationData, 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment not found');
    });
  });
});