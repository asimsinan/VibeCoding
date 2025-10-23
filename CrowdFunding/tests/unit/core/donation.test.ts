import { DonationCore } from '../../../src/lib/core/donation';

describe('DonationCore', () => {
  let donationCore: DonationCore;

  beforeEach(() => {
    donationCore = new DonationCore();
  });

  describe('validateDonationAmount', () => {
    it('should return true for valid donation amount', () => {
      const amount = 25.50;
      
      const isValid = donationCore.validateDonationAmount(amount);
      
      expect(isValid).toBe(true);
    });

    it('should return false for negative amount', () => {
      const amount = -10;
      
      const isValid = donationCore.validateDonationAmount(amount);
      
      expect(isValid).toBe(false);
    });

    it('should return false for zero amount', () => {
      const amount = 0;
      
      const isValid = donationCore.validateDonationAmount(amount);
      
      expect(isValid).toBe(false);
    });

    it('should return false for amount below minimum', () => {
      const amount = 0.50; // Below $1 minimum
      
      const isValid = donationCore.validateDonationAmount(amount);
      
      expect(isValid).toBe(false);
    });

    it('should return false for extremely large amount', () => {
      const amount = 1000000; // $1 million
      
      const isValid = donationCore.validateDonationAmount(amount);
      
      expect(isValid).toBe(false);
    });
  });

  describe('calculateDonationFee', () => {
    it('should calculate platform fee correctly', () => {
      const amount = 100;
      const platformFeeRate = 0.05; // 5%
      
      const fee = donationCore.calculateDonationFee(amount, platformFeeRate);
      
      expect(fee).toBe(5);
    });

    it('should calculate processing fee correctly', () => {
      const amount = 100;
      const processingFeeRate = 0.029; // 2.9%
      const processingFeeFixed = 0.30; // $0.30
      
      const fee = donationCore.calculateProcessingFee(amount, processingFeeRate, processingFeeFixed);
      
      expect(fee).toBeCloseTo(2.9, 2);
    });

    it('should handle zero amount', () => {
      const amount = 0;
      const platformFeeRate = 0.05;
      
      const fee = donationCore.calculateDonationFee(amount, platformFeeRate);
      
      expect(fee).toBe(0);
    });
  });

  describe('validatePaymentMethod', () => {
    it('should return true for valid payment methods', () => {
      const validMethods = ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'STRIPE'];
      
      validMethods.forEach(method => {
        const isValid = donationCore.validatePaymentMethod(method);
        expect(isValid).toBe(true);
      });
    });

    it('should return false for invalid payment method', () => {
      const invalidMethod = 'INVALID_METHOD';
      
      const isValid = donationCore.validatePaymentMethod(invalidMethod);
      
      expect(isValid).toBe(false);
    });

    it('should return false for empty payment method', () => {
      const emptyMethod = '';
      
      const isValid = donationCore.validatePaymentMethod(emptyMethod);
      
      expect(isValid).toBe(false);
    });
  });

  describe('processDonation', () => {
    it('should process donation successfully', () => {
      const donationData = {
        amount: 50,
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };
      
      const result = donationCore.processDonation(donationData);
      
      expect(result.success).toBe(true);
      expect(result.donationId).toBeDefined();
      expect(result.fees).toBeDefined();
      expect(result.netAmount).toBeLessThan(donationData.amount);
    });

    it('should fail for invalid amount', () => {
      const donationData = {
        amount: -10,
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };
      
      const result = donationCore.processDonation(donationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for invalid payment method', () => {
      const donationData = {
        amount: 50,
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'INVALID_METHOD',
        message: 'Great project!'
      };
      
      const result = donationCore.processDonation(donationData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateDonationImpact', () => {
    it('should calculate impact metrics correctly', () => {
      const donation = {
        amount: 100,
        campaignGoal: 10000,
        campaignCurrent: 2500
      };
      
      const impact = donationCore.calculateDonationImpact(donation);
      
      expect(impact.percentageOfGoal).toBe(1);
      expect(impact.percentageOfCurrent).toBe(4);
      expect(impact.goalProgress).toBeCloseTo(26, 1);
    });

    it('should handle campaign completion', () => {
      const donation = {
        amount: 100,
        campaignGoal: 10000,
        campaignCurrent: 9900
      };
      
      const impact = donationCore.calculateDonationImpact(donation);
      
      expect(impact.goalProgress).toBe(100);
      expect(impact.completesCampaign).toBe(true);
    });
  });

  describe('generateDonationReceipt', () => {
    it('should generate receipt with all required fields', () => {
      const donation = {
        id: 'donation-123',
        amount: 50,
        donorId: 'user-456',
        campaignId: 'campaign-789',
        timestamp: new Date('2024-12-15T10:30:00Z'),
        fees: 2.5,
        netAmount: 47.5
      };
      
      const receipt = donationCore.generateDonationReceipt(donation);
      
      expect(receipt.donationId).toBe(donation.id);
      expect(receipt.amount).toBe(donation.amount);
      expect(receipt.fees).toBe(donation.fees);
      expect(receipt.netAmount).toBe(donation.netAmount);
      expect(receipt.timestamp).toBe(donation.timestamp);
      expect(receipt.receiptNumber).toBeDefined();
    });
  });

  describe('validateDonationMessage', () => {
    it('should return true for valid message', () => {
      const message = 'Great project! Keep up the good work.';
      
      const isValid = donationCore.validateDonationMessage(message);
      
      expect(isValid).toBe(true);
    });

    it('should return false for message too long', () => {
      const message = 'A'.repeat(501); // Exceeds 500 character limit
      
      const isValid = donationCore.validateDonationMessage(message);
      
      expect(isValid).toBe(false);
    });

    it('should return true for empty message', () => {
      const message = '';
      
      const isValid = donationCore.validateDonationMessage(message);
      
      expect(isValid).toBe(true);
    });

    it('should return false for message with inappropriate content', () => {
      const message = 'This message contains inappropriate content';
      
      const isValid = donationCore.validateDonationMessage(message);
      
      expect(isValid).toBe(false);
    });
  });

  describe('calculateDonationStreak', () => {
    it('should calculate donation streak correctly', () => {
      const donations = [
        { timestamp: new Date('2024-12-01') },
        { timestamp: new Date('2024-12-02') },
        { timestamp: new Date('2024-12-03') },
        { timestamp: new Date('2024-12-05') } // Gap breaks streak
      ];
      
      const streak = donationCore.calculateDonationStreak(donations);
      
      expect(streak.current).toBe(1);
      expect(streak.longest).toBe(3);
    });

    it('should handle empty donations array', () => {
      const donations: any[] = [];
      
      const streak = donationCore.calculateDonationStreak(donations);
      
      expect(streak.current).toBe(0);
      expect(streak.longest).toBe(0);
    });
  });
});
