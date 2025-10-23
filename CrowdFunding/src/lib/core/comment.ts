export class CommentCore {
  private readonly MAX_CONTENT_LENGTH = 1000;
  private readonly MAX_DEPTH = 5;

  /**
   * Validate comment content
   */
  validateCommentContent(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    if (content.length > this.MAX_CONTENT_LENGTH) {
      return false;
    }

    // Check for inappropriate content (simplified)
    const inappropriateWords = ['inappropriate', 'spam', 'bad'];
    const lowerContent = content.toLowerCase();
    return !inappropriateWords.some(word => lowerContent.includes(word));
  }

  /**
   * Calculate comment depth in thread
   */
  calculateCommentDepth(commentId: string, comments: Array<{ id: string; parentId: string | null }>): number {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return 0;

    let depth = 0;
    let currentComment = comment;

    while (currentComment.parentId && depth < this.MAX_DEPTH) {
      depth++;
      currentComment = comments.find(c => c.id === currentComment.parentId)!;
      if (!currentComment) break;
    }

    return Math.min(depth, this.MAX_DEPTH);
  }

  /**
   * Build comment tree structure
   */
  buildCommentTree(comments: Array<{ id: string; parentId: string | null; content: string; replies?: any[] }>) {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // Create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build tree structure
    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).replies.push(commentMap.get(comment.id));
      } else if (!comment.parentId) {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }

  /**
   * Sort comments by specified criteria
   */
  sortComments(comments: any[], sortBy: 'timestamp' | 'likes' = 'timestamp') {
    return [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        default:
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
    });
  }

  /**
   * Calculate comment statistics
   */
  calculateCommentStats(comments: Array<{ parentId: string | null; likes?: number }>) {
    const totalComments = comments.length;
    const topLevelComments = comments.filter(c => !c.parentId).length;
    const replies = comments.filter(c => c.parentId).length;
    const totalLikes = comments.reduce((sum, c) => sum + (c.likes || 0), 0);
    const averageLikes = totalComments > 0 ? totalLikes / totalComments : 0;

    return {
      totalComments,
      topLevelComments,
      replies,
      totalLikes,
      averageLikes
    };
  }

  /**
   * Moderate comment content
   */
  moderateComment(content: string) {
    const inappropriateWords = ['inappropriate', 'bad'];
    const spamWords = ['buy now', 'click here', 'amazing deals', 'spam'];
    
    const lowerContent = content.toLowerCase();

    // Check for spam first
    if (spamWords.some(word => lowerContent.includes(word))) {
      return {
        isApproved: false,
        reason: 'Spam content detected'
      };
    }

    // Check for inappropriate content
    if (inappropriateWords.some(word => lowerContent.includes(word))) {
      return {
        isApproved: false,
        reason: 'Inappropriate content detected'
      };
    }

    return {
      isApproved: true,
      reason: 'Content approved'
    };
  }

  /**
   * Generate comment notification
   */
  generateCommentNotification(comment: {
    id: string;
    content: string;
    authorId: string;
    campaignId: string;
    parentId?: string;
    timestamp: Date;
  }) {
    const isReply = !!comment.parentId;
    
    return {
      type: isReply ? 'NEW_REPLY' : 'NEW_COMMENT',
      commentId: comment.id,
      campaignId: comment.campaignId,
      authorId: comment.authorId,
      parentCommentId: comment.parentId,
      message: isReply 
        ? 'Someone replied to a comment'
        : 'Someone commented on the campaign',
      timestamp: comment.timestamp
    };
  }

  /**
   * Validate comment permissions
   */
  validateCommentPermissions(comment: { authorId: string }, user: { id: string; role: string }, action: 'EDIT' | 'DELETE') {
    // Users can edit/delete their own comments
    if (comment.authorId === user.id) {
      return true;
    }

    // Admins can edit/delete any comment
    if (user.role === 'ADMIN') {
      return true;
    }

    // Moderators can delete comments
    if (user.role === 'MODERATOR' && action === 'DELETE') {
      return true;
    }

    return false;
  }
}
