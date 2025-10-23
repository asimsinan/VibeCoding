import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate, authorize } from '../middleware/auth';
import { validateUUID, validateBody } from '../middleware/validation';
import { IsString, Length, IsOptional, IsUUID } from 'class-validator';
import { CommentController } from '../controllers/commentController';

const router = Router();

// DTO for creating a reply
class CreateReplyDto {
  @IsString()
  @Length(1, 500)
  content: string;
}

// DTO for updating a comment
class UpdateCommentDto {
  @IsString()
  @Length(1, 500)
  content: string;
}

// DTO for moderating a comment
class ModerateCommentDto {
  @IsString()
  action: string;
}

// Comment routes
router.post('/:id/reply', authenticate, validateUUID('id'), validateBody(CreateReplyDto), asyncHandler(CommentController.createReply));
router.put('/:id', authenticate, validateUUID('id'), validateBody(UpdateCommentDto), asyncHandler(CommentController.updateComment));
router.delete('/:id', authenticate, validateUUID('id'), asyncHandler(CommentController.deleteComment));
router.post('/:id/moderate', authenticate, authorize(['ADMIN']), validateUUID('id'), validateBody(ModerateCommentDto), asyncHandler(CommentController.moderateComment));

export default router;
