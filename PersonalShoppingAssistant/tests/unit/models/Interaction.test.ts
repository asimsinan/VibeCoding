/**
 * Interaction Model Unit Tests
 * TASK-008: Create Model Tests - FR-004
 * 
 * This test suite validates the Interaction model functionality including
 * business logic, validation, and data integrity.
 */

import { Interaction, InteractionEntity, InteractionCreateData, InteractionType } from '@/lib/recommendation-engine/models/Interaction';

describe('Interaction Model', () => {
  let interaction: Interaction;
  let interactionData: InteractionEntity;

  beforeEach(() => {
    interactionData = {
      id: 1,
      userId: 1,
      productId: 101,
      type: 'view',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      metadata: { source: 'search', category: 'Electronics' }
    };

    interaction = new Interaction(interactionData);
  });

  describe('Constructor and Getters', () => {
    it('should create interaction with correct data', () => {
      expect(interaction.id).toBe(1);
      expect(interaction.userId).toBe(1);
      expect(interaction.productId).toBe(101);
      expect(interaction.type).toBe('view');
      expect(interaction.timestamp).toEqual(new Date('2023-01-01T10:00:00Z'));
      expect(interaction.metadata).toEqual({ source: 'search', category: 'Electronics' });
    });

    it('should return copy of metadata to prevent mutation', () => {
      const metadata = interaction.metadata;
      metadata.newKey = 'newValue';

      expect(interaction.metadata).toEqual({ source: 'search', category: 'Electronics' });
    });

    it('should return correct data via toJSON', () => {
      const json = interaction.toJSON();
      expect(json).toEqual(interactionData);
    });
  });

  describe('Interaction Type Classification', () => {
    it('should identify positive interactions', () => {
      const likeInteraction = new Interaction({ ...interactionData, type: 'like' });
      const purchaseInteraction = new Interaction({ ...interactionData, type: 'purchase' });

      expect(likeInteraction.isPositive()).toBe(true);
      expect(purchaseInteraction.isPositive()).toBe(true);
    });

    it('should identify negative interactions', () => {
      const dislikeInteraction = new Interaction({ ...interactionData, type: 'dislike' });
      expect(dislikeInteraction.isNegative()).toBe(true);
    });

    it('should identify neutral interactions', () => {
      const viewInteraction = new Interaction({ ...interactionData, type: 'view' });
      expect(viewInteraction.isNeutral()).toBe(true);
    });

    it('should identify conversion interactions', () => {
      const purchaseInteraction = new Interaction({ ...interactionData, type: 'purchase' });
      expect(purchaseInteraction.isConversion()).toBe(true);
    });

    it('should not identify non-conversion interactions as conversions', () => {
      const viewInteraction = new Interaction({ ...interactionData, type: 'view' });
      const likeInteraction = new Interaction({ ...interactionData, type: 'like' });
      const dislikeInteraction = new Interaction({ ...interactionData, type: 'dislike' });

      expect(viewInteraction.isConversion()).toBe(false);
      expect(likeInteraction.isConversion()).toBe(false);
      expect(dislikeInteraction.isConversion()).toBe(false);
    });
  });

  describe('Weight and Score Calculation', () => {
    it('should return correct weight for purchase', () => {
      const purchaseInteraction = new Interaction({ ...interactionData, type: 'purchase' });
      expect(purchaseInteraction.getWeight()).toBe(1.0);
    });

    it('should return correct weight for like', () => {
      const likeInteraction = new Interaction({ ...interactionData, type: 'like' });
      expect(likeInteraction.getWeight()).toBe(0.7);
    });

    it('should return correct weight for dislike', () => {
      const dislikeInteraction = new Interaction({ ...interactionData, type: 'dislike' });
      expect(dislikeInteraction.getWeight()).toBe(-0.5);
    });

    it('should return correct weight for view', () => {
      const viewInteraction = new Interaction({ ...interactionData, type: 'view' });
      expect(viewInteraction.getWeight()).toBe(0.1);
    });

    it('should return correct score for purchase', () => {
      const purchaseInteraction = new Interaction({ ...interactionData, type: 'purchase' });
      expect(purchaseInteraction.getScore()).toBe(10);
    });

    it('should return correct score for like', () => {
      const likeInteraction = new Interaction({ ...interactionData, type: 'like' });
      expect(likeInteraction.getScore()).toBe(5);
    });

    it('should return correct score for dislike', () => {
      const dislikeInteraction = new Interaction({ ...interactionData, type: 'dislike' });
      expect(dislikeInteraction.getScore()).toBe(-2);
    });

    it('should return correct score for view', () => {
      const viewInteraction = new Interaction({ ...interactionData, type: 'view' });
      expect(viewInteraction.getScore()).toBe(1);
    });
  });

  describe('Time-based Methods', () => {
    it('should identify recent interactions', () => {
      const recentInteraction = new Interaction({
        ...interactionData,
        timestamp: new Date()
      });
      expect(recentInteraction.isRecent(30)).toBe(true);
    });

    it('should identify old interactions', () => {
      const oldInteraction = new Interaction({
        ...interactionData,
        timestamp: new Date('2020-01-01')
      });
      expect(oldInteraction.isRecent(30)).toBe(false);
    });

    it('should calculate days since interaction', () => {
      const daysAgo = 5;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - daysAgo);
      
      const pastInteraction = new Interaction({
        ...interactionData,
        timestamp: pastDate
      });
      
      expect(pastInteraction.getDaysSince()).toBe(daysAgo);
    });

    it('should handle same day interaction', () => {
      const todayInteraction = new Interaction({
        ...interactionData,
        timestamp: new Date()
      });
      
      expect(todayInteraction.getDaysSince()).toBe(0);
    });
  });

  describe('Metadata Methods', () => {
    it('should get source from metadata', () => {
      expect(interaction.getSource()).toBe('search');
    });

    it('should return unknown for missing source', () => {
      const interactionWithoutSource = new Interaction({
        ...interactionData,
        metadata: { category: 'Electronics' }
      });
      expect(interactionWithoutSource.getSource()).toBe('unknown');
    });

    it('should check for metadata key existence', () => {
      expect(interaction.hasMetadata('source')).toBe(true);
      expect(interaction.hasMetadata('category')).toBe(true);
      expect(interaction.hasMetadata('nonexistent')).toBe(false);
    });

    it('should get metadata value', () => {
      expect(interaction.getMetadataValue('source')).toBe('search');
      expect(interaction.getMetadataValue('category')).toBe('Electronics');
      expect(interaction.getMetadataValue('nonexistent')).toBeUndefined();
    });
  });

  describe('Update Methods', () => {
    it('should update interaction type', () => {
      const result = interaction.updateFromData({ type: 'like' });
      expect(result).toBe(true);
      expect(interaction.type).toBe('like');
    });

    it('should update metadata', () => {
      const newMetadata = { source: 'recommendation', category: 'Books' };
      const result = interaction.updateFromData({ metadata: newMetadata });
      expect(result).toBe(true);
      expect(interaction.metadata).toEqual(newMetadata);
    });

    it('should update both type and metadata', () => {
      const updateData = {
        type: 'purchase' as InteractionType,
        metadata: { source: 'recommendation', amount: 99.99 }
      };
      const result = interaction.updateFromData(updateData);
      expect(result).toBe(true);
      expect(interaction.type).toBe('purchase');
      expect(interaction.metadata).toEqual(updateData.metadata);
    });

    it('should return false when no changes made', () => {
      const result = interaction.updateFromData({ type: 'view' });
      expect(result).toBe(false);
    });
  });

  describe('Metadata Management', () => {
    it('should add metadata', () => {
      interaction.addMetadata('newKey', 'newValue');
      expect(interaction.metadata.newKey).toBe('newValue');
    });

    it('should remove metadata', () => {
      const result = interaction.removeMetadata('source');
      expect(result).toBe(true);
      expect(interaction.hasMetadata('source')).toBe(false);
    });

    it('should return false when removing non-existent metadata', () => {
      const result = interaction.removeMetadata('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Static Methods', () => {
    describe('fromCreateData', () => {
      it('should create interaction from create data', () => {
        const createData: InteractionCreateData = {
          userId: 2,
          productId: 202,
          type: 'like',
          metadata: { source: 'browse' }
        };

        const newInteraction = Interaction.fromCreateData(createData, 2);

        expect(newInteraction.id).toBe(2);
        expect(newInteraction.userId).toBe(2);
        expect(newInteraction.productId).toBe(202);
        expect(newInteraction.type).toBe('like');
        expect(newInteraction.metadata).toEqual({ source: 'browse' });
        expect(newInteraction.timestamp).toBeInstanceOf(Date);
      });

      it('should create interaction with default metadata', () => {
        const createData: InteractionCreateData = {
          userId: 2,
          productId: 202,
          type: 'view'
        };

        const newInteraction = Interaction.fromCreateData(createData, 2);
        expect(newInteraction.metadata).toEqual({});
      });
    });

    describe('calculateStats', () => {
      it('should calculate correct statistics', () => {
        const interactions: InteractionEntity[] = [
          { id: 1, userId: 1, productId: 1, type: 'view', timestamp: new Date('2023-01-01'), metadata: {} },
          { id: 2, userId: 1, productId: 2, type: 'like', timestamp: new Date('2023-01-02'), metadata: {} },
          { id: 3, userId: 1, productId: 3, type: 'dislike', timestamp: new Date('2023-01-03'), metadata: {} },
          { id: 4, userId: 1, productId: 4, type: 'purchase', timestamp: new Date('2023-01-04'), metadata: {} },
          { id: 5, userId: 1, productId: 5, type: 'view', timestamp: new Date('2023-01-05'), metadata: {} }
        ];

        const stats = Interaction.calculateStats(interactions);

        expect(stats.totalViews).toBe(2);
        expect(stats.totalLikes).toBe(1);
        expect(stats.totalDislikes).toBe(1);
        expect(stats.totalPurchases).toBe(1);
        expect(stats.totalInteractions).toBe(5);
        expect(stats.lastInteractionAt).toEqual(new Date('2023-01-05'));
      });

      it('should handle empty interactions array', () => {
        const stats = Interaction.calculateStats([]);

        expect(stats.totalViews).toBe(0);
        expect(stats.totalLikes).toBe(0);
        expect(stats.totalDislikes).toBe(0);
        expect(stats.totalPurchases).toBe(0);
        expect(stats.totalInteractions).toBe(0);
        expect(stats.lastInteractionAt).toBeUndefined();
      });
    });

    describe('calculateProductAnalytics', () => {
      it('should calculate product analytics', () => {
        const interactions: InteractionEntity[] = [
          { id: 1, userId: 1, productId: 101, type: 'view', timestamp: new Date(), metadata: {} },
          { id: 2, userId: 2, productId: 101, type: 'view', timestamp: new Date(), metadata: {} },
          { id: 3, userId: 3, productId: 101, type: 'like', timestamp: new Date(), metadata: {} },
          { id: 4, userId: 4, productId: 101, type: 'purchase', timestamp: new Date(), metadata: {} }
        ];

        const analytics = Interaction.calculateProductAnalytics(interactions, 101);

        expect(analytics.totalViews).toBe(2);
        expect(analytics.totalLikes).toBe(1);
        expect(analytics.totalDislikes).toBe(0);
        expect(analytics.totalPurchases).toBe(1);
        expect(analytics.conversionRate).toBe(0.5); // 1 purchase / 2 views
        expect(analytics.engagementRate).toBe(1.0); // (1 like + 1 purchase) / 2 views
      });
    });

    describe('calculateUserAnalytics', () => {
      it('should calculate user analytics', () => {
        const interactions: InteractionEntity[] = [
          { id: 1, userId: 1, productId: 1, type: 'view', timestamp: new Date(), metadata: {} },
          { id: 2, userId: 1, productId: 2, type: 'like', timestamp: new Date(), metadata: {} },
          { id: 3, userId: 1, productId: 3, type: 'purchase', timestamp: new Date(), metadata: {} }
        ];

        const stats = Interaction.calculateUserAnalytics(interactions, 1);

        expect(stats.totalViews).toBe(1);
        expect(stats.totalLikes).toBe(1);
        expect(stats.totalDislikes).toBe(0);
        expect(stats.totalPurchases).toBe(1);
        expect(stats.totalInteractions).toBe(3);
      });
    });

    describe('validate', () => {
      it('should validate correct interaction data', () => {
        const validData = {
          userId: 1,
          productId: 101,
          type: 'view' as InteractionType,
          timestamp: new Date(),
          metadata: { source: 'search' }
        };

        const errors = Interaction.validate(validData);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for invalid user ID', () => {
        const invalidData = {
          userId: 0,
          productId: 101,
          type: 'view' as InteractionType
        };

        const errors = Interaction.validate(invalidData);
        expect(errors).toContain('User ID must be a positive number');
      });

      it('should return errors for invalid product ID', () => {
        const invalidData = {
          userId: 1,
          productId: -1,
          type: 'view' as InteractionType
        };

        const errors = Interaction.validate(invalidData);
        expect(errors).toContain('Product ID must be a positive number');
      });

      it('should return errors for invalid interaction type', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          type: 'invalid' as any
        };

        const errors = Interaction.validate(invalidData);
        expect(errors).toContain('Interaction type must be one of: view, like, dislike, purchase');
      });

      it('should return errors for invalid timestamp', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          type: 'view' as InteractionType,
          timestamp: 'invalid-date' as any
        };

        const errors = Interaction.validate(invalidData);
        expect(errors).toContain('Timestamp must be a valid date');
      });

      it('should return errors for invalid metadata', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          type: 'view' as InteractionType,
          metadata: 'invalid-metadata' as any
        };

        const errors = Interaction.validate(invalidData);
        expect(errors).toContain('Metadata must be an object');
      });
    });

    describe('getTypeWeights', () => {
      it('should return correct type weights', () => {
        const weights = Interaction.getTypeWeights();
        expect(weights.purchase).toBe(1.0);
        expect(weights.like).toBe(0.7);
        expect(weights.dislike).toBe(-0.5);
        expect(weights.view).toBe(0.1);
      });
    });

    describe('getTypeScores', () => {
      it('should return correct type scores', () => {
        const scores = Interaction.getTypeScores();
        expect(scores.purchase).toBe(10);
        expect(scores.like).toBe(5);
        expect(scores.dislike).toBe(-2);
        expect(scores.view).toBe(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle interaction without metadata', () => {
      const interactionWithoutMetadata = new Interaction({
        ...interactionData,
        metadata: undefined
      });

      expect(interactionWithoutMetadata.metadata).toEqual({});
      expect(interactionWithoutMetadata.getSource()).toBe('unknown');
      expect(interactionWithoutMetadata.hasMetadata('source')).toBe(false);
    });

    it('should handle interaction with empty metadata', () => {
      const interactionWithEmptyMetadata = new Interaction({
        ...interactionData,
        metadata: {}
      });

      expect(interactionWithEmptyMetadata.getSource()).toBe('unknown');
      expect(interactionWithEmptyMetadata.hasMetadata('source')).toBe(false);
    });

    it('should handle very old interaction', () => {
      const oldInteraction = new Interaction({
        ...interactionData,
        timestamp: new Date('2020-01-01')
      });

      expect(oldInteraction.isRecent(30)).toBe(false);
      expect(oldInteraction.getDaysSince()).toBeGreaterThan(1000);
    });

    it('should handle future timestamp', () => {
      const futureInteraction = new Interaction({
        ...interactionData,
        timestamp: new Date('2030-01-01')
      });

      expect(futureInteraction.getDaysSince()).toBeGreaterThan(0); // Future dates return positive days
    });
  });
});
