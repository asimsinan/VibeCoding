import { DonationCore } from '../core/donation';
import { DonationRepository } from '../../repositories/DonationRepository';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { Decimal } from '@prisma/client/runtime/library';

export interface DonationData {
  amount: number;
  campaignId: string;
  donorId: string;
  paymentMethod: string;
  message?: string;
  isAnonymous?: boolean;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  donation?: T;
  donations?: T;
  pagination?: T;
}

export class DonationService {
  constructor(
    private donationCore: DonationCore,
    private donationRepository: DonationRepository,
    private campaignRepository: CampaignRepository
  ) {}

  async processDonation(donationData: DonationData): Promise<ServiceResult<any>> {
    try {
      // Check if campaign exists and is active
      const campaign = await this.campaignRepository.findById(donationData.campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      if (campaign.status !== 'ACTIVE' && campaign.status !== 'OPEN') {
        return { success: false, error: 'Campaign is not accepting donations' };
      }

      // Check if user is trying to donate to their own campaign
      if (campaign.ownerId === donationData.donorId) {
        return { success: false, error: 'Cannot donate to your own campaign' };
      }

      // Validate donation amount
      if (!this.donationCore.validateDonationAmount(donationData.amount)) {
        return { success: false, error: 'Invalid donation amount' };
      }

      // Validate payment method
      if (!this.donationCore.validatePaymentMethod(donationData.paymentMethod)) {
        return { success: false, error: 'Invalid payment method' };
      }

      // Process donation
      const processResult = this.donationCore.processDonation(donationData);
      if (!processResult.success) {
        return { success: false, error: processResult.error };
      }

      // Create donation record
      const donation = await this.donationRepository.create({
        amount: donationData.amount,
        paymentMethod: donationData.paymentMethod as any,
        message: donationData.message || null,
        isAnonymous: donationData.isAnonymous || false
      }, donationData.campaignId, donationData.donorId);

      // Update campaign totals
      await this.campaignRepository.addDonation(donationData.campaignId, donationData.amount);

      return { success: true, donation };
    } catch (error) {
      return { success: false, error: 'Failed to process donation' };
    }
  }

  async completeDonation(donationId: string): Promise<ServiceResult<any>> {
    try {
      const donation = await this.donationRepository.findById(donationId);
      if (!donation) {
        return { success: false, error: 'Donation not found' };
      }

      const completedDonation = await this.donationRepository.completeDonation(donationId);
      return { success: true, donation: completedDonation };
    } catch (error) {
      return { success: false, error: 'Failed to complete donation' };
    }
  }

  async getDonationHistory(userId: string, page: number, limit: number): Promise<ServiceResult<any>> {
    try {
      const result = await this.donationRepository.findByDonor(userId, page, limit);
      return { 
        success: true, 
        donations: result.donations, 
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get donation history' };
    }
  }

  async getCampaignDonations(campaignId: string, page: number, limit: number): Promise<ServiceResult<any>> {
    try {
      const result = await this.donationRepository.findByCampaign(campaignId, page, limit);
      return { 
        success: true, 
        donations: result.donations, 
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get campaign donations' };
    }
  }

  async refundDonation(donationId: string, adminId: string): Promise<ServiceResult<any>> {
    try {
      const donation = await this.donationRepository.findById(donationId);
      if (!donation) {
        return { success: false, error: 'Donation not found' };
      }

      const refundedDonation = await this.donationRepository.refundDonation(donationId);
      return { success: true, donation: refundedDonation };
    } catch (error) {
      return { success: false, error: 'Failed to refund donation' };
    }
  }
}
