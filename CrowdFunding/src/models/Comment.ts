import { PrismaClient, Comment } from '@prisma/client';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}

export class CommentModel {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateCommentDto, campaignId: string, authorId: string): Promise<Comment> {
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

  async findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
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
  }

  async findByCampaign(campaignId: string, page: number = 1, limit: number = 20): Promise<{ comments: Comment[]; total: number }> {
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

    return { comments, total };
  }

  async findByAuthor(authorId: string, page: number = 1, limit: number = 20): Promise<{ comments: Comment[]; total: number }> {
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

    return { comments, total };
  }

  async update(id: string, data: UpdateCommentDto, authorId: string): Promise<Comment> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author or admin
    const user = await this.prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!user || (comment.authorId !== authorId && user.role !== 'ADMIN')) {
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

  async delete(id: string, authorId: string): Promise<void> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user is the author or admin
    const user = await this.prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!user || (comment.authorId !== authorId && user.role !== 'ADMIN')) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Soft delete - mark as deleted instead of removing from database
    await this.prisma.comment.update({
      where: { id },
      data: { isDeleted: true }
    });
  }

  async hardDelete(id: string, adminId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Unauthorized to permanently delete this comment');
    }

    await this.prisma.comment.delete({
      where: { id }
    });
  }

  async getCommentStats(campaignId?: string): Promise<{
    totalComments: number;
    totalReplies: number;
    averageRepliesPerComment: number;
    mostActiveUsers: Array<{ authorId: string; commentCount: number }>;
  }> {
    const where: any = { isDeleted: false };
    if (campaignId) where.campaignId = campaignId;

    const [totalComments, totalReplies, mostActiveUsers] = await Promise.all([
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

    const averageRepliesPerComment = totalComments > 0 ? totalReplies / totalComments : 0;

    return {
      totalComments,
      totalReplies,
      averageRepliesPerComment,
      mostActiveUsers: mostActiveUsers.map(user => ({
        authorId: user.authorId,
        commentCount: user._count.authorId
      }))
    };
  }

  async searchComments(query: string, page: number = 1, limit: number = 20): Promise<{ comments: Comment[]; total: number }> {
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

    return { comments, total };
  }
}
