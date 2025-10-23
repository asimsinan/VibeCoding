export class DonationCore {
  private readonly MIN_DONATION = 1;
  private readonly MAX_DONATION = 100000; // $100K max donation

  /**
   * Validate donation amount
   */
  validateDonationAmount(amount: number): boolean {
    return amount >= this.MIN_DONATION && amount <= this.MAX_DONATION;
  }

  /**
   * Calculate platform fee
   */
  calculateDonationFee(amount: number, platformFeeRate: number = 0.05): number {
    return Math.round(amount * platformFeeRate * 100) / 100;
  }

  /**
   * Calculate processing fee
   */
  calculateProcessingFee(amount: number, processingFeeRate: number = 0.029, processingFeeFixed: number = 0.30): number {
    return Math.round(amount * processingFeeRate * 100) / 100;
  }

  /**
   * Validate payment method
   */
  validatePaymentMethod(method: string): boolean {
    const validMethods = ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'STRIPE'];
    return validMethods.includes(method);
  }

  /**
   * Process donation
   */
  processDonation(donationData: {
    amount: number;
    campaignId: string;
    donorId: string;
    paymentMethod: string;
    message?: string;
  }) {
    // Validate amount
    if (!this.validateDonationAmount(donationData.amount)) {
      return {
        success: false,
        error: 'Invalid donation amount'
      };
    }

    // Validate payment method
    if (!this.validatePaymentMethod(donationData.paymentMethod)) {
      return {
        success: false,
        error: 'Invalid payment method'
      };
    }

    // Calculate fees
    const platformFee = this.calculateDonationFee(donationData.amount);
    const processingFee = this.calculateProcessingFee(donationData.amount);
    const totalFees = platformFee + processingFee;
    const netAmount = donationData.amount - totalFees;

    return {
      success: true,
      donationId: `donation-${Date.now()}`,
      fees: {
        platform: platformFee,
        processing: processingFee,
        total: totalFees
      },
      netAmount
    };
  }

  /**
   * Calculate donation impact
   */
  calculateDonationImpact(donation: {
    amount: number;
    campaignGoal: number;
    campaignCurrent: number;
  }) {
    const percentageOfGoal = (donation.amount / donation.campaignGoal) * 100;
    const percentageOfCurrent = donation.campaignCurrent > 0 
      ? (donation.amount / donation.campaignCurrent) * 100 
      : 0;
    const goalProgress = ((donation.campaignCurrent + donation.amount) / donation.campaignGoal) * 100;
    const completesCampaign = goalProgress >= 100;

    return {
      percentageOfGoal: Math.round(percentageOfGoal * 100) / 100,
      percentageOfCurrent: Math.round(percentageOfCurrent * 100) / 100,
      goalProgress: Math.round(goalProgress * 100) / 100,
      completesCampaign
    };
  }

  /**
   * Generate donation receipt
   */
  generateDonationReceipt(donation: {
    id: string;
    amount: number;
    donorId: string;
    campaignId: string;
    timestamp: Date;
    fees: number;
    netAmount: number;
  }) {
    return {
      donationId: donation.id,
      amount: donation.amount,
      fees: donation.fees,
      netAmount: donation.netAmount,
      timestamp: donation.timestamp,
      receiptNumber: `RCP-${donation.id}`,
      donorId: donation.donorId,
      campaignId: donation.campaignId
    };
  }

  /**
   * Validate donation message
   */
  validateDonationMessage(message: string): boolean {
    if (message.length > 500) return false;
    
    // Check for inappropriate content (simplified)
    const inappropriateWords = ['spam', 'inappropriate', 'bad'];
    const lowerMessage = message.toLowerCase();
    return !inappropriateWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Calculate donation streak
   */
  calculateDonationStreak(donations: Array<{ timestamp: Date }>) {
    if (donations.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Sort donations by timestamp (newest first)
    const sortedDonations = donations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDonations.length; i++) {
      const prevDate = new Date(sortedDonations[i - 1].timestamp);
      const currDate = new Date(sortedDonations[i].timestamp);
      
      // Check if donations are consecutive days
      const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 1) {
          currentStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }

    // If we only have one donation or all donations are consecutive
    if (sortedDonations.length === 1 || tempStreak === sortedDonations.length) {
      currentStreak = tempStreak;
    }

    return {
      current: currentStreak,
      longest: longestStreak
    };
  }
}
