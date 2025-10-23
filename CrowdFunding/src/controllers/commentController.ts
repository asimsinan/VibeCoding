import { Request, Response } from 'express';
import { CommentService } from '../lib/services/comment';
import { CommentCore } from '../lib/core/comment';
import { CommentRepository } from '../repositories/CommentRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const commentCore = new CommentCore();
const commentRepository = new CommentRepository(prisma);
const campaignRepository = new CampaignRepository(prisma);
const commentService = new CommentService(commentCore, commentRepository, campaignRepository);

export class CommentController {
  // POST /api/v1/campaigns/:id/comments
  static async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const commentData = {
        ...req.body,
        campaignId,
        authorId: req.user?.id
      };

      const result = await commentService.createComment(commentData);

      if (result.success) {
        res.status(201).json({
          success: true,
          ...result.comment
        });
      } else {
        const statusCode = result.error?.includes('Campaign not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // POST /api/v1/comments/:id/reply
  static async createReply(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: parentId } = req.params;
      const replyData = {
        ...req.body,
        parentId,
        authorId: req.user?.id
      };

      const result = await commentService.createReply(replyData);

      if (result.success) {
        res.status(201).json({
          success: true,
          comment: result.comment
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/:id/comments
  static async getCampaignComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await commentService.getCampaignComments(campaignId, page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          comments: result.comments,
          pagination: result.pagination
        });
      } else {
        const statusCode = result.error?.includes('Campaign not found') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PUT /api/v1/comments/:id
  static async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await commentService.updateComment(id, updateData, req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true,
          comment: result.comment
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // DELETE /api/v1/comments/:id
  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await commentService.deleteComment(id, req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // POST /api/v1/comments/:id/moderate
  static async moderateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.body;

      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const result = await commentService.moderateComment(id, { action, reason: 'Moderated by admin' }, req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true,
          comment: result.comment
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
