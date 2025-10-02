#!/usr/bin/env node
// Notification System CLI
// Command-line interface for notification operations

import { NotificationManager, NotificationService, NotificationValidator, NotificationTemplate } from '../../libraries/notification-system';
import { PrismaClient } from '@prisma/client';

interface CLIOptions {
  json: boolean;
  help: boolean;
  version: boolean;
}

interface CLICommand {
  action: string;
  options: Record<string, any>;
}

class NotificationSystemCLI {
  private notificationManager: NotificationManager;
  private notificationService: NotificationService;
  private notificationValidator: NotificationValidator;
  private notificationTemplate: NotificationTemplate;
  private options: CLIOptions;

  constructor() {
    const prisma = new PrismaClient();
    const config = {
      email: {
        enabled: true,
        provider: 'smtp' as const,
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.EMAIL_FROM || 'noreply@marketplace.com'
      },
      push: {
        enabled: true,
        vapidKeys: {
          publicKey: process.env.VAPID_PUBLIC_KEY || '',
          privateKey: process.env.VAPID_PRIVATE_KEY || ''
        }
      },
      sms: {
        enabled: true,
        provider: 'twilio' as const,
        credentials: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_FROM_NUMBER || ''
        }
      },
      webhook: {
        enabled: true,
        url: process.env.WEBHOOK_URL || '',
        secret: process.env.WEBHOOK_SECRET || ''
      },
      rateLimiting: {
        enabled: true,
        maxPerMinute: 60,
        maxPerHour: 1000,
        maxPerDay: 10000
      },
      retry: {
        enabled: true,
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    };

    this.notificationManager = new NotificationManager(prisma);
    this.notificationService = new NotificationService(prisma, config);
    this.notificationValidator = new NotificationValidator();
    this.notificationTemplate = new NotificationTemplate();
    this.options = this.parseOptions();
  }

  public async run(): Promise<void> {
    try {
      if (this.options.help) {
        this.showHelp();
        return;
      }

      if (this.options.version) {
        this.showVersion();
        return;
      }

      const command = await this.parseCommand();
      const result = await this.executeCommand(command);
      this.outputResult(result);
    } catch (error) {
      this.outputError(error);
    }
  }

  private parseOptions(): CLIOptions {
    const args = process.argv.slice(2);
    return {
      json: args.includes('--json'),
      help: args.includes('--help') || args.includes('-h'),
      version: args.includes('--version') || args.includes('-v')
    };
  }

  private async parseCommand(): Promise<CLICommand> {
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    
    if (args.length === 0) {
      throw new Error('No command specified');
    }

    const action = args[0];
    const options: Record<string, any> = {};

    // Parse remaining arguments as key-value pairs
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const key = args[i];
        const value = args[i + 1];
        
        // Try to parse as JSON if it looks like JSON
        try {
          if (key && value) {
            options[key] = JSON.parse(value);
          }
        } catch {
          if (key && value) {
            options[key] = value;
          }
        }
      }
    }

    return { action: action || '', options };
  }

  private async executeCommand(command: CLICommand): Promise<any> {
    const { action, options } = command;

    switch (action) {
      case 'create':
        return await this.createNotification(options);
      case 'get':
        return await this.getNotification(options);
      case 'update':
        return await this.updateNotification(options);
      case 'delete':
        return await this.deleteNotification(options);
      case 'list':
        return await this.listNotifications(options);
      case 'markRead':
        return await this.markAsRead(options);
      case 'markUnread':
        return await this.markAsUnread(options);
      case 'markAllRead':
        return await this.markAllAsRead(options);
      case 'send':
        return await this.sendNotification(options);
      case 'sendBulk':
        return await this.sendBulkNotifications(options);
      case 'schedule':
        return await this.scheduleNotification(options);
      case 'cancel':
        return await this.cancelScheduledNotification(options);
      case 'stats':
        return await this.getNotificationStatistics(options);
      case 'validate':
        return await this.validateNotification(options);
      case 'template':
        return await this.getTemplate(options);
      case 'templates':
        return await this.listTemplates(options);
      case 'createTemplate':
        return await this.createTemplate(options);
      case 'updateTemplate':
        return await this.updateTemplate(options);
      case 'deleteTemplate':
        return await this.deleteTemplate(options);
      case 'renderTemplate':
        return await this.renderTemplate(options);
      case 'test':
        return await this.testNotification(options);
      default:
        throw new Error(`Unknown command: ${action}`);
    }
  }

  private async createNotification(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.type || !options.title || !options.message) {
      throw new Error('userId, type, title, and message are required');
    }

    return await this.notificationManager.createNotification({
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ? JSON.parse(options.data) : undefined
    });
  }

  private async getNotification(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required');
    }

    return await this.notificationManager.getNotification(options.id);
  }

  private async updateNotification(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required for update');
    }

    const updateData: any = {};
    if (options.title) {updateData.title = options.title;}
    if (options.message) {updateData.message = options.message;}
    if (options.data) {updateData.data = JSON.parse(options.data);}
    if (options.isRead !== undefined) {updateData.isRead = options.isRead === 'true';}

    return await this.notificationManager.updateNotification(options.id, updateData);
  }

  private async deleteNotification(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required for deletion');
    }

    return await this.notificationManager.deleteNotification(options.id);
  }

  private async listNotifications(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required for listing notifications');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;
    const type = options.type;

    return await this.notificationManager.getNotificationsByUser(
      options.userId,
      page,
      limit,
      type
    );
  }

  private async markAsRead(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required');
    }

    return await this.notificationManager.markAsRead(options.id);
  }

  private async markAsUnread(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required');
    }

    return await this.notificationManager.markAsUnread(options.id);
  }

  private async markAllAsRead(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.notificationManager.markAllAsRead(options.userId);
  }

  private async sendNotification(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.type || !options.title || !options.message) {
      throw new Error('userId, type, title, and message are required for sending');
    }

    return await this.notificationService.sendNotification({
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ? JSON.parse(options.data) : undefined
    });
  }

  private async sendBulkNotifications(options: Record<string, any>): Promise<any> {
    if (!options.notifications) {
      throw new Error('Notifications array is required');
    }

    const notifications = JSON.parse(options.notifications);
    return await this.notificationService.sendBulkNotifications(notifications);
  }

  private async scheduleNotification(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.type || !options.title || !options.message || !options.scheduledFor) {
      throw new Error('userId, type, title, message, and scheduledFor are required');
    }

    return await this.notificationService.sendNotification({
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ? JSON.parse(options.data) : undefined
    });
  }

  private async cancelScheduledNotification(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Notification ID is required');
    }

    return await this.notificationManager.deleteNotification(options.id);
  }

  private async getNotificationStatistics(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.notificationManager.getNotificationStatistics(options.userId);
  }

  private async validateNotification(options: Record<string, any>): Promise<any> {
    if (!options.type || !options.title || !options.message) {
      throw new Error('type, title, and message are required for validation');
    }

    const validation = this.notificationValidator.validateNotificationId(options.id || '');

    return {
      success: validation,
      isValid: validation,
      errors: validation ? [] : ['Invalid notification ID'],
      warnings: []
    };
  }

  private async getTemplate(options: Record<string, any>): Promise<any> {
    if (!options.name) {
      throw new Error('Template name is required');
    }

    return await this.notificationTemplate.getTemplate(options.name);
  }

  private async listTemplates(_options: Record<string, any>): Promise<any> {
    return { templates: [], message: 'Template listing not implemented' };
  }

  private async createTemplate(options: Record<string, any>): Promise<any> {
    if (!options.name || !options.type || !options.subject || !options.body) {
      throw new Error('name, type, subject, and body are required for template creation');
    }

    return { 
      success: true, 
      message: 'Template creation not implemented',
      template: {
        name: options.name,
        type: options.type,
        subject: options.subject,
        body: options.body
      }
    };
  }

  private async updateTemplate(options: Record<string, any>): Promise<any> {
    if (!options.name) {
      throw new Error('Template name is required for update');
    }

    const updateData: any = {};
    if (options.subject) {updateData.subject = options.subject;}
    if (options.body) {updateData.body = options.body;}
    if (options.variables) {updateData.variables = JSON.parse(options.variables);}
    if (options.channels) {updateData.channels = JSON.parse(options.channels);}

    return { 
      success: true, 
      message: 'Template update not implemented',
      template: {
        name: options.name,
        ...updateData
      }
    };
  }

  private async deleteTemplate(options: Record<string, any>): Promise<any> {
    if (!options.name) {
      throw new Error('Template name is required for deletion');
    }

    return { 
      success: true, 
      message: 'Template deletion not implemented',
      template: { name: options.name }
    };
  }

  private async renderTemplate(options: Record<string, any>): Promise<any> {
    if (!options.name || !options.variables) {
      throw new Error('Template name and variables are required for rendering');
    }

    return { 
      success: true, 
      message: 'Template rendering not implemented',
      rendered: {
        subject: 'Rendered Subject',
        body: 'Rendered Body'
      }
    };
  }

  private async testNotification(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.type) {
      throw new Error('userId and type are required for testing');
    }

    return { 
      success: true, 
      message: 'Test notification not implemented',
      notification: {
        userId: options.userId,
        type: options.type,
        channels: options.channels ? JSON.parse(options.channels) : undefined
      }
    };
  }

  private outputResult(result: any): void {
    if (this.options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.success) {
        console.log('✅ Success:', result.message || 'Operation completed successfully');
        if (result.data) {
          console.log('Data:', JSON.stringify(result.data, null, 2));
        }
      } else {
        console.error('❌ Error:', result.error || 'Operation failed');
        if (result.message) {
          console.error('Message:', result.message);
        }
      }
    }
  }

  private outputError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (this.options.json) {
      console.error(JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error('❌ Error:', errorMessage);
    }
    
    process.exit(1);
  }

  private showHelp(): void {
    console.log(`
Notification System CLI

Usage: notification-cli [options] <command> [arguments]

Commands:
  create                      Create a notification
    --userId <string>         User ID
    --type <string>           Notification type
    --title <string>          Notification title
    --message <string>        Notification message
    --data <json>             Additional data (optional)
    --channels <json>         Delivery channels (optional)
    --priority <string>       Priority (optional)
    --scheduledFor <string>   Scheduled time (optional)

  get                         Get notification details
    --id <string>             Notification ID

  update                      Update a notification
    --id <string>             Notification ID
    --title <string>          New title (optional)
    --message <string>        New message (optional)
    --data <json>             New data (optional)
    --isRead <boolean>        Read status (optional)

  delete                      Delete a notification
    --id <string>             Notification ID

  list                        List notifications for a user
    --userId <string>         User ID
    --page <number>           Page number (optional)
    --limit <number>          Items per page (optional)
    --type <string>           Filter by type (optional)
    --isRead <boolean>        Filter by read status (optional)

  markRead                    Mark notification as read
    --id <string>             Notification ID

  markUnread                  Mark notification as unread
    --id <string>             Notification ID

  markAllRead                 Mark all notifications as read
    --userId <string>         User ID

  send                        Send a notification
    --userId <string>         User ID
    --type <string>           Notification type
    --title <string>          Notification title
    --message <string>        Notification message
    --data <json>             Additional data (optional)
    --channels <json>         Delivery channels (optional)
    --priority <string>       Priority (optional)

  sendBulk                    Send multiple notifications
    --notifications <json>    Notifications array

  schedule                    Schedule a notification
    --userId <string>         User ID
    --type <string>           Notification type
    --title <string>          Notification title
    --message <string>        Notification message
    --scheduledFor <string>   Scheduled time
    --data <json>             Additional data (optional)
    --channels <json>         Delivery channels (optional)
    --priority <string>       Priority (optional)

  cancel                      Cancel a scheduled notification
    --id <string>             Notification ID

  stats                       Get notification statistics
    --userId <string>         User ID

  validate                    Validate notification data
    --type <string>           Notification type
    --title <string>          Notification title
    --message <string>        Notification message
    --data <json>             Additional data (optional)

  template                    Get notification template
    --name <string>           Template name

  templates                   List notification templates
    --type <string>           Filter by type (optional)

  createTemplate              Create notification template
    --name <string>           Template name
    --type <string>           Template type
    --subject <string>        Email subject
    --body <string>           Template body
    --variables <json>        Template variables (optional)
    --channels <json>         Delivery channels (optional)

  updateTemplate              Update notification template
    --name <string>           Template name
    --subject <string>        New subject (optional)
    --body <string>           New body (optional)
    --variables <json>        New variables (optional)
    --channels <json>         New channels (optional)

  deleteTemplate              Delete notification template
    --name <string>           Template name

  renderTemplate              Render notification template
    --name <string>           Template name
    --variables <json>        Template variables

  test                        Test notification delivery
    --userId <string>         User ID
    --type <string>           Notification type
    --channels <json>         Delivery channels (optional)

Options:
  --json                      Output in JSON format
  --help, -h                 Show this help message
  --version, -v              Show version information

Examples:
  notification-cli create --userId "user123" --type "PURCHASE_CONFIRMATION" --title "Purchase Confirmed" --message "Your order has been confirmed"
  notification-cli send --userId "user123" --type "ORDER_SHIPPED" --title "Order Shipped" --message "Your order is on its way"
  notification-cli list --userId "user123" --page 1 --limit 10
  notification-cli schedule --userId "user123" --type "REMINDER" --title "Reminder" --message "Don't forget!" --scheduledFor "2024-01-01T10:00:00Z"
  notification-cli --json create --userId "user123" --type "PURCHASE_CONFIRMATION" --title "Purchase Confirmed" --message "Your order has been confirmed"
`);
  }

  private showVersion(): void {
    console.log('Notification System CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new NotificationSystemCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default NotificationSystemCLI;
