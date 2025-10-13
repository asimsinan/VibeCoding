import { NextRequest, NextResponse } from 'next/server';
import { emailNotificationService } from '@/services/email-notification.service';
import { withAuth } from '@/lib/middleware';
import { UserRole } from '@/generated/prisma';
import { z } from 'zod';

const SendEmailSchema = z.object({
  to: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
  })).min(1, 'At least one recipient is required'),
  cc: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
  })).optional(),
  bcc: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
  })).optional(),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().default(''),
  text: z.string().default(''),
}).refine(data => data.html || data.text, {
  message: 'Either HTML or text content is required',
});

const SendEventNotificationSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  userId: z.string().min(1, 'User ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  data: z.record(z.any()).optional(),
});

const SendBulkNotificationsSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  data: z.record(z.any()).optional(),
});

const GetNotificationsSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  pageSize: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/notifications - Get notification history
export const GET = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const { searchParams } = new URL(req.url);
      const organizationId = searchParams.get('organizationId');
      const validatedParams = GetNotificationsSchema.parse(Object.fromEntries(searchParams));

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      const { page, pageSize } = validatedParams;

      const notifications = await emailNotificationService.getNotificationHistory(
        organizationId,
        authContext.user.id,
        page,
        pageSize
      );

      return NextResponse.json(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch notifications' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN] }
);

// POST /api/notifications - Send email notification
export const POST = withAuth(
  async (req: NextRequest, authContext) => {
    try {
      const body = await req.json();
      
      // Determine the type of notification based on the request body
      if (body.eventType && body.userId) {
        // Event notification
        const validatedData = SendEventNotificationSchema.parse(body);
        const result = await emailNotificationService.sendEventNotification(
          {
            type: validatedData.eventType,
            userId: validatedData.userId,
            organizationId: validatedData.organizationId,
            data: validatedData.data || {},
          },
          authContext.user.id
        );
        return NextResponse.json(result, { status: 201 });
      } else if (body.eventType && body.userIds) {
        // Bulk notifications
        const validatedData = SendBulkNotificationsSchema.parse(body);
        const result = await emailNotificationService.sendBulkNotifications(
          validatedData.eventType,
          validatedData.userIds,
          validatedData.organizationId,
          validatedData.data || {},
          authContext.user.id
        );
        return NextResponse.json(result, { status: 201 });
      } else {
        // Regular email notification
        const validatedData = SendEmailSchema.parse(body);
        const result = await emailNotificationService.sendEmail(
          validatedData,
          authContext.user.id
        );
        return NextResponse.json(result, { status: 201 });
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to send notification' },
        { status: error.statusCode || 500 }
      );
    }
  },
  { requiredRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR] }
);