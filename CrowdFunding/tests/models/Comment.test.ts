import { PrismaClient } from '@prisma/client';
import { CommentModel, CreateCommentDto, UpdateCommentDto } from '../../src/models/Comment';

// Mock Prisma client
const mockPrisma = {
  comment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn()
  },
  campaign: {
    findUnique: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
} as any;

describe('CommentModel', () => {
  let commentModel: CommentModel;

  beforeEach(() => {
    commentModel = new CommentModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment with valid data', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a test comment'
      };

      const campaignId = 'campaign-id';
      const authorId = 'author-id';

      const campaign = {
        id: campaignId,
        title: 'Test Campaign'
      };

      const author = {
        id: authorId,
        email: 'author@example.com',
        name: 'Author Name'
      };

      const expectedComment = {
        id: 'comment-id',
        content: commentData.content,
        campaignId: campaignId,
        authorId: authorId,
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        author: {
          id: authorId,
          name: 'Author Name',
          avatar: null
        },
        replies: []
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(author);
      mockPrisma.comment.create.mockResolvedValue(expectedComment);

      const result = await commentModel.create(commentData, campaignId, authorId);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId }
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: authorId }
      });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: commentData.content,
          campaignId: campaignId,
          authorId: authorId,
          parentId: null
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false }
          }
        }
      });
      expect(result).toEqual(expectedComment);
    });

    it('should create a reply comment with parentId', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a reply',
        parentId: 'parent-comment-id'
      };

      const campaignId = 'campaign-id';
      const authorId = 'author-id';

      const campaign = {
        id: campaignId,
        title: 'Test Campaign'
      };

      const author = {
        id: authorId,
        email: 'author@example.com',
        name: 'Author Name'
      };

      const parentComment = {
        id: 'parent-comment-id',
        campaignId: campaignId,
        content: 'Parent comment'
      };

      const expectedComment = {
        id: 'comment-id',
        content: commentData.content,
        campaignId: campaignId,
        authorId: authorId,
        parentId: commentData.parentId,
        isDeleted: false,
        createdAt: new Date()
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(author);
      mockPrisma.comment.findUnique.mockResolvedValue(parentComment);
      mockPrisma.comment.create.mockResolvedValue(expectedComment);

      const result = await commentModel.create(commentData, campaignId, authorId);

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentData.parentId }
      });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: commentData.content,
          campaignId: campaignId,
          authorId: authorId,
          parentId: commentData.parentId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false }
          }
        }
      });
      expect(result).toEqual(expectedComment);
    });

    it('should throw error if campaign not found', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a test comment'
      };

      const campaignId = 'non-existent-id';
      const authorId = 'author-id';

      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(commentModel.create(commentData, campaignId, authorId)).rejects.toThrow('Campaign not found');
    });

    it('should throw error if author not found', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a test comment'
      };

      const campaignId = 'campaign-id';
      const authorId = 'non-existent-id';

      const campaign = {
        id: campaignId,
        title: 'Test Campaign'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(commentModel.create(commentData, campaignId, authorId)).rejects.toThrow('Author not found');
    });

    it('should throw error if parent comment not found', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a reply',
        parentId: 'non-existent-parent-id'
      };

      const campaignId = 'campaign-id';
      const authorId = 'author-id';

      const campaign = {
        id: campaignId,
        title: 'Test Campaign'
      };

      const author = {
        id: authorId,
        email: 'author@example.com',
        name: 'Author Name'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(author);
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(commentModel.create(commentData, campaignId, authorId)).rejects.toThrow('Parent comment not found or does not belong to this campaign');
    });

    it('should throw error if parent comment belongs to different campaign', async () => {
      const commentData: CreateCommentDto = {
        content: 'This is a reply',
        parentId: 'parent-comment-id'
      };

      const campaignId = 'campaign-id';
      const authorId = 'author-id';

      const campaign = {
        id: campaignId,
        title: 'Test Campaign'
      };

      const author = {
        id: authorId,
        email: 'author@example.com',
        name: 'Author Name'
      };

      const parentComment = {
        id: 'parent-comment-id',
        campaignId: 'different-campaign-id',
        content: 'Parent comment'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(author);
      mockPrisma.comment.findUnique.mockResolvedValue(parentComment);

      await expect(commentModel.create(commentData, campaignId, authorId)).rejects.toThrow('Parent comment not found or does not belong to this campaign');
    });
  });

  describe('findById', () => {
    it('should return comment with relations when found', async () => {
      const commentId = 'comment-id';
      const expectedComment = {
        id: commentId,
        content: 'Test comment',
        campaignId: 'campaign-id',
        authorId: 'author-id',
        parentId: null,
        isDeleted: false,
        createdAt: new Date(),
        author: {
          id: 'author-id',
          name: 'Author Name',
          avatar: null
        },
        campaign: {
          id: 'campaign-id',
          title: 'Test Campaign'
        },
        parent: null,
        replies: []
      };

      mockPrisma.comment.findUnique.mockResolvedValue(expectedComment);

      const result = await commentModel.findById(commentId);

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true
            }
          },
          parent: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false }
          }
        }
      });
      expect(result).toEqual(expectedComment);
    });

    it('should return null when comment not found', async () => {
      const commentId = 'non-existent-id';

      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await commentModel.findById(commentId);

      expect(result).toBeNull();
    });
  });

  describe('findByCampaign', () => {
    it('should return paginated comments for campaign', async () => {
      const campaignId = 'campaign-id';
      const page = 2;
      const limit = 10;

      const comments = [
        { id: 'comment-1', content: 'Comment 1', author: { id: 'author-1', name: 'Author 1' } },
        { id: 'comment-2', content: 'Comment 2', author: { id: 'author-2', name: 'Author 2' } }
      ];
      const total = 25;

      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(total);

      const result = await commentModel.findByCampaign(campaignId, page, limit);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { 
          campaignId,
          isDeleted: false,
          parentId: null
        },
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      });
      expect(result).toEqual({ comments, total });
    });

    it('should use default pagination values', async () => {
      const campaignId = 'campaign-id';
      const comments = [];
      const total = 0;

      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(total);

      const result = await commentModel.findByCampaign(campaignId);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { 
          campaignId,
          isDeleted: false,
          parentId: null
        },
        skip: 0, // (1 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              replies: true
            }
          }
        }
      });
      expect(result).toEqual({ comments, total });
    });
  });

  describe('findByAuthor', () => {
    it('should return paginated comments by author', async () => {
      const authorId = 'author-id';
      const page = 1;
      const limit = 5;

      const comments = [
        { id: 'comment-1', content: 'Comment 1', campaign: { id: 'campaign-1', title: 'Campaign 1' } },
        { id: 'comment-2', content: 'Comment 2', campaign: { id: 'campaign-2', title: 'Campaign 2' } }
      ];
      const total = 10;

      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(total);

      const result = await commentModel.findByAuthor(authorId, page, limit);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: { 
          authorId,
          isDeleted: false
        },
        skip: 0, // (page - 1) * limit
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              category: true
            }
          },
          parent: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });
      expect(result).toEqual({ comments, total });
    });
  });

  describe('update', () => {
    it('should update comment when user is author', async () => {
      const commentId = 'comment-id';
      const userId = 'author-id';
      const updateData: UpdateCommentDto = {
        content: 'Updated comment content'
      };

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: userId
      };

      const updatedComment = {
        ...existingComment,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });
      mockPrisma.comment.update.mockResolvedValue(updatedComment);

      const result = await commentModel.update(commentId, updateData, userId);

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true
            }
          },
          parent: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            },
            where: { isDeleted: false }
          }
        }
      });
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { content: updateData.content },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual(updatedComment);
    });

    it('should allow admin to update any comment', async () => {
      const commentId = 'comment-id';
      const adminId = 'admin-id';
      const updateData: UpdateCommentDto = {
        content: 'Updated comment content'
      };

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: 'different-user-id'
      };

      const updatedComment = {
        ...existingComment,
        ...updateData
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.comment.update.mockResolvedValue(updatedComment);

      const result = await commentModel.update(commentId, updateData, adminId);

      expect(result).toEqual(updatedComment);
    });

    it('should throw error if user is not author or admin', async () => {
      const commentId = 'comment-id';
      const userId = 'unauthorized-user-id';
      const updateData: UpdateCommentDto = {
        content: 'Updated comment content'
      };

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: 'different-user-id'
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(commentModel.update(commentId, updateData, userId)).rejects.toThrow('Unauthorized to update this comment');
    });

    it('should throw error if comment not found', async () => {
      const commentId = 'non-existent-id';
      const userId = 'user-id';
      const updateData: UpdateCommentDto = {
        content: 'Updated comment content'
      };

      mockPrisma.comment.findUnique.mockResolvedValue(null);

      await expect(commentModel.update(commentId, updateData, userId)).rejects.toThrow('Comment not found');
    });
  });

  describe('delete', () => {
    it('should soft delete comment when user is author', async () => {
      const commentId = 'comment-id';
      const userId = 'author-id';

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: userId
      };

      const deletedComment = {
        ...existingComment,
        isDeleted: true
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });
      mockPrisma.comment.update.mockResolvedValue(deletedComment);

      await commentModel.delete(commentId, userId);

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { isDeleted: true }
      });
    });

    it('should allow admin to soft delete any comment', async () => {
      const commentId = 'comment-id';
      const adminId = 'admin-id';

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: 'different-user-id'
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.comment.update.mockResolvedValue({ ...existingComment, isDeleted: true });

      await commentModel.delete(commentId, adminId);

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { isDeleted: true }
      });
    });

    it('should throw error if user is not author or admin', async () => {
      const commentId = 'comment-id';
      const userId = 'unauthorized-user-id';

      const existingComment = {
        id: commentId,
        content: 'Original content',
        authorId: 'different-user-id'
      };

      mockPrisma.comment.findUnique.mockResolvedValue(existingComment);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(commentModel.delete(commentId, userId)).rejects.toThrow('Unauthorized to delete this comment');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete comment when user is admin', async () => {
      const commentId = 'comment-id';
      const adminId = 'admin-id';

      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.comment.delete.mockResolvedValue({});

      await commentModel.hardDelete(commentId, adminId);

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId }
      });
    });

    it('should throw error if user is not admin', async () => {
      const commentId = 'comment-id';
      const userId = 'user-id';

      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(commentModel.hardDelete(commentId, userId)).rejects.toThrow('Unauthorized to permanently delete this comment');
    });
  });

  describe('getCommentStats', () => {
    it('should return comment statistics', async () => {
      const campaignId = 'campaign-id';

      const totalComments = 10;
      const totalReplies = 25;
      const mostActiveUsers = [
        { authorId: 'user-1', _count: { authorId: 5 } },
        { authorId: 'user-2', _count: { authorId: 3 } }
      ];

      mockPrisma.comment.count.mockResolvedValueOnce(totalComments);
      mockPrisma.comment.count.mockResolvedValueOnce(totalReplies);
      mockPrisma.comment.groupBy.mockResolvedValue(mostActiveUsers);

      const result = await commentModel.getCommentStats(campaignId);

      expect(result).toEqual({
        totalComments: 10,
        totalReplies: 25,
        averageRepliesPerComment: 2.5,
        mostActiveUsers: [
          { authorId: 'user-1', commentCount: 5 },
          { authorId: 'user-2', commentCount: 3 }
        ]
      });
    });

    it('should handle zero comments', async () => {
      const totalComments = 0;
      const totalReplies = 0;
      const mostActiveUsers = [];

      mockPrisma.comment.count.mockResolvedValueOnce(totalComments);
      mockPrisma.comment.count.mockResolvedValueOnce(totalReplies);
      mockPrisma.comment.groupBy.mockResolvedValue(mostActiveUsers);

      const result = await commentModel.getCommentStats();

      expect(result).toEqual({
        totalComments: 0,
        totalReplies: 0,
        averageRepliesPerComment: 0,
        mostActiveUsers: []
      });
    });
  });

  describe('searchComments', () => {
    it('should return paginated search results', async () => {
      const query = 'test search';
      const page = 1;
      const limit = 10;

      const comments = [
        { id: 'comment-1', content: 'This is a test comment', author: { id: 'author-1', name: 'Author 1' } },
        { id: 'comment-2', content: 'Another test comment', author: { id: 'author-2', name: 'Author 2' } }
      ];
      const total = 15;

      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(total);

      const result = await commentModel.searchComments(query, page, limit);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          content: {
            contains: query,
            mode: 'insensitive'
          },
          isDeleted: false
        },
        skip: 0, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        }
      });
      expect(result).toEqual({ comments, total });
    });

    it('should use default pagination values', async () => {
      const query = 'test search';
      const comments = [];
      const total = 0;

      mockPrisma.comment.findMany.mockResolvedValue(comments);
      mockPrisma.comment.count.mockResolvedValue(total);

      const result = await commentModel.searchComments(query);

      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          content: {
            contains: query,
            mode: 'insensitive'
          },
          isDeleted: false
        },
        skip: 0, // (1 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        }
      });
      expect(result).toEqual({ comments, total });
    });
  });
});
