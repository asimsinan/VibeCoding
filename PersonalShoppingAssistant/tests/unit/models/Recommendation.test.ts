/**
 * Recommendation Model Unit Tests
 * TASK-008: Create Model Tests - FR-002
 * 
 * This test suite validates the Recommendation model functionality including
 * business logic, validation, and data integrity.
 */

import { Recommendation, RecommendationEntity, RecommendationCreateData, RecommendationAlgorithm } from '@/lib/recommendation-engine/models/Recommendation';

describe('Recommendation Model', () => {
  let recommendation: Recommendation;
  let recommendationData: RecommendationEntity;

  beforeEach(() => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    recommendationData = {
      id: 1,
      userId: 1,
      productId: 101,
      score: 0.85,
      algorithm: 'hybrid',
      createdAt: now,
      expiresAt
    };

    recommendation = new Recommendation(recommendationData);
  });

  describe('Constructor and Getters', () => {
    it('should create recommendation with correct data', () => {
      expect(recommendation.id).toBe(1);
      expect(recommendation.userId).toBe(1);
      expect(recommendation.productId).toBe(101);
      expect(recommendation.score).toBe(0.85);
      expect(recommendation.algorithm).toBe('hybrid');
      expect(recommendation.createdAt).toEqual(recommendationData.createdAt);
      expect(recommendation.expiresAt).toEqual(recommendationData.expiresAt);
    });

    it('should return correct data via toJSON', () => {
      const json = recommendation.toJSON();
      expect(json).toEqual(recommendationData);
    });
  });

  describe('Expiration Methods', () => {
    it('should identify non-expired recommendation', () => {
      expect(recommendation.isExpired()).toBe(false);
    });

    it('should identify expired recommendation', () => {
      const expiredRecommendation = new Recommendation({
        ...recommendationData,
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });
      expect(expiredRecommendation.isExpired()).toBe(true);
    });

    it('should identify expiring soon recommendation', () => {
      const expiringSoonRecommendation = new Recommendation({
        ...recommendationData,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      });
      expect(expiringSoonRecommendation.isExpiringSoon(24)).toBe(true);
    });

    it('should not identify non-expiring recommendation as expiring soon', () => {
      const nonExpiringRecommendation = new Recommendation({
        ...recommendationData,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      });
      expect(nonExpiringRecommendation.isExpiringSoon(24)).toBe(false);
    });

    it('should calculate hours until expiration', () => {
      const hours = recommendation.getHoursUntilExpiration();
      expect(hours).toBeGreaterThan(0);
      expect(hours).toBeLessThanOrEqual(24);
    });

    it('should return 0 hours for expired recommendation', () => {
      const expiredRecommendation = new Recommendation({
        ...recommendationData,
        expiresAt: new Date(Date.now() - 1000)
      });
      expect(expiredRecommendation.getHoursUntilExpiration()).toBe(0);
    });
  });

  describe('Confidence Level Methods', () => {
    it('should identify high confidence recommendation', () => {
      const highConfidenceRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.9
      });
      expect(highConfidenceRecommendation.getConfidenceLevel()).toBe('high');
    });

    it('should identify medium confidence recommendation', () => {
      const mediumConfidenceRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.6
      });
      expect(mediumConfidenceRecommendation.getConfidenceLevel()).toBe('medium');
    });

    it('should identify low confidence recommendation', () => {
      const lowConfidenceRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.3
      });
      expect(lowConfidenceRecommendation.getConfidenceLevel()).toBe('low');
    });

    it('should handle edge case scores', () => {
      const edgeCaseRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.8
      });
      expect(edgeCaseRecommendation.getConfidenceLevel()).toBe('high');
    });
  });

  describe('Reason Generation', () => {
    it('should generate reason for collaborative algorithm', () => {
      const collaborativeRecommendation = new Recommendation({
        ...recommendationData,
        algorithm: 'collaborative',
        score: 0.9
      });
      const reason = collaborativeRecommendation.getReason();
      expect(reason).toContain('Users with similar preferences');
      expect(reason).toContain('strongly');
    });

    it('should generate reason for content-based algorithm', () => {
      const contentBasedRecommendation = new Recommendation({
        ...recommendationData,
        algorithm: 'content-based',
        score: 0.6
      });
      const reason = contentBasedRecommendation.getReason();
      expect(reason).toContain('matches your preferences');
      expect(reason).toContain('moderately');
    });

    it('should generate reason for hybrid algorithm', () => {
      const hybridRecommendation = new Recommendation({
        ...recommendationData,
        algorithm: 'hybrid',
        score: 0.3
      });
      const reason = hybridRecommendation.getReason();
      expect(reason).toContain('preferences and similar users');
      expect(reason).toContain('moderately');
    });
  });

  describe('Quality Assessment', () => {
    it('should identify high quality recommendation', () => {
      const highQualityRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.8
      });
      expect(highQualityRecommendation.isHighQuality()).toBe(true);
    });

    it('should not identify medium quality as high quality', () => {
      const mediumQualityRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.6
      });
      expect(mediumQualityRecommendation.isHighQuality()).toBe(false);
    });

    it('should identify low quality recommendation', () => {
      const lowQualityRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.2
      });
      expect(lowQualityRecommendation.isLowQuality()).toBe(true);
    });

    it('should identify expired recommendation as low quality', () => {
      const expiredRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.9,
        expiresAt: new Date(Date.now() - 1000)
      });
      expect(expiredRecommendation.isLowQuality()).toBe(true);
    });

    it('should not identify medium quality as low quality', () => {
      const mediumQualityRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.5
      });
      expect(mediumQualityRecommendation.isLowQuality()).toBe(false);
    });
  });

  describe('Result Generation', () => {
    it('should generate correct result', () => {
      const result = recommendation.getResult();

      expect(result.productId).toBe(101);
      expect(result.score).toBe(0.85);
      expect(result.algorithm).toBe('hybrid');
      expect(result.confidence).toBe('high');
      expect(result.reason).toContain('preferences and similar users');
      expect(result.expiresAt).toEqual(recommendationData.expiresAt);
    });
  });

  describe('Update Methods', () => {
    it('should update score', () => {
      const result = recommendation.updateFromData({ score: 0.95 });
      expect(result).toBe(true);
      expect(recommendation.score).toBe(0.95);
    });

    it('should update expiration time', () => {
      const newExpiration = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const result = recommendation.updateFromData({ expiresAt: newExpiration });
      expect(result).toBe(true);
      expect(recommendation.expiresAt).toEqual(newExpiration);
    });

    it('should update both score and expiration', () => {
      const newExpiration = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const result = recommendation.updateFromData({
        score: 0.95,
        expiresAt: newExpiration
      });
      expect(result).toBe(true);
      expect(recommendation.score).toBe(0.95);
      expect(recommendation.expiresAt).toEqual(newExpiration);
    });

    it('should return false when no changes made', () => {
      const result = recommendation.updateFromData({ score: 0.85 });
      expect(result).toBe(false);
    });
  });

  describe('Expiration Extension', () => {
    it('should extend expiration time', () => {
      const originalExpiration = recommendation.expiresAt;
      recommendation.extendExpiration(24); // Add 24 hours
      
      const expectedExpiration = new Date(originalExpiration.getTime() + 24 * 60 * 60 * 1000);
      expect(recommendation.expiresAt).toEqual(expectedExpiration);
    });

    it('should handle negative extension', () => {
      const originalExpiration = recommendation.expiresAt;
      recommendation.extendExpiration(-12); // Subtract 12 hours
      
      const expectedExpiration = new Date(originalExpiration.getTime() - 12 * 60 * 60 * 1000);
      expect(recommendation.expiresAt).toEqual(expectedExpiration);
    });
  });

  describe('Age Calculation', () => {
    it('should calculate age in hours', () => {
      const age = recommendation.getAgeInHours();
      expect(age).toBeGreaterThanOrEqual(0);
    });

    it('should identify fresh recommendation', () => {
      const freshRecommendation = new Recommendation({
        ...recommendationData,
        createdAt: new Date()
      });
      expect(freshRecommendation.isFresh(24)).toBe(true);
    });

    it('should identify old recommendation', () => {
      const oldRecommendation = new Recommendation({
        ...recommendationData,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
      });
      expect(oldRecommendation.isFresh(24)).toBe(false);
    });
  });

  describe('Static Methods', () => {
    describe('fromCreateData', () => {
      it('should create recommendation from create data', () => {
        const createData: RecommendationCreateData = {
          userId: 2,
          productId: 202,
          score: 0.75,
          algorithm: 'collaborative',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        const newRecommendation = Recommendation.fromCreateData(createData, 2);

        expect(newRecommendation.id).toBe(2);
        expect(newRecommendation.userId).toBe(2);
        expect(newRecommendation.productId).toBe(202);
        expect(newRecommendation.score).toBe(0.75);
        expect(newRecommendation.algorithm).toBe('collaborative');
        expect(newRecommendation.expiresAt).toEqual(createData.expiresAt);
        expect(newRecommendation.createdAt).toBeInstanceOf(Date);
      });
    });

    describe('calculateStats', () => {
      it('should calculate correct statistics', () => {
        const now = new Date();
        const recommendations: RecommendationEntity[] = [
          {
            id: 1,
            userId: 1,
            productId: 1,
            score: 0.9,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            score: 0.6,
            algorithm: 'content-based',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 3,
            userId: 1,
            productId: 3,
            score: 0.3,
            algorithm: 'hybrid',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 4,
            userId: 1,
            productId: 4,
            score: 0.8,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Expired
          }
        ];

        const stats = Recommendation.calculateStats(recommendations);

        expect(stats.totalRecommendations).toBe(4);
        expect(stats.averageScore).toBe(0.65);
        expect(stats.highConfidenceCount).toBe(2);
        expect(stats.mediumConfidenceCount).toBe(1);
        expect(stats.lowConfidenceCount).toBe(1);
        expect(stats.algorithmDistribution.collaborative).toBe(2);
        expect(stats.algorithmDistribution['content-based']).toBe(1);
        expect(stats.algorithmDistribution.hybrid).toBe(1);
        expect(stats.expirationStats.expired).toBe(1);
        expect(stats.expirationStats.expiringSoon).toBe(3); // 3 are expiring soon, 1 is expired
        expect(stats.expirationStats.active).toBe(0); // None are active (all are expiring soon or expired)
      });

      it('should handle empty recommendations array', () => {
        const stats = Recommendation.calculateStats([]);

        expect(stats.totalRecommendations).toBe(0);
        expect(stats.averageScore).toBe(0);
        expect(stats.highConfidenceCount).toBe(0);
        expect(stats.mediumConfidenceCount).toBe(0);
        expect(stats.lowConfidenceCount).toBe(0);
      });
    });

    describe('filterByQuality', () => {
      it('should filter by minimum score', () => {
        const now = new Date();
        const recommendations: RecommendationEntity[] = [
          {
            id: 1,
            userId: 1,
            productId: 1,
            score: 0.9,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            score: 0.3,
            algorithm: 'content-based',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          }
        ];

        const filtered = Recommendation.filterByQuality(recommendations, 0.5);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].score).toBe(0.9);
      });

      it('should exclude expired recommendations', () => {
        const now = new Date();
        const recommendations: RecommendationEntity[] = [
          {
            id: 1,
            userId: 1,
            productId: 1,
            score: 0.9,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            score: 0.8,
            algorithm: 'content-based',
            createdAt: now,
            expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Expired
          }
        ];

        const filtered = Recommendation.filterByQuality(recommendations, 0.5, true);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
      });
    });

    describe('sortByScore', () => {
      it('should sort by score descending', () => {
        const now = new Date();
        const recommendations: RecommendationEntity[] = [
          {
            id: 1,
            userId: 1,
            productId: 1,
            score: 0.3,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            score: 0.9,
            algorithm: 'content-based',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          }
        ];

        const sorted = Recommendation.sortByScore(recommendations, true);
        expect(sorted[0].score).toBe(0.9);
        expect(sorted[1].score).toBe(0.3);
      });

      it('should sort by score ascending', () => {
        const now = new Date();
        const recommendations: RecommendationEntity[] = [
          {
            id: 1,
            userId: 1,
            productId: 1,
            score: 0.9,
            algorithm: 'collaborative',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            userId: 1,
            productId: 2,
            score: 0.3,
            algorithm: 'content-based',
            createdAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
          }
        ];

        const sorted = Recommendation.sortByScore(recommendations, false);
        expect(sorted[0].score).toBe(0.3);
        expect(sorted[1].score).toBe(0.9);
      });
    });

    describe('validate', () => {
      it('should validate correct recommendation data', () => {
        const validData = {
          userId: 1,
          productId: 101,
          score: 0.85,
          algorithm: 'hybrid' as RecommendationAlgorithm,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        const errors = Recommendation.validate(validData);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for invalid user ID', () => {
        const invalidData = {
          userId: 0,
          productId: 101,
          score: 0.85,
          algorithm: 'hybrid' as RecommendationAlgorithm
        };

        const errors = Recommendation.validate(invalidData);
        expect(errors).toContain('User ID must be a positive number');
      });

      it('should return errors for invalid product ID', () => {
        const invalidData = {
          userId: 1,
          productId: -1,
          score: 0.85,
          algorithm: 'hybrid' as RecommendationAlgorithm
        };

        const errors = Recommendation.validate(invalidData);
        expect(errors).toContain('Product ID must be a positive number');
      });

      it('should return errors for invalid score', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          score: 1.5,
          algorithm: 'hybrid' as RecommendationAlgorithm
        };

        const errors = Recommendation.validate(invalidData);
        expect(errors).toContain('Score must be between 0 and 1');
      });

      it('should return errors for invalid algorithm', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          score: 0.85,
          algorithm: 'invalid' as any
        };

        const errors = Recommendation.validate(invalidData);
        expect(errors).toContain('Algorithm must be one of: collaborative, content-based, hybrid');
      });

      it('should return errors for invalid expiration time', () => {
        const invalidData = {
          userId: 1,
          productId: 101,
          score: 0.85,
          algorithm: 'hybrid' as RecommendationAlgorithm,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Before created
        };

        const errors = Recommendation.validate(invalidData);
        expect(errors).toContain('Expires at must be after created at');
      });
    });

    describe('getDefaultExpiration', () => {
      it('should return default expiration time', () => {
        const expiration = Recommendation.getDefaultExpiration();
        const now = new Date();
        const expectedExpiration = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        expect(expiration.getTime()).toBeGreaterThan(now.getTime());
        expect(expiration.getTime() - now.getTime()).toBeLessThan(25 * 60 * 60 * 1000); // Within 25 hours (allowing for some time difference)
      });
    });

    describe('getAlgorithmWeights', () => {
      it('should return correct algorithm weights', () => {
        const weights = Recommendation.getAlgorithmWeights();
        expect(weights.collaborative).toBe(0.4);
        expect(weights['content-based']).toBe(0.3);
        expect(weights.hybrid).toBe(0.3);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle recommendation with score exactly at boundaries', () => {
      const boundaryRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.5
      });
      expect(boundaryRecommendation.getConfidenceLevel()).toBe('medium');
    });

    it('should handle recommendation with score exactly at 0.8', () => {
      const boundaryRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.8
      });
      expect(boundaryRecommendation.getConfidenceLevel()).toBe('high');
    });

    it('should handle recommendation with score exactly at 0.3', () => {
      const boundaryRecommendation = new Recommendation({
        ...recommendationData,
        score: 0.3
      });
      expect(boundaryRecommendation.getConfidenceLevel()).toBe('low');
    });

    it('should handle recommendation with zero score', () => {
      const zeroScoreRecommendation = new Recommendation({
        ...recommendationData,
        score: 0
      });
      expect(zeroScoreRecommendation.getConfidenceLevel()).toBe('low');
      expect(zeroScoreRecommendation.isLowQuality()).toBe(true);
    });

    it('should handle recommendation with maximum score', () => {
      const maxScoreRecommendation = new Recommendation({
        ...recommendationData,
        score: 1.0
      });
      expect(maxScoreRecommendation.getConfidenceLevel()).toBe('high');
      expect(maxScoreRecommendation.isHighQuality()).toBe(true);
    });
  });
});
