import { PrismaClient } from '@prisma/client';
import { CommentRepository } from '../../src/repositories/CommentRepository';

describe('CommentRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let commentRepository: CommentRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    commentRepository = new CommentRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.donation.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create a comment in the database', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'This is a test comment'
      };

      const comment = await commentRepository.create(commentData, campaign.id, author.id);

      expect(comment).toMatchObject({
        content: commentData.content,
        campaignId: campaign.id,
        authorId: author.id,
        parentId: null
      });
      expect(comment.id).toBeDefined();
      expect(comment.createdAt).toBeDefined();

      // Verify comment exists in database
      const dbComment = await prisma.comment.findUnique({
        where: { id: comment.id }
      });
      expect(dbComment).toMatchObject(commentData);
    });

    it('should create a reply comment', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      // Create parent comment
      const parentComment = await commentRepository.create({
        content: 'Parent comment'
      }, campaign.id, author.id);

      // Create reply
      const replyData = {
        content: 'This is a reply',
        parentId: parentComment.id
      };

      const reply = await commentRepository.create(replyData, campaign.id, author.id);

      expect(reply).toMatchObject({
        content: replyData.content,
        campaignId: campaign.id,
        authorId: author.id,
        parentId: parentComment.id
      });

      // Verify reply exists in database
      const dbReply = await prisma.comment.findUnique({
        where: { id: reply.id }
      });
      expect(dbReply).toMatchObject(replyData);
    });

    it('should throw error if campaign not found', async () => {
      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const commentData = {
        content: 'This is a test comment'
      };

      await expect(commentRepository.create(commentData, 'non-existent-id', author.id)).rejects.toThrow('Campaign not found');
    });

    it('should throw error if author not found', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'This is a test comment'
      };

      await expect(commentRepository.create(commentData, campaign.id, 'non-existent-id')).rejects.toThrow('Author not found');
    });

    it('should throw error if parent comment not found', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'This is a reply',
        parentId: 'non-existent-id'
      };

      await expect(commentRepository.create(commentData, campaign.id, author.id)).rejects.toThrow('Parent comment not found');
    });
  });

  describe('findById', () => {
    it('should find comment by ID with relations', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'This is a test comment'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      const foundComment = await commentRepository.findById(createdComment.id);

      expect(foundComment).toMatchObject(createdComment);
      expect(foundComment?.campaign).toMatchObject({
        id: campaign.id,
        title: campaign.title
      });
      expect(foundComment?.author).toMatchObject({
        id: author.id,
        name: author.name
      });
    });

    it('should return null if comment not found', async () => {
      const foundComment = await commentRepository.findById('non-existent-id');
      expect(foundComment).toBeNull();
    });
  });

  describe('findByCampaign', () => {
    it('should return paginated comments for campaign', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      // Create multiple authors and comments
      const comments = [];
      for (let i = 0; i < 5; i++) {
        const author = await prisma.user.create({
          data: {
            email: `author${i}@example.com`,
            name: `Author ${i}`,
            password: 'testpassword123',
            role: 'USER'
          }
        });

        const comment = await commentRepository.create({
          content: `Comment ${i}`
        }, campaign.id, author.id);

        comments.push(comment);
      }

      const result = await commentRepository.findByCampaign(campaign.id, 1, 3);

      expect(result.comments).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.comments[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.comments[1].createdAt.getTime());
    });

    it('should handle empty results', async () => {
      const result = await commentRepository.findByCampaign('non-existent-id');

      expect(result.comments).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findByAuthor', () => {
    it('should return paginated comments by author', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      // Create multiple campaigns and comments
      const comments = [];
      for (let i = 0; i < 3; i++) {
        const campaign = await prisma.campaign.create({
          data: {
            title: `Campaign ${i}`,
            description: `Description ${i}`,
            goal: 1000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            category: 'TECHNOLOGY',
            ownerId: owner.id,
            status: 'ACTIVE'
          }
        });

        const comment = await commentRepository.create({
          content: `Comment ${i}`
        }, campaign.id, author.id);

        comments.push(comment);
      }

      const result = await commentRepository.findByAuthor(author.id, 1, 2);

      expect(result.comments).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.comments[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.comments[1].createdAt.getTime());
    });

    it('should handle empty results', async () => {
      const result = await commentRepository.findByAuthor('non-existent-id');

      expect(result.comments).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('update', () => {
    it('should update comment content', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Original comment'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      
      const updateData = {
        content: 'Updated comment'
      };

      const updatedComment = await commentRepository.update(createdComment.id, updateData, author.id);

      expect(updatedComment.content).toBe(updateData.content);
      expect(updatedComment.updatedAt.getTime()).toBeGreaterThan(createdComment.updatedAt.getTime());

      // Verify in database
      const dbComment = await prisma.comment.findUnique({
        where: { id: createdComment.id }
      });
      expect(dbComment?.content).toBe(updateData.content);
    });

    it('should allow admin to update any comment', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'testpassword123',
          role: 'ADMIN'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Original comment'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      
      const updateData = {
        content: 'Admin updated comment'
      };

      const updatedComment = await commentRepository.update(createdComment.id, updateData, admin.id);

      expect(updatedComment.content).toBe(updateData.content);
    });

    it('should throw error if user is not author or admin', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Original comment'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      
      const updateData = {
        content: 'Unauthorized update'
      };

      await expect(commentRepository.update(createdComment.id, updateData, otherUser.id)).rejects.toThrow('Unauthorized to update this comment');
    });

    it('should throw error if comment not found', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: 'User',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const updateData = {
        content: 'Updated content'
      };

      await expect(commentRepository.update('non-existent-id', updateData, user.id)).rejects.toThrow('Comment not found');
    });
  });

  describe('delete', () => {
    it('should delete comment from database', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Comment to delete'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      await commentRepository.delete(createdComment.id, author.id);

      // Verify comment is deleted
      const dbComment = await prisma.comment.findUnique({
        where: { id: createdComment.id }
      });
      expect(dbComment).toBeNull();
    });

    it('should allow admin to delete any comment', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'testpassword123',
          role: 'ADMIN'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Comment to delete by admin'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);
      await commentRepository.delete(createdComment.id, admin.id);

      // Verify comment is deleted
      const dbComment = await prisma.comment.findUnique({
        where: { id: createdComment.id }
      });
      expect(dbComment).toBeNull();
    });

    it('should throw error if user is not author or admin', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author = await prisma.user.create({
        data: {
          email: 'author@example.com',
          password: 'testpassword123',
          name: 'Comment Author',
          role: 'USER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const commentData = {
        content: 'Comment to delete'
      };

      const createdComment = await commentRepository.create(commentData, campaign.id, author.id);

      await expect(commentRepository.delete(createdComment.id, otherUser.id)).rejects.toThrow('Unauthorized to delete this comment');
    });

    it('should throw error if comment not found', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: 'User',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      await expect(commentRepository.delete('non-existent-id', user.id)).rejects.toThrow('Comment not found');
    });
  });

  describe('getCommentStats', () => {
    it('should return comment statistics', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const author1 = await prisma.user.create({
        data: {
          email: 'author1@example.com',
          name: 'Author 1',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const author2 = await prisma.user.create({
        data: {
          email: 'author2@example.com',
          name: 'Author 2',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Stats Campaign',
          description: 'Campaign for stats',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      // Create comments
      const comment1 = await commentRepository.create({
        content: 'Comment 1'
      }, campaign.id, author1.id);

      const comment2 = await commentRepository.create({
        content: 'Comment 2'
      }, campaign.id, author2.id);

      const comment3 = await commentRepository.create({
        content: 'Comment 3'
      }, campaign.id, author1.id);

      // Create replies
      await commentRepository.create({
        content: 'Reply 1',
        parentId: comment1.id
      }, campaign.id, author2.id);

      await commentRepository.create({
        content: 'Reply 2',
        parentId: comment1.id
      }, campaign.id, author1.id);

      const stats = await commentRepository.getCommentStats(campaign.id);

      expect(stats).toEqual({
        totalComments: 5,
        topLevelComments: 3,
        replies: 2,
        topCommenters: [
          { authorId: author1.id, commentCount: 3 },
          { authorId: author2.id, commentCount: 2 }
        ]
      });
    });

    it('should handle campaign with no comments', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'No Comments Campaign',
          description: 'Campaign with no comments',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const stats = await commentRepository.getCommentStats(campaign.id);

      expect(stats).toEqual({
        totalComments: 0,
        topLevelComments: 0,
        replies: 0,
        topCommenters: []
      });
    });
  });
});
