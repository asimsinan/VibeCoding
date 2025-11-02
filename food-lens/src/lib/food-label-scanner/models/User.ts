/**
 * User Model
 * Represents app users with authentication details, preferences, and scan history
 * FR-009: Firebase Authentication implementation
 */

export interface UserPreferences {
  language: 'en' | 'tr';
  notifications: boolean;
  offlineMode: boolean;
  dietaryRestrictions: string[];
  isAdmin?: boolean;
  isPremium?: boolean;
}

export interface UserStats {
  totalScans: number;
  lastScanAt: Date | null;
}

export class User {
  public uid: string;
  public email: string;
  public displayName: string;
  public language: 'en' | 'tr';
  public dietaryRestrictions: string[];
  public createdAt: Date;
  public lastLoginAt: Date;
  public preferences: UserPreferences;
  public stats: UserStats;

  constructor(
    uid: string,
    email: string,
    displayName: string,
    language: 'en' | 'tr' = 'en',
    dietaryRestrictions: string[] = [],
    createdAt?: Date,
    lastLoginAt?: Date,
    preferences?: Partial<UserPreferences>,
    stats?: Partial<UserStats>
  ) {
    this.uid = this.validateUid(uid);
    this.email = this.validateEmail(email);
    this.displayName = this.validateDisplayName(displayName);
    this.language = this.validateLanguage(language);
    this.dietaryRestrictions = this.validateDietaryRestrictions(dietaryRestrictions);
    this.createdAt = createdAt || new Date();
    this.lastLoginAt = lastLoginAt || new Date();
    this.preferences = {
      language,
      notifications: preferences?.notifications ?? true,
      offlineMode: preferences?.offlineMode ?? true,
      dietaryRestrictions: this.dietaryRestrictions,
      ...preferences,
    };
    this.stats = {
      totalScans: stats?.totalScans ?? 0,
      lastScanAt: stats?.lastScanAt ?? null,
      ...stats,
    };
  }

  // Validation methods - using shared validators
  private validateUid(uid: string): string {
    const { Validators } = require('../utils/validation');
    return Validators.uid(uid);
  }

  private validateEmail(email: string): string {
    const { Validators } = require('../utils/validation');
    return Validators.email(email);
  }

  private validateDisplayName(displayName: string): string {
    const { Validators } = require('../utils/validation');
    return Validators.displayName(displayName);
  }

  private validateLanguage(language: string): 'en' | 'tr' {
    const { Validators } = require('../utils/validation');
    return Validators.language(language);
  }

  private validateDietaryRestrictions(restrictions: string[]): string[] {
    if (!Array.isArray(restrictions)) {
      throw new Error('Dietary restrictions must be an array');
    }
    return restrictions.filter(r => typeof r === 'string' && r.trim().length > 0);
  }

  // Business logic methods
  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  public incrementScanCount(): void {
    this.stats.totalScans += 1;
    this.stats.lastScanAt = new Date();
  }

  public addDietaryRestriction(restriction: string): void {
    if (!this.dietaryRestrictions.includes(restriction)) {
      this.dietaryRestrictions.push(restriction);
      this.preferences.dietaryRestrictions = this.dietaryRestrictions;
    }
  }

  public removeDietaryRestriction(restriction: string): void {
    this.dietaryRestrictions = this.dietaryRestrictions.filter(r => r !== restriction);
    this.preferences.dietaryRestrictions = this.dietaryRestrictions;
  }

  public updatePreferences(preferences: Partial<UserPreferences>): void {
    if (preferences.language) {
      this.language = this.validateLanguage(preferences.language);
      this.preferences.language = this.language;
    }
    if (preferences.notifications !== undefined) {
      this.preferences.notifications = preferences.notifications;
    }
    if (preferences.offlineMode !== undefined) {
      this.preferences.offlineMode = preferences.offlineMode;
    }
    if (preferences.dietaryRestrictions) {
      this.dietaryRestrictions = this.validateDietaryRestrictions(preferences.dietaryRestrictions);
      this.preferences.dietaryRestrictions = this.dietaryRestrictions;
    }
  }

  // Serialization methods
  public toJSON(): Record<string, unknown> {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      language: this.language,
      dietaryRestrictions: this.dietaryRestrictions,
      createdAt: this.createdAt.toISOString(),
      lastLoginAt: this.lastLoginAt.toISOString(),
      preferences: this.preferences,
      stats: {
        totalScans: this.stats.totalScans,
        lastScanAt: this.stats.lastScanAt?.toISOString() ?? null,
      },
    };
  }

  public static fromJSON(data: Record<string, unknown>): User {
    return new User(
      data.uid as string,
      data.email as string,
      data.displayName as string,
      data.language as 'en' | 'tr',
      data.dietaryRestrictions as string[],
      data.createdAt ? new Date(data.createdAt as string) : undefined,
      data.lastLoginAt ? new Date(data.lastLoginAt as string) : undefined,
      data.preferences as Partial<UserPreferences>,
      data.stats as Partial<UserStats>
    );
  }
}

