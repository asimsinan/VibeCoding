#!/usr/bin/env node
// User Authentication CLI
// Command-line interface for user authentication operations

import { UserManager, AuthService, UserValidator, SessionManager } from '../../libraries/user-authentication';
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

class UserAuthenticationCLI {
  private userManager: UserManager;
  private authService: AuthService;
  private validator: UserValidator;
  // @ts-ignore - Reserved for future use
  private _sessionManager: SessionManager;
  private options: CLIOptions;

  constructor() {
    const prisma = new PrismaClient();
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    
    this.userManager = new UserManager(prisma);
    this.authService = new AuthService(prisma, jwtSecret);
    this.validator = new UserValidator({
      passwordPolicy: {
        minLength: 8,
        maxLength: 100,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      sessionConfig: {
        maxAge: 24 * 60 * 60 * 1000,
        refreshThreshold: 60 * 60 * 1000
      },
      rateLimiting: {
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000
      }
    });
    this._sessionManager = new SessionManager(prisma, jwtSecret);
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
        if (key && value) {
          try {
            options[key] = JSON.parse(value);
          } catch {
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
      case 'register':
        return await this.registerUser(options);
      case 'login':
        return await this.loginUser(options);
      case 'logout':
        return await this.logoutUser(options);
      case 'profile':
        return await this.getUserProfile(options);
      case 'update-profile':
        return await this.updateUserProfile(options);
      case 'update-preferences':
        return await this.updateUserPreferences(options);
      case 'change-password':
        return await this.changePassword(options);
      case 'reset-password':
        return await this.resetPassword(options);
      case 'verify-token':
        return await this.verifyToken(options);
      case 'refresh-token':
        return await this.refreshToken(options);
      case 'validate':
        return await this.validateUser(options);
      case 'activate':
        return await this.activateUser(options);
      case 'deactivate':
        return await this.deactivateUser(options);
      default:
        throw new Error(`Unknown command: ${action}`);
    }
  }

  private async registerUser(options: Record<string, any>): Promise<any> {
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
    const missingFields = requiredFields.filter(field => !(field in options));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return await this.userManager.createUser({
      username: options.username,
      email: options.email,
      password: options.password,
      firstName: options.firstName,
      lastName: options.lastName,
      bio: options.bio,
      location: options.location,
      phone: options.phone,
      avatar: options.avatar
    });
  }

  private async loginUser(options: Record<string, any>): Promise<any> {
    if (!options.email || !options.password) {
      throw new Error('Email and password are required for login');
    }

    return await this.authService.login({
      email: options.email,
      password: options.password
    });
  }

  private async logoutUser(options: Record<string, any>): Promise<any> {
    if (!options.token) {
      throw new Error('Token is required for logout');
    }

    return await this.authService.logout(options.token);
  }

  private async getUserProfile(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.userManager.getUserById(options.userId);
  }

  private async updateUserProfile(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    const updateData: any = {};
    if (options.firstName) {updateData.firstName = options.firstName;}
    if (options.lastName) {updateData.lastName = options.lastName;}
    if (options.bio !== undefined) {updateData.bio = options.bio;}
    if (options.location !== undefined) {updateData.location = options.location;}
    if (options.phone !== undefined) {updateData.phone = options.phone;}
    if (options.avatar !== undefined) {updateData.avatar = options.avatar;}

    return await this.userManager.updateUserProfile(options.userId, updateData);
  }

  private async updateUserPreferences(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    const preferences: any = {};
    if (options.email !== undefined) {preferences.email = options.email === 'true';}
    if (options.push !== undefined) {preferences.push = options.push === 'true';}
    if (options.sms !== undefined) {preferences.sms = options.sms === 'true';}
    if (options.transactionNotifications !== undefined) {preferences.transactionNotifications = options.transactionNotifications === 'true';}
    if (options.productNotifications !== undefined) {preferences.productNotifications = options.productNotifications === 'true';}
    if (options.orderNotifications !== undefined) {preferences.orderNotifications = options.orderNotifications === 'true';}
    if (options.systemNotifications !== undefined) {preferences.systemNotifications = options.systemNotifications === 'true';}

    return await this.userManager.updateUserPreferences(options.userId, preferences);
  }

  private async changePassword(options: Record<string, any>): Promise<any> {
    if (!options.userId || !options.currentPassword || !options.newPassword) {
      throw new Error('User ID, current password, and new password are required');
    }

    return await this.authService.changePassword(options.userId, {
      currentPassword: options.currentPassword,
      newPassword: options.newPassword
    });
  }

  private async resetPassword(options: Record<string, any>): Promise<any> {
    if (!options.email) {
      throw new Error('Email is required for password reset');
    }

    return await this.authService.initiatePasswordReset({
      email: options.email
    });
  }

  private async verifyToken(options: Record<string, any>): Promise<any> {
    if (!options.token) {
      throw new Error('Token is required for verification');
    }

    return await this.authService.verifyToken(options.token);
  }

  private async refreshToken(options: Record<string, any>): Promise<any> {
    if (!options.token) {
      throw new Error('Token is required for refresh');
    }

    return await this.authService.refreshToken(options.token);
  }

  private async validateUser(options: Record<string, any>): Promise<any> {
    const validation = this.validator.validateCreateRequest({
      username: options.username || '',
      email: options.email || '',
      password: options.password || '',
      firstName: options.firstName || '',
      lastName: options.lastName || '',
      bio: options.bio,
      location: options.location,
      phone: options.phone,
      avatar: options.avatar
    });

    return {
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  private async activateUser(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.userManager.activateUser(options.userId);
  }

  private async deactivateUser(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.userManager.deactivateUser(options.userId);
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
User Authentication CLI

Usage: auth-cli [options] <command> [arguments]

Commands:
  register                   Register a new user
    --username <string>      Username
    --email <string>         Email address
    --password <string>      Password
    --firstName <string>     First name
    --lastName <string>      Last name
    --bio <string>           Bio (optional)
    --location <string>      Location (optional)
    --phone <string>         Phone number (optional)
    --avatar <string>        Avatar URL (optional)

  login                      Login user
    --email <string>         Email address
    --password <string>      Password

  logout                     Logout user
    --token <string>         JWT token

  profile                    Get user profile
    --userId <string>        User ID

  update-profile             Update user profile
    --userId <string>        User ID
    --firstName <string>     First name (optional)
    --lastName <string>      Last name (optional)
    --bio <string>           Bio (optional)
    --location <string>      Location (optional)
    --phone <string>         Phone number (optional)
    --avatar <string>        Avatar URL (optional)

  update-preferences         Update user preferences
    --userId <string>        User ID
    --email <boolean>        Email notifications (optional)
    --push <boolean>         Push notifications (optional)
    --sms <boolean>          SMS notifications (optional)
    --transactionNotifications <boolean> Transaction notifications (optional)
    --productNotifications <boolean> Product notifications (optional)
    --orderNotifications <boolean> Order notifications (optional)
    --systemNotifications <boolean> System notifications (optional)

  change-password            Change user password
    --userId <string>        User ID
    --currentPassword <string> Current password
    --newPassword <string>   New password

  reset-password             Initiate password reset
    --email <string>         Email address

  verify-token               Verify JWT token
    --token <string>         JWT token

  refresh-token              Refresh JWT token
    --token <string>         JWT token

  validate                   Validate user data
    --username <string>      Username
    --email <string>         Email address
    --password <string>      Password
    --firstName <string>     First name
    --lastName <string>      Last name

  activate                   Activate user account
    --userId <string>        User ID

  deactivate                 Deactivate user account
    --userId <string>        User ID

Options:
  --json                     Output in JSON format
  --help, -h                Show this help message
  --version, -v             Show version information

Examples:
  auth-cli register --username "john_doe" --email "john@example.com" --password "SecurePass123!" --firstName "John" --lastName "Doe"
  auth-cli login --email "john@example.com" --password "SecurePass123!"
  auth-cli profile --userId "user123"
  auth-cli --json register --username "jane_doe" --email "jane@example.com" --password "SecurePass123!" --firstName "Jane" --lastName "Doe"
`);
  }

  private showVersion(): void {
    console.log('User Authentication CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new UserAuthenticationCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default UserAuthenticationCLI;
