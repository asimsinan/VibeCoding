export class CampaignCore {
  /**
   * Calculate campaign progress percentage
   */
  calculateProgress(current: number, goal: number): number {
    if (goal <= 0) return 0;
    if (current <= 0) return 0;
    
    const progress = (current / goal) * 100;
    return Math.min(Math.round(progress * 100) / 100, 100);
  }

  /**
   * Calculate days remaining until deadline
   */
  calculateDaysRemaining(deadline: Date, now: Date = new Date()): number {
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  }

  /**
   * Check if campaign is active
   */
  isCampaignActive(status: string, deadline: Date, now: Date = new Date()): boolean {
    if (status !== 'ACTIVE') return false;
    return this.calculateDaysRemaining(deadline, now) > 0;
  }

  /**
   * Validate campaign goal amount
   */
  validateCampaignGoal(goal: number): boolean {
    return goal > 0 && goal <= 1000000; // Max $1M goal
  }

  /**
   * Validate campaign deadline
   */
  validateCampaignDeadline(deadline: Date, now: Date = new Date()): boolean {
    const daysDiff = this.calculateDaysRemaining(deadline, now);
    return daysDiff > 0 && daysDiff <= 365; // Max 1 year
  }

  /**
   * Calculate campaign statistics
   */
  calculateCampaignStats(donations: Array<{ amount: number; donorId: string }>) {
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const totalDonations = donations.length;
    const uniqueDonors = new Set(donations.map(d => d.donorId)).size;
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    return {
      totalAmount,
      totalDonations,
      uniqueDonors,
      averageDonation
    };
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Generate campaign slug from title
   */
  generateCampaignSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50) // Limit length
      .replace(/-$/, ''); // Remove trailing hyphen
  }
}
