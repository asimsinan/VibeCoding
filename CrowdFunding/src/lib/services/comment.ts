import { CommentCore } from '../core/comment';
import { CommentRepository } from '../../repositories/CommentRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';

export interface CommentData {
  content: string;
  campaignId: string;
  authorId: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface ModerationData {
  action: 'APPROVE' | 'REJECT';
  reason: string;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  comment?: T;
  comments?: T;
  pagination?: T;
}

export class CommentService {
  constructor(
    private commentCore: CommentCore,
    private commentRepository: CommentRepository,
    private campaignRepository: CampaignRepository
  ) {}

  async createComment(commentData: CommentData): Promise<ServiceResult<any>> {
    try {
      // Check if campaign exists
      const campaign = await this.campaignRepository.findById(commentData.campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Validate content
      if (!this.commentCore.validateCommentContent(commentData.content)) {
        return { success: false, error: 'Invalid comment content' };
      }

      // Moderate content
      const moderationResult = this.commentCore.moderateComment(commentData.content);
      if (!moderationResult.isApproved) {
        return { success: false, error: `Comment rejected: ${moderationResult.reason}` };
      }

      // Generate notification
      const notification = this.commentCore.generateCommentNotification({
        id: 'temp-id',
        content: commentData.content,
        campaignId: commentData.campaignId,
        authorId: commentData.authorId,
        parentId: commentData.parentId,
        timestamp: new Date()
      });

      // Create comment
      const comment = await this.commentRepository.create({
        content: commentData.content,
        parentId: commentData.parentId || null
      }, commentData.campaignId, commentData.authorId);

      return { success: true, comment };
    } catch (error) {
      return { success: false, error: 'Failed to create comment' };
    }
  }

  async createReply(replyData: CommentData): Promise<ServiceResult<any>> {
    try {
      // Check if campaign exists
      const campaign = await this.campaignRepository.findById(replyData.campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Check if parent comment exists
      const parentComment = await this.commentRepository.findById(replyData.parentId!);
      if (!parentComment) {
        return { success: false, error: 'Parent comment not found' };
      }

      // Validate content
      if (!this.commentCore.validateCommentContent(replyData.content)) {
        return { success: false, error: 'Invalid comment content' };
      }

      // Check comment depth - get all comments for depth calculation
      const allComments = await this.commentRepository.findAllByCampaign(replyData.campaignId);
      const depth = this.commentCore.calculateCommentDepth(replyData.parentId!, allComments);
      if (depth >= 5) {
        return { success: false, error: 'Maximum comment depth exceeded' };
      }

      // Moderate content
      const moderationResult = this.commentCore.moderateComment(replyData.content);
      if (!moderationResult.isApproved) {
        return { success: false, error: `Comment rejected: ${moderationResult.reason}` };
      }

      // Create reply
      const comment = await this.commentRepository.create({
        content: replyData.content,
        parentId: replyData.parentId
      }, replyData.campaignId, replyData.authorId);

      return { success: true, comment };
    } catch (error) {
      return { success: false, error: 'Failed to create reply' };
    }
  }

  async getCampaignComments(campaignId: string, page: number, limit: number): Promise<ServiceResult<any>> {
    try {
      // Check if campaign exists
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      const result = await this.commentRepository.findByCampaign(campaignId, page, limit);
      // For tree building, we need all comments including replies
      const allComments = await this.commentRepository.findAllByCampaign(campaignId);
      const tree = this.commentCore.buildCommentTree(allComments);

      return {
        success: true,
        comments: tree,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get comments' };
    }
  }

  async updateComment(commentId: string, updateData: UpdateCommentData, userId: string): Promise<ServiceResult<any>> {
    try {
      const comment = await this.commentRepository.findById(commentId);
      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }

      // Check permissions
      if (!this.commentCore.validateCommentPermissions(comment, { id: userId, role: 'USER' }, 'EDIT')) {
        return { success: false, error: 'Unauthorized to edit this comment' };
      }

      // Validate content
      if (!this.commentCore.validateCommentContent(updateData.content)) {
        return { success: false, error: 'Invalid comment content' };
      }

      // Moderate content
      const moderationResult = this.commentCore.moderateComment(updateData.content);
      if (!moderationResult.isApproved) {
        return { success: false, error: `Comment rejected: ${moderationResult.reason}` };
      }

      // Update comment
      const updatedComment = await this.commentRepository.update(commentId, updateData, userId);
      return { success: true, comment: updatedComment };
    } catch (error) {
      return { success: false, error: 'Failed to update comment' };
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<ServiceResult<any>> {
    try {
      const comment = await this.commentRepository.findById(commentId);
      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }

      // Check permissions
      if (!this.commentCore.validateCommentPermissions(comment, { id: userId, role: 'USER' }, 'DELETE')) {
        return { success: false, error: 'Unauthorized to delete this comment' };
      }

      // Delete comment
      await this.commentRepository.delete(commentId, userId);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete comment' };
    }
  }

  async moderateComment(commentId: string, moderationData: ModerationData, adminId: string): Promise<ServiceResult<any>> {
    try {
      const comment = await this.commentRepository.findById(commentId);
      if (!comment) {
        return { success: false, error: 'Comment not found' };
      }

      // Update comment status
      const status = moderationData.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const updatedComment = await this.commentRepository.update(commentId, { content: comment.content }, adminId);

      return { success: true, comment: updatedComment };
    } catch (error) {
      return { success: false, error: 'Failed to moderate comment' };
    }
  }
}
