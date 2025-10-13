import { PrismaClient, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private prisma: PrismaClient,
    uploadDir: string = './uploads',
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: string[] = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/zip',
      'application/x-rar-compressed',
    ]
  ) {
    this.uploadDir = uploadDir;
    this.maxFileSize = maxFileSize;
    this.allowedMimeTypes = allowedMimeTypes;
  }

  /**
   * Upload a file
   * @param file - File data
   * @param uploadedBy - User ID who uploaded the file
   * @param organizationId - Organization ID
   * @param metadata - Additional metadata
   * @returns Upload result
   */
  async uploadFile(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    uploadedBy: string,
    organizationId: string,
    metadata?: {
      courseId?: string;
      lessonId?: string;
      description?: string;
    }
  ): Promise<FileUploadResult> {
    try {
      logger.info('Uploading file', { 
        originalName: file.originalname, 
        size: file.size, 
        uploadedBy, 
        organizationId 
      });

      // Validate file
      this.validateFile(file);

      // Verify uploader permissions
      const uploader = await this.prisma.user.findUnique({
        where: { id: uploadedBy },
        select: { role: true, organizationId: true },
      });

      if (!uploader) {
        throw new ForbiddenError('Uploader not found');
      }

      // Check permissions
      if (
        uploader.role !== 'ADMIN' &&
        uploader.organizationId !== organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to upload files to this organization');
      }

      // Only admins and instructors can upload files
      if (!['ADMIN', 'INSTRUCTOR'].includes(uploader.role)) {
        throw new ForbiddenError('Only administrators and instructors can upload files');
      }

      // Verify course/lesson access if specified
      if (metadata?.courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: metadata.courseId },
          select: { id: true, organizationId: true },
        });

        if (!course) {
          throw new NotFoundError('Course not found');
        }

        if (course.organizationId !== organizationId) {
          throw new ForbiddenError('Course does not belong to the specified organization');
        }
      }

      if (metadata?.lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
          where: { id: metadata.lessonId },
          include: {
            module: {
              include: {
                course: {
                  select: { id: true, organizationId: true },
                },
              },
            },
          },
        });

        if (!lesson) {
          throw new NotFoundError('Lesson not found');
        }

        if (lesson.module.course.organizationId !== organizationId) {
          throw new ForbiddenError('Lesson does not belong to the specified organization');
        }
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      
      // Create organization-specific directory structure
      const orgDir = path.join(this.uploadDir, organizationId);
      const year = new Date().getFullYear().toString();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const fileDir = path.join(orgDir, year, month);

      // Ensure directory exists
      await this.ensureDirectoryExists(fileDir);

      // Save file
      const filePath = path.join(fileDir, uniqueFilename);
      await fs.writeFile(filePath, file.buffer);

      // Generate file URL
      const fileUrl = `/uploads/${organizationId}/${year}/${month}/${uniqueFilename}`;

      // Calculate file hash for integrity
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Store file metadata in database
      const fileRecord = await this.prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: filePath,
          url: fileUrl,
          hash: fileHash,
          uploadedBy: uploadedBy,
          organizationId: organizationId,
          courseId: metadata?.courseId,
          lessonId: metadata?.lessonId,
          description: metadata?.description,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const result: FileUploadResult = {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        path: fileRecord.path,
        url: fileRecord.url,
        uploadedBy: fileRecord.uploadedBy,
        uploadedAt: fileRecord.createdAt,
      };

      logger.info('File uploaded successfully', { 
        fileId: fileRecord.id,
        filename: uniqueFilename,
        uploadedBy,
        organizationId 
      });

      return result;
    } catch (error) {
      logger.error('Failed to upload file', { error, uploadedBy, organizationId });
      throw error;
    }
  }

  /**
   * Get file by ID
   * @param fileId - File ID
   * @param requesterId - User ID requesting the file
   * @returns File metadata
   */
  async getFileById(fileId: string, requesterId: string): Promise<FileMetadata> {
    try {
      logger.info('Fetching file by ID', { fileId, requesterId });

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!file) {
        throw new NotFoundError('File not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only access files from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== file.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to access this file');
      }

      // Check if file exists on disk
      try {
        await fs.access(file.path);
      } catch {
        throw new NotFoundError('File not found on disk');
      }

      const result: FileMetadata = {
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
      };

      logger.info('File fetched successfully', { 
        fileId,
        requesterId 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch file', { error, fileId, requesterId });
      throw error;
    }
  }

  /**
   * Get files for a course
   * @param courseId - Course ID
   * @param requesterId - User ID requesting the files
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated files
   */
  async getCourseFiles(
    courseId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching course files', { courseId, requesterId, page, pageSize });

      // Verify course exists and get organization
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view files from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view files for this course');
      }

      const skip = (page - 1) * pageSize;

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where: { courseId },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.file.count({
          where: { courseId },
        }),
      ]);

      const result = {
        data: files,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('Course files fetched successfully', { 
        courseId,
        requesterId,
        count: files.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch course files', { error, courseId, requesterId });
      throw error;
    }
  }

  /**
   * Get files for a lesson
   * @param lessonId - Lesson ID
   * @param requesterId - User ID requesting the files
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated files
   */
  async getLessonFiles(
    lessonId: string,
    requesterId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      logger.info('Fetching lesson files', { lessonId, requesterId, page, pageSize });

      // Verify lesson exists and get organization
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: {
                include: {
                  organization: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view files from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== lesson.module.course.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view files for this lesson');
      }

      const skip = (page - 1) * pageSize;

      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where: { lessonId },
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        this.prisma.file.count({
          where: { lessonId },
        }),
      ]);

      const result = {
        data: files,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };

      logger.info('Lesson files fetched successfully', { 
        lessonId,
        requesterId,
        count: files.length,
        total 
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch lesson files', { error, lessonId, requesterId });
      throw error;
    }
  }

  /**
   * Delete a file
   * @param fileId - File ID
   * @param deleterId - User ID performing the deletion
   * @returns Success status
   */
  async deleteFile(fileId: string, deleterId: string): Promise<{ success: boolean }> {
    try {
      logger.info('Deleting file', { fileId, deleterId });

      // Check if file exists
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      });

      if (!file) {
        throw new NotFoundError('File not found');
      }

      // Verify deleter has permission
      const deleter = await this.prisma.user.findUnique({
        where: { id: deleterId },
        select: { role: true, organizationId: true },
      });

      if (!deleter) {
        throw new ForbiddenError('Deleter not found');
      }

      // Check permissions
      if (
        deleter.role !== 'ADMIN' &&
        deleter.organizationId !== file.organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to delete this file');
      }

      // Only admins and instructors can delete files
      if (!['ADMIN', 'INSTRUCTOR'].includes(deleter.role)) {
        throw new ForbiddenError('Only administrators and instructors can delete files');
      }

      // Delete file from disk
      try {
        await fs.unlink(file.path);
      } catch (error) {
        logger.warn('Failed to delete file from disk', { filePath: file.path, error });
        // Continue with database deletion even if file deletion fails
      }

      // Delete file record from database
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      logger.info('File deleted successfully', { 
        fileId,
        deleterId 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete file', { error, fileId, deleterId });
      throw error;
    }
  }

  /**
   * Validate file before upload
   * @param file - File data
   */
  private validateFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new ValidationError(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`, {
        file: [`File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`],
      });
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} is not allowed`, {
        file: [`File type ${file.mimetype} is not supported`],
      });
    }

    // Check filename
    if (!file.originalname || file.originalname.trim().length === 0) {
      throw new ValidationError('Filename is required', {
        file: ['Filename cannot be empty'],
      });
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (dangerousExtensions.includes(fileExtension)) {
      throw new ValidationError(`File extension ${fileExtension} is not allowed for security reasons`, {
        file: [`File extension ${fileExtension} is not allowed`],
      });
    }
  }

  /**
   * Ensure directory exists
   * @param dirPath - Directory path
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Get file statistics for an organization
   * @param organizationId - Organization ID
   * @param requesterId - User ID requesting statistics
   * @returns File statistics
   */
  async getFileStats(
    organizationId: string,
    requesterId: string
  ): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      logger.info('Fetching file statistics', { organizationId, requesterId });

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view statistics from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view statistics for this organization');
      }

      const [
        totalFiles,
        totalSizeResult,
        filesByTypeResult,
        recentUploads,
      ] = await Promise.all([
        this.prisma.file.count({
          where: { organizationId },
        }),
        this.prisma.file.aggregate({
          where: { organizationId },
          _sum: { size: true },
        }),
        this.prisma.file.groupBy({
          by: ['mimeType'],
          where: { organizationId },
          _count: { mimeType: true },
        }),
        this.prisma.file.count({
          where: {
            organizationId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      const filesByType: Record<string, number> = {};
      filesByTypeResult.forEach(result => {
        filesByType[result.mimeType] = result._count.mimeType;
      });

      const stats = {
        totalFiles,
        totalSize: totalSizeResult._sum.size || 0,
        filesByType,
        recentUploads,
      };

      logger.info('File statistics fetched successfully', { 
        organizationId,
        requesterId,
        stats 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch file statistics', { error, organizationId, requesterId });
      throw error;
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService(
  require('../lib/database').db
);
