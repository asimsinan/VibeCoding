/**
 * AllergenInfo Model
 * Contains allergen warnings and severity levels for common allergens
 * FR-005: Extract and display allergen information
 */

export type AllergenSeverity = 'high' | 'medium' | 'low';

export class AllergenInfo {
  public name: string;
  public severity: AllergenSeverity;
  public description: string;

  constructor(
    name: string,
    severity: AllergenSeverity = 'medium',
    description: string = ''
  ) {
    this.name = this.validateName(name);
    this.severity = this.validateSeverity(severity);
    this.description = description.trim();
  }

  // Validation methods
  private validateName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Allergen name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Allergen name cannot exceed 100 characters');
    }
    return name.trim();
  }

  private validateSeverity(severity: string): AllergenSeverity {
    const validSeverities: AllergenSeverity[] = ['high', 'medium', 'low'];
    if (!validSeverities.includes(severity as AllergenSeverity)) {
      throw new Error(`Severity must be one of: ${validSeverities.join(', ')}`);
    }
    return severity as AllergenSeverity;
  }

  // Business logic methods
  public isHighSeverity(): boolean {
    return this.severity === 'high';
  }

  public isMediumSeverity(): boolean {
    return this.severity === 'medium';
  }

  public isLowSeverity(): boolean {
    return this.severity === 'low';
  }

  public requiresWarning(): boolean {
    return this.severity === 'high' || this.severity === 'medium';
  }

  // Severity Scoring
  public getSeverityScore(): number {
    const scores: Record<AllergenSeverity, number> = {
      high: 10,
      medium: 5,
      low: 1,
    };
    return scores[this.severity];
  }

  public requiresImmediateWarning(): boolean {
    return this.severity === 'high';
  }

  // User Restriction Matching
  public matchesUserRestriction(userRestrictions: string[]): boolean {
    if (!userRestrictions || userRestrictions.length === 0) {
      return false;
    }

    const allergenLower = this.name.toLowerCase();

    for (const restriction of userRestrictions) {
      if (this.matchesRestriction(restriction, allergenLower)) {
        return true;
      }
    }

    return false;
  }

  // Extracted matching logic for cleaner code organization
  private matchesRestriction(restriction: string, allergenLower: string): boolean {
    const restrictionLower = this.normalizeRestriction(restriction);
    const allergenGroups = this.getAllergenGroups();

    const matchedGroup = this.findMatchingGroup(restrictionLower, allergenGroups);
    
    if (matchedGroup) {
      return this.allergenMatchesGroup(allergenLower, allergenGroups[matchedGroup]);
    }

    return this.matchesDirectName(restrictionLower, allergenLower);
  }

  private normalizeRestriction(restriction: string): string {
    return restriction.toLowerCase().replace(/-/g, ' ').trim();
  }

  private getAllergenGroups(): Record<string, string[]> {
    return {
      'gluten': ['gluten', 'wheat', 'barley', 'rye'],
      'dairy': ['dairy', 'milk', 'cheese', 'butter', 'lactose'],
      'nuts': ['nuts', 'peanuts', 'almond', 'walnut', 'cashew', 'hazelnut', 'pecan'],
      'soy': ['soy', 'soya'],
      'eggs': ['egg', 'eggs'],
      'fish': ['fish', 'seafood', 'salmon', 'tuna'],
      'shellfish': ['shellfish', 'shrimp', 'crab', 'lobster', 'prawn'],
    };
  }

  private findMatchingGroup(restrictionLower: string, allergenGroups: Record<string, string[]>): string | null {
    for (const [group, keywords] of Object.entries(allergenGroups)) {
      if (restrictionLower.includes(group) || keywords.some(k => restrictionLower.includes(k))) {
        return group;
      }
    }
    return null;
  }

  private allergenMatchesGroup(allergenLower: string, groupKeywords: string[]): boolean {
    return groupKeywords.some(k => allergenLower.includes(k.toLowerCase()));
  }

  private matchesDirectName(restrictionLower: string, allergenLower: string): boolean {
    if (!restrictionLower.includes(allergenLower) && !allergenLower.includes(restrictionLower)) {
      return false;
    }

    const restrictionWords = restrictionLower.split(/\s+/);
    const allergenWords = allergenLower.split(/\s+/);
    
    return restrictionWords.some(rw => allergenWords.includes(rw)) ||
           allergenWords.some(aw => restrictionWords.includes(aw));
  }

  // Allergen Comparison
  public isMoreSevereThan(other: AllergenInfo): boolean {
    return this.getSeverityScore() > other.getSeverityScore();
  }

  public isCommonAllergen(): boolean {
    const commonAllergens = [
      'peanuts', 'tree nuts', 'milk', 'dairy', 'eggs', 'soy', 'wheat', 
      'gluten', 'fish', 'shellfish', 'sesame'
    ];
    return commonAllergens.some(ca => this.name.toLowerCase().includes(ca.toLowerCase()));
  }

  // Allergen Grouping
  public getGroup(): string {
    const nameLower = this.name.toLowerCase();
    
    if (nameLower.includes('milk') || nameLower.includes('dairy') || nameLower.includes('cheese') || nameLower.includes('butter')) {
      return 'dairy';
    }
    if (nameLower.includes('peanut') || nameLower.includes('nut') || nameLower.includes('almond') || nameLower.includes('walnut')) {
      return 'nuts';
    }
    if (nameLower.includes('gluten') || nameLower.includes('wheat') || nameLower.includes('barley') || nameLower.includes('rye')) {
      return 'gluten';
    }
    if (nameLower.includes('soy') || nameLower.includes('soya')) {
      return 'soy';
    }
    if (nameLower.includes('egg')) {
      return 'eggs';
    }
    if (nameLower.includes('fish') || nameLower.includes('shellfish')) {
      return 'seafood';
    }
    
    return 'other';
  }

  public static groupByType(allergens: AllergenInfo[]): Record<string, AllergenInfo[]> {
    const groups: Record<string, AllergenInfo[]> = {};
    
    for (const allergen of allergens) {
      const group = allergen.getGroup();
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(allergen);
    }
    
    return groups;
  }

  // Serialization methods
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      severity: this.severity,
      description: this.description,
    };
  }

  public static fromJSON(data: Record<string, unknown>): AllergenInfo {
    return new AllergenInfo(
      data.name as string,
      data.severity as AllergenSeverity,
      data.description as string
    );
  }
}

