import { PrismaClient, Prisma } from '../generated/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../lib/errors';
import logger from '../lib/monitoring';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailData {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface NotificationEvent {
  type: string;
  userId: string;
  organizationId: string;
  data: Record<string, any>;
}

export class EmailNotificationService {
  private readonly templates: Map<string, EmailTemplate> = new Map();

  constructor(private prisma: PrismaClient) {
    this.initializeTemplates();
  }

  /**
   * Send email notification
   * @param emailData - Email data
   * @param sentBy - User ID who sent the email
   * @returns Success status
   */
  async sendEmail(
    emailData: EmailData,
    sentBy: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      logger.info('Sending email notification', { 
        to: emailData.to.map(r => r.email),
        subject: emailData.subject,
        sentBy 
      });

      // Verify sender permissions
      const sender = await this.prisma.user.findUnique({
        where: { id: sentBy },
        select: { role: true, organizationId: true },
      });

      if (!sender) {
        throw new ForbiddenError('Sender not found');
      }

      // Validate email data
      this.validateEmailData(emailData);

      // In a real implementation, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Nodemailer with SMTP
      
      // For now, we'll simulate sending the email
      const messageId = this.simulateEmailSending(emailData);

      // Log the email in the database
      await this.logEmailNotification(emailData, sentBy, messageId);

      logger.info('Email sent successfully', { 
        messageId,
        sentBy 
      });

      return { success: true, messageId };
    } catch (error) {
      logger.error('Failed to send email', { error, sentBy });
      throw error;
    }
  }

  /**
   * Send notification for a specific event
   * @param event - Notification event
   * @param sentBy - User ID who triggered the notification
   * @returns Success status
   */
  async sendEventNotification(
    event: NotificationEvent,
    sentBy: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      logger.info('Sending event notification', { 
        eventType: event.type,
        userId: event.userId,
        organizationId: event.organizationId,
        sentBy 
      });

      // Get event template
      const template = this.templates.get(event.type);
      if (!template) {
        throw new ValidationError(`No template found for event type: ${event.type}`, {
          event: [`Event type ${event.type} is not supported`],
        });
      }

      // Get user and organization data
      const [user, organization] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: event.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        }),
        this.prisma.organization.findUnique({
          where: { id: event.organizationId },
          select: {
            id: true,
            name: true,
            domain: true,
          },
        }),
      ]);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      // Render template with data
      const renderedTemplate = this.renderTemplate(template, {
        user,
        organization,
        ...event.data,
      });

      // Create email data
      const emailData: EmailData = {
        to: [{ email: user.email, name: user.name || 'User' }],
        subject: renderedTemplate.subject,
        html: renderedTemplate.html,
        text: renderedTemplate.text,
      };

      // Send email
      return await this.sendEmail(emailData, sentBy);
    } catch (error) {
      logger.error('Failed to send event notification', { error, event, sentBy });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   * @param eventType - Event type
   * @param userIds - Array of user IDs
   * @param organizationId - Organization ID
   * @param eventData - Event data
   * @param sentBy - User ID who triggered the notifications
   * @returns Success status
   */
  async sendBulkNotifications(
    eventType: string,
    userIds: string[],
    organizationId: string,
    eventData: Record<string, any>,
    sentBy: string
  ): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
    try {
      logger.info('Sending bulk notifications', { 
        eventType,
        userIdCount: userIds.length,
        organizationId,
        sentBy 
      });

      let sentCount = 0;
      let failedCount = 0;

      // Process notifications in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          try {
            await this.sendEventNotification(
              {
                type: eventType,
                userId,
                organizationId,
                data: eventData,
              },
              sentBy
            );
            sentCount++;
          } catch (error) {
            logger.error('Failed to send notification to user', { userId, error });
            failedCount++;
          }
        });

        await Promise.all(batchPromises);
      }

      logger.info('Bulk notifications completed', { 
        sentCount,
        failedCount,
        sentBy 
      });

      return { success: true, sentCount, failedCount };
    } catch (error) {
      logger.error('Failed to send bulk notifications', { error, eventType, sentBy });
      throw error;
    }
  }

  /**
   * Get notification history
   * @param organizationId - Organization ID
   * @param requesterId - User ID requesting the history
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Paginated notification history
   */
  async getNotificationHistory(
    organizationId: string,
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
      logger.info('Fetching notification history', { organizationId, requesterId, page, pageSize });

      // Check permissions
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true, organizationId: true },
      });

      if (!requester) {
        throw new ForbiddenError('Requester not found');
      }

      // Users can only view notifications from their organization
      if (
        requester.role !== 'ADMIN' &&
        requester.organizationId !== organizationId
      ) {
        throw new ForbiddenError('Insufficient permissions to view notifications for this organization');
      }

      // Only admins can view notification history
      if (requester.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can view notification history');
      }

      // TODO: Implement notification history when notification model is added to schema
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };

      logger.info('Notification history fetched successfully', { 
        organizationId,
        requesterId,
        count: 0,
        total: 0
      });

      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    } catch (error) {
      logger.error('Failed to fetch notification history', { error, organizationId, requesterId });
      throw error;
    }
  }

  /**
   * Initialize email templates
   */
  private initializeTemplates(): void {
    // Welcome email template
    this.templates.set('user_welcome', {
      subject: 'Welcome to {{organization.name}} Learning Management System',
      html: `
        <h1>Welcome to {{organization.name}}!</h1>
        <p>Hello {{user.name}},</p>
        <p>Welcome to our Learning Management System. Your account has been created successfully.</p>
        <p>You can now access your courses and start learning.</p>
        <p>Best regards,<br>The {{organization.name}} Team</p>
      `,
      text: `
        Welcome to {{organization.name}}!
        
        Hello {{user.name}},
        
        Welcome to our Learning Management System. Your account has been created successfully.
        
        You can now access your courses and start learning.
        
        Best regards,
        The {{organization.name}} Team
      `,
    });

    // Course enrollment template
    this.templates.set('course_enrollment', {
      subject: 'You have been enrolled in {{course.title}}',
      html: `
        <h1>Course Enrollment Confirmation</h1>
        <p>Hello {{user.name}},</p>
        <p>You have been successfully enrolled in the course: <strong>{{course.title}}</strong></p>
        <p>Course Description: {{course.description}}</p>
        <p>You can now access the course materials and start learning.</p>
        <p>Best regards,<br>The {{organization.name}} Team</p>
      `,
      text: `
        Course Enrollment Confirmation
        
        Hello {{user.name}},
        
        You have been successfully enrolled in the course: {{course.title}}
        
        Course Description: {{course.description}}
        
        You can now access the course materials and start learning.
        
        Best regards,
        The {{organization.name}} Team
      `,
    });

    // Quiz completion template
    this.templates.set('quiz_completion', {
      subject: 'Quiz Results: {{quiz.title}}',
      html: `
        <h1>Quiz Results</h1>
        <p>Hello {{user.name}},</p>
        <p>You have completed the quiz: <strong>{{quiz.title}}</strong></p>
        <p>Your Score: <strong>{{score}}%</strong></p>
        <p>Status: <strong>{{passed ? 'Passed' : 'Failed'}}</strong></p>
        <p>{{feedback}}</p>
        <p>Best regards,<br>The {{organization.name}} Team</p>
      `,
      text: `
        Quiz Results
        
        Hello {{user.name}},
        
        You have completed the quiz: {{quiz.title}}
        
        Your Score: {{score}}%
        Status: {{passed ? 'Passed' : 'Failed'}}
        
        {{feedback}}
        
        Best regards,
        The {{organization.name}} Team
      `,
    });

    // Course completion template
    this.templates.set('course_completion', {
      subject: 'Congratulations! You have completed {{course.title}}',
      html: `
        <h1>Course Completion Certificate</h1>
        <p>Hello {{user.name}},</p>
        <p>Congratulations! You have successfully completed the course: <strong>{{course.title}}</strong></p>
        <p>Completion Date: {{completionDate}}</p>
        <p>You can now download your certificate and continue with other courses.</p>
        <p>Best regards,<br>The {{organization.name}} Team</p>
      `,
      text: `
        Course Completion Certificate
        
        Hello {{user.name}},
        
        Congratulations! You have successfully completed the course: {{course.title}}
        
        Completion Date: {{completionDate}}
        
        You can now download your certificate and continue with other courses.
        
        Best regards,
        The {{organization.name}} Team
      `,
    });

    // Password reset template
    this.templates.set('password_reset', {
      subject: 'Password Reset Request - {{organization.name}}',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hello {{user.name}},</p>
        <p>You have requested to reset your password for your {{organization.name}} account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The {{organization.name}} Team</p>
      `,
      text: `
        Password Reset Request
        
        Hello {{user.name}},
        
        You have requested to reset your password for your {{organization.name}} account.
        
        Click the link below to reset your password:
        {{resetLink}}
        
        This link will expire in 24 hours.
        
        If you did not request this password reset, please ignore this email.
        
        Best regards,
        The {{organization.name}} Team
      `,
    });
  }

  /**
   * Render template with data
   * @param template - Email template
   * @param data - Template data
   * @returns Rendered template
   */
  private renderTemplate(template: EmailTemplate, data: Record<string, any>): EmailTemplate {
    const renderString = (str: string): string => {
      return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = this.getNestedValue(data, key.trim());
        return value !== undefined ? String(value) : match;
      });
    };

    return {
      subject: renderString(template.subject),
      html: renderString(template.html),
      text: renderString(template.text),
    };
  }

  /**
   * Get nested value from object
   * @param obj - Object
   * @param path - Path to value
   * @returns Value or undefined
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Validate email data
   * @param emailData - Email data
   */
  private validateEmailData(emailData: EmailData): void {
    if (!emailData.to || emailData.to.length === 0) {
      throw new ValidationError('Recipients are required', {
        to: ['At least one recipient is required'],
      });
    }

    if (!emailData.subject || emailData.subject.trim().length === 0) {
      throw new ValidationError('Subject is required', {
        subject: ['Email subject cannot be empty'],
      });
    }

    if (!emailData.html && !emailData.text) {
      throw new ValidationError('Email content is required', {
        content: ['Either HTML or text content is required'],
      });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of emailData.to) {
      if (!emailRegex.test(recipient.email)) {
        throw new ValidationError(`Invalid email address: ${recipient.email}`, {
          to: [`Invalid email address: ${recipient.email}`],
        });
      }
    }
  }

  /**
   * Simulate email sending (replace with real email service)
   * @param emailData - Email data
   * @returns Message ID
   */
  private simulateEmailSending(emailData: EmailData): string {
    // In a real implementation, this would integrate with an email service
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Email sent (simulated)', {
      messageId,
      to: emailData.to.map(r => r.email),
      subject: emailData.subject,
    });

    return messageId;
  }

  /**
   * Log email notification in database
   * @param emailData - Email data
   * @param sentBy - User ID who sent the email
   * @param messageId - Message ID
   */
  private async logEmailNotification(
    emailData: EmailData,
    sentBy: string,
    messageId: string
  ): Promise<void> {
    try {
      // TODO: Implement email notification logging when emailNotification model is added to schema
      logger.info('Email notification logging skipped - model not available', { 
        messageId, 
        sentBy 
      });
    } catch (error) {
      logger.error('Failed to log email notification', { error, messageId });
      // Don't throw error here as email was sent successfully
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService(
  require('../lib/database').db
);
