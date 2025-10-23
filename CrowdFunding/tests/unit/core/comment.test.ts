import { CommentCore } from '../../../src/lib/core/comment';

describe('CommentCore', () => {
  let commentCore: CommentCore;

  beforeEach(() => {
    commentCore = new CommentCore();
  });

  describe('validateCommentContent', () => {
    it('should return true for valid comment content', () => {
      const content = 'This is a great campaign! I love the idea.';
      
      const isValid = commentCore.validateCommentContent(content);
      
      expect(isValid).toBe(true);
    });

    it('should return false for empty content', () => {
      const content = '';
      
      const isValid = commentCore.validateCommentContent(content);
      
      expect(isValid).toBe(false);
    });

    it('should return false for content too long', () => {
      const content = 'A'.repeat(1001); // Exceeds 1000 character limit
      
      const isValid = commentCore.validateCommentContent(content);
      
      expect(isValid).toBe(false);
    });

    it('should return false for content with inappropriate language', () => {
      const content = 'This comment contains inappropriate content';
      
      const isValid = commentCore.validateCommentContent(content);
      
      expect(isValid).toBe(false);
    });

    it('should handle content with special characters', () => {
      const content = 'Great project! 👍 Keep up the good work! 🚀';
      
      const isValid = commentCore.validateCommentContent(content);
      
      expect(isValid).toBe(true);
    });
  });

  describe('calculateCommentDepth', () => {
    it('should calculate comment depth correctly', () => {
      const comments = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
        { id: '3', parentId: '2' },
        { id: '4', parentId: '1' }
      ];
      
      const depth = commentCore.calculateCommentDepth('3', comments);
      
      expect(depth).toBe(2);
    });

    it('should return 0 for top-level comment', () => {
      const comments = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' }
      ];
      
      const depth = commentCore.calculateCommentDepth('1', comments);
      
      expect(depth).toBe(0);
    });

    it('should handle maximum depth limit', () => {
      const comments = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
        { id: '3', parentId: '2' },
        { id: '4', parentId: '3' },
        { id: '5', parentId: '4' },
        { id: '6', parentId: '5' } // This would exceed max depth
      ];
      
      const depth = commentCore.calculateCommentDepth('6', comments);
      
      expect(depth).toBeLessThanOrEqual(5); // Max depth limit
    });
  });

  describe('buildCommentTree', () => {
    it('should build comment tree correctly', () => {
      const comments = [
        { id: '1', parentId: null, content: 'Root comment' },
        { id: '2', parentId: '1', content: 'Reply to root' },
        { id: '3', parentId: '1', content: 'Another reply' },
        { id: '4', parentId: '2', content: 'Nested reply' }
      ];
      
      const tree = commentCore.buildCommentTree(comments);
      
      expect(tree).toHaveLength(1); // One root comment
      expect(tree[0].replies).toHaveLength(2); // Two direct replies
      expect(tree[0].replies[0].replies).toHaveLength(1); // One nested reply
    });

    it('should handle empty comments array', () => {
      const comments: any[] = [];
      
      const tree = commentCore.buildCommentTree(comments);
      
      expect(tree).toHaveLength(0);
    });

    it('should handle orphaned comments', () => {
      const comments = [
        { id: '1', parentId: 'nonexistent', content: 'Orphaned comment' },
        { id: '2', parentId: null, content: 'Root comment' }
      ];
      
      const tree = commentCore.buildCommentTree(comments);
      
      expect(tree).toHaveLength(1); // Only root comment, orphaned ignored
    });
  });

  describe('sortComments', () => {
    it('should sort comments by timestamp', () => {
      const comments = [
        { id: '1', timestamp: new Date('2024-12-15T10:00:00Z') },
        { id: '2', timestamp: new Date('2024-12-15T09:00:00Z') },
        { id: '3', timestamp: new Date('2024-12-15T11:00:00Z') }
      ];
      
      const sorted = commentCore.sortComments(comments, 'timestamp');
      
      expect(sorted[0].id).toBe('2'); // Oldest first
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3'); // Newest last
    });

    it('should sort comments by likes', () => {
      const comments = [
        { id: '1', likes: 5 },
        { id: '2', likes: 10 },
        { id: '3', likes: 3 }
      ];
      
      const sorted = commentCore.sortComments(comments, 'likes');
      
      expect(sorted[0].id).toBe('2'); // Most likes first
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3'); // Least likes last
    });

    it('should handle default sorting', () => {
      const comments = [
        { id: '1', timestamp: new Date('2024-12-15T10:00:00Z') },
        { id: '2', timestamp: new Date('2024-12-15T09:00:00Z') }
      ];
      
      const sorted = commentCore.sortComments(comments);
      
      expect(sorted[0].id).toBe('2'); // Default to timestamp
    });
  });

  describe('calculateCommentStats', () => {
    it('should calculate comment statistics correctly', () => {
      const comments = [
        { id: '1', parentId: null, likes: 5 },
        { id: '2', parentId: '1', likes: 3 },
        { id: '3', parentId: '1', likes: 7 },
        { id: '4', parentId: null, likes: 2 }
      ];
      
      const stats = commentCore.calculateCommentStats(comments);
      
      expect(stats.totalComments).toBe(4);
      expect(stats.topLevelComments).toBe(2);
      expect(stats.replies).toBe(2);
      expect(stats.totalLikes).toBe(17);
      expect(stats.averageLikes).toBeCloseTo(4.25, 2);
    });

    it('should handle empty comments array', () => {
      const comments: any[] = [];
      
      const stats = commentCore.calculateCommentStats(comments);
      
      expect(stats.totalComments).toBe(0);
      expect(stats.topLevelComments).toBe(0);
      expect(stats.replies).toBe(0);
      expect(stats.totalLikes).toBe(0);
      expect(stats.averageLikes).toBe(0);
    });
  });

  describe('moderateComment', () => {
    it('should flag inappropriate content', () => {
      const content = 'This comment contains inappropriate content';
      
      const result = commentCore.moderateComment(content);
      
      expect(result.isApproved).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should approve appropriate content', () => {
      const content = 'This is a great campaign! I love the idea.';
      
      const result = commentCore.moderateComment(content);
      
      expect(result.isApproved).toBe(true);
    });

    it('should handle spam detection', () => {
      const content = 'Buy now! Click here! Amazing deals! Spam spam spam!';
      
      const result = commentCore.moderateComment(content);
      
      expect(result.isApproved).toBe(false);
      expect(result.reason).toContain('Spam');
    });
  });

  describe('generateCommentNotification', () => {
    it('should generate notification for new comment', () => {
      const comment = {
        id: 'comment-123',
        content: 'Great project!',
        authorId: 'user-456',
        campaignId: 'campaign-789',
        timestamp: new Date('2024-12-15T10:30:00Z')
      };
      
      const notification = commentCore.generateCommentNotification(comment);
      
      expect(notification.type).toBe('NEW_COMMENT');
      expect(notification.commentId).toBe(comment.id);
      expect(notification.campaignId).toBe(comment.campaignId);
      expect(notification.message).toBeDefined();
    });

    it('should generate notification for reply', () => {
      const comment = {
        id: 'comment-123',
        content: 'Thanks for the feedback!',
        authorId: 'user-456',
        campaignId: 'campaign-789',
        parentId: 'comment-111',
        timestamp: new Date('2024-12-15T10:30:00Z')
      };
      
      const notification = commentCore.generateCommentNotification(comment);
      
      expect(notification.type).toBe('NEW_REPLY');
      expect(notification.parentCommentId).toBe(comment.parentId);
    });
  });

  describe('validateCommentPermissions', () => {
    it('should allow user to edit own comment', () => {
      const comment = { authorId: 'user-123' };
      const user = { id: 'user-123', role: 'USER' };
      
      const canEdit = commentCore.validateCommentPermissions(comment, user, 'EDIT');
      
      expect(canEdit).toBe(true);
    });

    it('should deny user from editing others comment', () => {
      const comment = { authorId: 'user-456' };
      const user = { id: 'user-123', role: 'USER' };
      
      const canEdit = commentCore.validateCommentPermissions(comment, user, 'EDIT');
      
      expect(canEdit).toBe(false);
    });

    it('should allow admin to edit any comment', () => {
      const comment = { authorId: 'user-456' };
      const user = { id: 'user-123', role: 'ADMIN' };
      
      const canEdit = commentCore.validateCommentPermissions(comment, user, 'EDIT');
      
      expect(canEdit).toBe(true);
    });

    it('should allow moderator to delete comments', () => {
      const comment = { authorId: 'user-456' };
      const user = { id: 'user-123', role: 'MODERATOR' };
      
      const canDelete = commentCore.validateCommentPermissions(comment, user, 'DELETE');
      
      expect(canDelete).toBe(true);
    });
  });
});
