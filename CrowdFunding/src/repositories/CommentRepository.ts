import { PrismaClient, Comment, Prisma } from '@prisma/client';

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentListResult {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
}

export interface CommentStats {
  totalComments: number;
  topLevelComments: number;
  replies: number;
  topCommenters: Array<{ authorId: string; commentCount: number }>;
}

export type CommentWithRelations = any;

export class CommentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateCommentData, campaignId: string, authorId: string): Promise<Comment> {
    // Validate campaign exists
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Validate author exists
    const author = await this.prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      throw new Error('Author not found');
    }

    // Validate parent comment if provided
    if (data.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: data.parentId }
      });

      if (!parentComment || parentComment.campaignId !== campaignId) {
        throw new Error('Parent comment not found or does not belong to this campaign');
      }
    }

    return this.prisma.comment.create({
      data: {
        content: data.content,
        campaignId: campaignId,
        authorId: authorId,
        parentId: data.parentId || null
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
  }

  async findById(id: string): Promise<CommentWithRelations | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
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

    if (!comment) return null;

    return {
      ...comment,
      author: comment.author,
      campaign: comment.campaign
    };
  }

  async findAllByCampaign(campaignId: string): Promise<Array<{ id: string; parentId: string | null; content: string }>> {
    return this.prisma.comment.findMany({
      where: { 
        campaignId,
        isDeleted: false
      },
      select: {
        id: true,
        parentId: true,
        content: true
      }
    });
  }

  async findByCampaign(campaignId: string, page: number = 1, limit: number = 20): Promise<CommentListResult> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { 
          campaignId,
          isDeleted: false,
          parentId: null // Only top-level comments
        },
        skip,
        take: limit,
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
      }),
      this.prisma.comment.count({ 
        where: { 
          campaignId,
          isDeleted: false,
          parentId: null
        }
      })
    ]);

    return { comments, total, page, limit };
  }

  async findByAuthor(authorId: string, page: number = 1, limit: number = 20): Promise<CommentListResult> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { 
          authorId,
          isDeleted: false
        },
        skip,
        take: limit,
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
      }),
      this.prisma.comment.count({ 
        where: { 
          authorId,
          isDeleted: false
        }
      })
    ]);

    return { comments, total, page, limit };
  }

  async update(id: string, data: UpdateCommentData, userId: string): Promise<Comment> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (comment.authorId !== userId && user.role !== 'ADMIN')) {
      throw new Error('Unauthorized to update this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: data.content },
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
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (comment.authorId !== userId && user.role !== 'ADMIN')) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Hard delete - remove from database
    await this.prisma.comment.delete({
      where: { id }
    });
  }

  async getCommentStats(campaignId?: string): Promise<CommentStats> {
    const where: any = {};
    if (campaignId) where.campaignId = campaignId;

    const [totalComments, topLevelComments, replies, mostActiveUsers] = await Promise.all([
      this.prisma.comment.count({
        where
      }),
      this.prisma.comment.count({
        where: { ...where, parentId: null }
      }),
      this.prisma.comment.count({
        where: { ...where, parentId: { not: null } }
      }),
      this.prisma.comment.groupBy({
        by: ['authorId'],
        where,
        _count: { authorId: true },
        orderBy: { _count: { authorId: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalComments,
      topLevelComments,
      replies,
      topCommenters: mostActiveUsers.map(user => ({
        authorId: user.authorId,
        commentCount: user._count.authorId
      }))
    };
  }

  async searchComments(query: string, page: number = 1, limit: number = 20): Promise<CommentListResult> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          content: {
            contains: query,
            mode: 'insensitive'
          },
          isDeleted: false
        },
        skip,
        take: limit,
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
      }),
      this.prisma.comment.count({
        where: {
          content: {
            contains: query,
            mode: 'insensitive'
          },
          isDeleted: false
        }
      })
    ]);

    return { comments, total, page, limit };
  }
}
