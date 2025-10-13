import { PrismaClient, UserRole, CourseStatus, EnrollmentStatus } from '@prisma/client';
import { fileUploadService } from '@/services/file-upload.service';
import { TestDataFactory, TestCleanup } from './integration-test-utils';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { promises as fs } from 'fs';
import path from 'path';

describe('FileUploadService', () => {
  let prisma: PrismaClient;
  let organization: any;
  let course: any;
  let module: any;
  let lesson: any;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;
  let otherStudentUser: any;
  let enrollment: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await TestCleanup.cleanupAll();
  });

  beforeEach(async () => {
    await TestCleanup.cleanupAll();
    
    // Create test data
    organization = await TestDataFactory.createOrganization();
    course = await TestDataFactory.createCourse({ 
      organizationId: organization.id,
      status: CourseStatus.PUBLISHED,
    });
    module = await TestDataFactory.createModule({ courseId: course.id });
    lesson = await TestDataFactory.createLesson({ moduleId: module.id });
    
    adminUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.ADMIN,
    });
    
    instructorUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.INSTRUCTOR,
    });
    
    studentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });

    otherStudentUser = await TestDataFactory.createUser({
      organizationId: organization.id,
      role: UserRole.STUDENT,
    });

    // Create enrollment
    enrollment = await TestDataFactory.createEnrollment({
      userId: studentUser.id,
      courseId: course.id,
      organizationId: organization.id,
      status: EnrollmentStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    await TestCleanup.cleanupAll();
    await prisma.$disconnect();
  });

  describe('File Upload', () => {
    it('should upload a file successfully', async () => {
      const fileBuffer = Buffer.from('Test file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      const result = await fileUploadService.uploadFile(
        file,
        adminUser.id,
        organization.id,
        {
          courseId: course.id,
          description: 'Test file upload',
        }
      );

      expect(result).toBeDefined();
      expect(result.filename).toBeDefined();
      expect(result.originalName).toBe('test.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.size).toBe(fileBuffer.length);
      expect(result.uploadedBy).toBe(adminUser.id);
      expect(result.uploadedAt).toBeDefined();
    });

    it('should allow instructors to upload files', async () => {
      const fileBuffer = Buffer.from('Instructor file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'instructor.pdf',
        mimetype: 'application/pdf',
        size: fileBuffer.length,
      };

      const result = await fileUploadService.uploadFile(
        file,
        instructorUser.id,
        organization.id,
        {
          lessonId: lesson.id,
        }
      );

      expect(result).toBeDefined();
      expect(result.originalName).toBe('instructor.pdf');
      expect(result.uploadedBy).toBe(instructorUser.id);
    });

    it('should prevent students from uploading files', async () => {
      const fileBuffer = Buffer.from('Student file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'student.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          studentUser.id,
          organization.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate file size', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const file = {
        buffer: largeBuffer,
        originalname: 'large.txt',
        mimetype: 'text/plain',
        size: largeBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should validate file type', async () => {
      const fileBuffer = Buffer.from('Executable content');
      const file = {
        buffer: fileBuffer,
        originalname: 'malware.exe',
        mimetype: 'application/x-executable',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should validate dangerous file extensions', async () => {
      const fileBuffer = Buffer.from('Dangerous content');
      const file = {
        buffer: fileBuffer,
        originalname: 'script.bat',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should validate empty filename', async () => {
      const fileBuffer = Buffer.from('Content');
      const file = {
        buffer: fileBuffer,
        originalname: '',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent cross-organization file uploads', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });

      const fileBuffer = Buffer.from('Cross org content');
      const file = {
        buffer: fileBuffer,
        originalname: 'cross.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          otherOrg.id
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate course access', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherCourse = await TestDataFactory.createCourse({
        organizationId: otherOrg.id,
        status: CourseStatus.PUBLISHED,
      });

      const fileBuffer = Buffer.from('Course content');
      const file = {
        buffer: fileBuffer,
        originalname: 'course.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id,
          {
            courseId: otherCourse.id,
          }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate lesson access', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherCourse = await TestDataFactory.createCourse({
        organizationId: otherOrg.id,
        status: CourseStatus.PUBLISHED,
      });
      const otherModule = await TestDataFactory.createModule({
        courseId: otherCourse.id,
      });
      const otherLesson = await TestDataFactory.createLesson({
        moduleId: otherModule.id,
      });

      const fileBuffer = Buffer.from('Lesson content');
      const file = {
        buffer: fileBuffer,
        originalname: 'lesson.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await expect(
        fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id,
          {
            lessonId: otherLesson.id,
          }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('File Retrieval', () => {
    let uploadedFile: any;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('Test file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      const result = await fileUploadService.uploadFile(
        file,
        adminUser.id,
        organization.id,
        {
          courseId: course.id,
        }
      );

      uploadedFile = await prisma.file.findUnique({
        where: { id: result.id },
      });
    });

    it('should get file by ID', async () => {
      const file = await fileUploadService.getFileById(uploadedFile.id, adminUser.id);

      expect(file).toBeDefined();
      expect(file.filename).toBe(uploadedFile.filename);
      expect(file.originalName).toBe(uploadedFile.originalName);
      expect(file.mimeType).toBe(uploadedFile.mimeType);
      expect(file.size).toBe(uploadedFile.size);
      expect(file.url).toBe(uploadedFile.url);
    });

    it('should allow students to access files', async () => {
      const file = await fileUploadService.getFileById(uploadedFile.id, studentUser.id);

      expect(file).toBeDefined();
      expect(file.originalName).toBe('test.txt');
    });

    it('should prevent cross-organization file access', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherUser = await TestDataFactory.createUser({
        organizationId: otherOrg.id,
        role: UserRole.ADMIN,
      });

      await expect(
        fileUploadService.getFileById(uploadedFile.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should get course files', async () => {
      const files = await fileUploadService.getCourseFiles(
        course.id,
        adminUser.id,
        1,
        10
      );

      expect(files).toBeDefined();
      expect(files.data).toHaveLength(1);
      expect(files.data[0].id).toBe(uploadedFile.id);
      expect(files.total).toBe(1);
    });

    it('should get lesson files', async () => {
      // Upload a file to the lesson
      const fileBuffer = Buffer.from('Lesson file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'lesson.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      await fileUploadService.uploadFile(
        file,
        adminUser.id,
        organization.id,
        {
          lessonId: lesson.id,
        }
      );

      const files = await fileUploadService.getLessonFiles(
        lesson.id,
        adminUser.id,
        1,
        10
      );

      expect(files).toBeDefined();
      expect(files.data).toHaveLength(1);
      expect(files.data[0].originalName).toBe('lesson.txt');
      expect(files.total).toBe(1);
    });

    it('should support pagination', async () => {
      // Upload multiple files
      for (let i = 0; i < 3; i++) {
        const fileBuffer = Buffer.from(`File content ${i}`);
        const file = {
          buffer: fileBuffer,
          originalname: `file${i}.txt`,
          mimetype: 'text/plain',
          size: fileBuffer.length,
        };

        await fileUploadService.uploadFile(
          file,
          adminUser.id,
          organization.id,
          {
            courseId: course.id,
          }
        );
      }

      const page1 = await fileUploadService.getCourseFiles(
        course.id,
        adminUser.id,
        1,
        2
      );

      expect(page1.data).toHaveLength(2);
      expect(page1.total).toBe(4); // 1 from beforeEach + 3 new
      expect(page1.totalPages).toBe(2);

      const page2 = await fileUploadService.getCourseFiles(
        course.id,
        adminUser.id,
        2,
        2
      );

      expect(page2.data).toHaveLength(2);
      expect(page2.total).toBe(4);
      expect(page2.totalPages).toBe(2);
    });
  });

  describe('File Deletion', () => {
    let uploadedFile: any;

    beforeEach(async () => {
      const fileBuffer = Buffer.from('Test file content');
      const file = {
        buffer: fileBuffer,
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: fileBuffer.length,
      };

      const result = await fileUploadService.uploadFile(
        file,
        adminUser.id,
        organization.id
      );

      uploadedFile = await prisma.file.findUnique({
        where: { id: result.id },
      });
    });

    it('should delete file successfully', async () => {
      const result = await fileUploadService.deleteFile(uploadedFile.id, adminUser.id);

      expect(result.success).toBe(true);

      // Verify file was deleted from database
      const deletedFile = await prisma.file.findUnique({
        where: { id: uploadedFile.id },
      });
      expect(deletedFile).toBeNull();
    });

    it('should allow instructors to delete files', async () => {
      const result = await fileUploadService.deleteFile(uploadedFile.id, instructorUser.id);

      expect(result.success).toBe(true);
    });

    it('should prevent students from deleting files', async () => {
      await expect(
        fileUploadService.deleteFile(uploadedFile.id, studentUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent cross-organization file deletion', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherUser = await TestDataFactory.createUser({
        organizationId: otherOrg.id,
        role: UserRole.ADMIN,
      });

      await expect(
        fileUploadService.deleteFile(uploadedFile.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('File Statistics', () => {
    beforeEach(async () => {
      // Upload files of different types
      const files = [
        { name: 'doc1.pdf', type: 'application/pdf', content: 'PDF content' },
        { name: 'img1.jpg', type: 'image/jpeg', content: 'Image content' },
        { name: 'text1.txt', type: 'text/plain', content: 'Text content' },
        { name: 'doc2.pdf', type: 'application/pdf', content: 'Another PDF' },
      ];

      for (const file of files) {
        const fileBuffer = Buffer.from(file.content);
        await fileUploadService.uploadFile(
          {
            buffer: fileBuffer,
            originalname: file.name,
            mimetype: file.type,
            size: fileBuffer.length,
          },
          adminUser.id,
          organization.id,
          {
            courseId: course.id,
          }
        );
      }
    });

    it('should get file statistics', async () => {
      const stats = await fileUploadService.getFileStats(organization.id, adminUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBe(4);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.filesByType['application/pdf']).toBe(2);
      expect(stats.filesByType['image/jpeg']).toBe(1);
      expect(stats.filesByType['text/plain']).toBe(1);
      expect(stats.recentUploads).toBe(4);
    });

    it('should prevent cross-organization statistics access', async () => {
      const otherOrg = await TestDataFactory.createOrganization({
        domain: 'other.com',
      });
      const otherUser = await TestDataFactory.createUser({
        organizationId: otherOrg.id,
        role: UserRole.ADMIN,
      });

      await expect(
        fileUploadService.getFileStats(organization.id, otherUser.id)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prevent students from viewing statistics', async () => {
      await expect(
        fileUploadService.getFileStats(organization.id, studentUser.id)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent file', async () => {
      await expect(
        fileUploadService.getFileById('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle non-existent course', async () => {
      await expect(
        fileUploadService.getCourseFiles('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle non-existent lesson', async () => {
      await expect(
        fileUploadService.getLessonFiles('non-existent-id', adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle file not found on disk', async () => {
      // Create a file record without the actual file
      const fileRecord = await prisma.file.create({
        data: {
          filename: 'missing.txt',
          originalName: 'missing.txt',
          mimeType: 'text/plain',
          size: 100,
          path: '/non/existent/path/missing.txt',
          url: '/uploads/missing.txt',
          hash: 'test-hash',
          uploadedBy: adminUser.id,
          organizationId: organization.id,
        },
      });

      await expect(
        fileUploadService.getFileById(fileRecord.id, adminUser.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle course with no files', async () => {
      const emptyCourse = await TestDataFactory.createCourse({
        organizationId: organization.id,
        status: CourseStatus.PUBLISHED,
      });

      const files = await fileUploadService.getCourseFiles(
        emptyCourse.id,
        adminUser.id,
        1,
        10
      );

      expect(files.data).toHaveLength(0);
      expect(files.total).toBe(0);
    });

    it('should handle lesson with no files', async () => {
      const files = await fileUploadService.getLessonFiles(
        lesson.id,
        adminUser.id,
        1,
        10
      );

      expect(files.data).toHaveLength(0);
      expect(files.total).toBe(0);
    });
  });
});
