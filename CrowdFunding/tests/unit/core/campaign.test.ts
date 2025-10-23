import { CampaignCore } from '../../../src/lib/core/campaign';

describe('CampaignCore', () => {
  let campaignCore: CampaignCore;

  beforeEach(() => {
    campaignCore = new CampaignCore();
  });

  describe('calculateProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const goal = 10000;
      const current = 2500;
      
      const progress = campaignCore.calculateProgress(current, goal);
      
      expect(progress).toBe(25);
    });

    it('should return 0 when current is 0', () => {
      const goal = 10000;
      const current = 0;
      
      const progress = campaignCore.calculateProgress(current, goal);
      
      expect(progress).toBe(0);
    });

    it('should return 100 when current equals goal', () => {
      const goal = 10000;
      const current = 10000;
      
      const progress = campaignCore.calculateProgress(current, goal);
      
      expect(progress).toBe(100);
    });

    it('should return 100 when current exceeds goal', () => {
      const goal = 10000;
      const current = 15000;
      
      const progress = campaignCore.calculateProgress(current, goal);
      
      expect(progress).toBe(100);
    });

    it('should handle decimal values correctly', () => {
      const goal = 1000;
      const current = 333.33;
      
      const progress = campaignCore.calculateProgress(current, goal);
      
      expect(progress).toBeCloseTo(33.33, 2);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const deadline = new Date('2024-12-31');
      const now = new Date('2024-12-15');
      
      const daysRemaining = campaignCore.calculateDaysRemaining(deadline, now);
      
      expect(daysRemaining).toBe(16);
    });

    it('should return 0 when deadline has passed', () => {
      const deadline = new Date('2024-12-01');
      const now = new Date('2024-12-15');
      
      const daysRemaining = campaignCore.calculateDaysRemaining(deadline, now);
      
      expect(daysRemaining).toBe(0);
    });

    it('should return 0 when deadline is today', () => {
      const deadline = new Date('2024-12-15');
      const now = new Date('2024-12-15');
      
      const daysRemaining = campaignCore.calculateDaysRemaining(deadline, now);
      
      expect(daysRemaining).toBe(0);
    });
  });

  describe('isCampaignActive', () => {
    it('should return true for active campaign', () => {
      const deadline = new Date('2024-12-31');
      const now = new Date('2024-12-15');
      const status = 'ACTIVE';
      
      const isActive = campaignCore.isCampaignActive(status, deadline, now);
      
      expect(isActive).toBe(true);
    });

    it('should return false for completed campaign', () => {
      const deadline = new Date('2024-12-31');
      const now = new Date('2024-12-15');
      const status = 'COMPLETED';
      
      const isActive = campaignCore.isCampaignActive(status, deadline, now);
      
      expect(isActive).toBe(false);
    });

    it('should return false for suspended campaign', () => {
      const deadline = new Date('2024-12-31');
      const now = new Date('2024-12-15');
      const status = 'SUSPENDED';
      
      const isActive = campaignCore.isCampaignActive(status, deadline, now);
      
      expect(isActive).toBe(false);
    });

    it('should return false for expired campaign', () => {
      const deadline = new Date('2024-12-01');
      const now = new Date('2024-12-15');
      const status = 'ACTIVE';
      
      const isActive = campaignCore.isCampaignActive(status, deadline, now);
      
      expect(isActive).toBe(false);
    });
  });

  describe('validateCampaignGoal', () => {
    it('should return true for valid goal', () => {
      const goal = 1000;
      
      const isValid = campaignCore.validateCampaignGoal(goal);
      
      expect(isValid).toBe(true);
    });

    it('should return false for negative goal', () => {
      const goal = -100;
      
      const isValid = campaignCore.validateCampaignGoal(goal);
      
      expect(isValid).toBe(false);
    });

    it('should return false for zero goal', () => {
      const goal = 0;
      
      const isValid = campaignCore.validateCampaignGoal(goal);
      
      expect(isValid).toBe(false);
    });

    it('should return false for extremely large goal', () => {
      const goal = 1000000000; // 1 billion
      
      const isValid = campaignCore.validateCampaignGoal(goal);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validateCampaignDeadline', () => {
    it('should return true for future deadline', () => {
      const deadline = new Date('2024-12-31');
      const now = new Date('2024-12-15');
      
      const isValid = campaignCore.validateCampaignDeadline(deadline, now);
      
      expect(isValid).toBe(true);
    });

    it('should return false for past deadline', () => {
      const deadline = new Date('2024-12-01');
      const now = new Date('2024-12-15');
      
      const isValid = campaignCore.validateCampaignDeadline(deadline, now);
      
      expect(isValid).toBe(false);
    });

    it('should return false for deadline too far in future', () => {
      const deadline = new Date('2026-12-31');
      const now = new Date('2024-12-15');
      
      const isValid = campaignCore.validateCampaignDeadline(deadline, now);
      
      expect(isValid).toBe(false);
    });
  });

  describe('calculateCampaignStats', () => {
    it('should calculate campaign statistics correctly', () => {
      const donations = [
        { amount: 100, donorId: 'user1' },
        { amount: 200, donorId: 'user2' },
        { amount: 150, donorId: 'user1' },
        { amount: 300, donorId: 'user3' }
      ];
      
      const stats = campaignCore.calculateCampaignStats(donations);
      
      expect(stats.totalAmount).toBe(750);
      expect(stats.totalDonations).toBe(4);
      expect(stats.uniqueDonors).toBe(3);
      expect(stats.averageDonation).toBe(187.5);
    });

    it('should handle empty donations array', () => {
      const donations: any[] = [];
      
      const stats = campaignCore.calculateCampaignStats(donations);
      
      expect(stats.totalAmount).toBe(0);
      expect(stats.totalDonations).toBe(0);
      expect(stats.uniqueDonors).toBe(0);
      expect(stats.averageDonation).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const amount = 1234.56;
      
      const formatted = campaignCore.formatCurrency(amount);
      
      expect(formatted).toBe('$1,234.56');
    });

    it('should handle zero amount', () => {
      const amount = 0;
      
      const formatted = campaignCore.formatCurrency(amount);
      
      expect(formatted).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      const amount = 1234567.89;
      
      const formatted = campaignCore.formatCurrency(amount);
      
      expect(formatted).toBe('$1,234,567.89');
    });
  });

  describe('generateCampaignSlug', () => {
    it('should generate slug from title', () => {
      const title = 'Amazing Tech Project';
      
      const slug = campaignCore.generateCampaignSlug(title);
      
      expect(slug).toBe('amazing-tech-project');
    });

    it('should handle special characters', () => {
      const title = 'Project with Special Characters!@#$%';
      
      const slug = campaignCore.generateCampaignSlug(title);
      
      expect(slug).toBe('project-with-special-characters');
    });

    it('should handle multiple spaces', () => {
      const title = 'Project   with   multiple    spaces';
      
      const slug = campaignCore.generateCampaignSlug(title);
      
      expect(slug).toBe('project-with-multiple-spaces');
    });

    it('should limit slug length', () => {
      const title = 'This is a very long campaign title that should be truncated to a reasonable length for URL purposes';
      
      const slug = campaignCore.generateCampaignSlug(title);
      
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });
});
