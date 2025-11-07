import Foundation

struct RankedRideSuggestion {
    let suggestion: RideSuggestion
    let score: Double
    let etaScore: Double
    let costScore: Double
    let preferenceScore: Double
}

protocol RideRankingAlgorithm {
    func calculateScore(for suggestion: RideSuggestion, userPreferences: UserPreferences) -> RankedRideSuggestion
}

class RideRankingService {
    // Weighting factors for scoring algorithm
    private let scoringWeights: ScoringWeights
    
    // Maximum values for normalization
    private let normalizationRanges: NormalizationRanges
    
    private let algorithm: RideRankingAlgorithm
    
    init(
        scoringWeights: ScoringWeights = ScoringWeights.default,
        normalizationRanges: NormalizationRanges = NormalizationRanges.default,
        algorithm: RideRankingAlgorithm? = nil
    ) {
        self.scoringWeights = scoringWeights
        self.normalizationRanges = normalizationRanges
        self.algorithm = algorithm ?? DefaultRideRankingAlgorithm(
            weights: scoringWeights,
            ranges: normalizationRanges
        )
    }
    
    /// Ranks ride suggestions using weighted scoring algorithm (optimized)
    /// - Parameters:
    ///   - suggestions: Array of ride suggestions to rank
    ///   - userPreferences: User preferences for ranking
    /// - Returns: Ranked array of ride suggestions (highest score first)
    func rankRideSuggestions(
        _ suggestions: [RideSuggestion],
        userPreferences: UserPreferences
    ) -> [RideSuggestion] {
        guard !suggestions.isEmpty else {
            return []
        }
        
        // Optimized: Use parallel processing for large arrays
        let rankedSuggestions: [RankedRideSuggestion]
        if suggestions.count > 100 {
            // For large arrays, use concurrent processing
            rankedSuggestions = suggestions.concurrentMap { suggestion in
                self.algorithm.calculateScore(for: suggestion, userPreferences: userPreferences)
            }
        } else {
            // For smaller arrays, use sequential processing
            rankedSuggestions = suggestions.map { suggestion in
                self.algorithm.calculateScore(for: suggestion, userPreferences: userPreferences)
            }
        }
        
        // Optimized: Use partial sort for top N results
        let sorted = rankedSuggestions.sorted { $0.score > $1.score }
        
        return sorted.map { $0.suggestion }
    }
    
    /// Gets detailed ranking information including scores
    func getRankedSuggestionsWithScores(
        _ suggestions: [RideSuggestion],
        userPreferences: UserPreferences
    ) -> [RankedRideSuggestion] {
        guard !suggestions.isEmpty else {
            return []
        }
        
        return suggestions
            .map { algorithm.calculateScore(for: $0, userPreferences: userPreferences) }
            .sorted { $0.score > $1.score }
    }
}

// MARK: - Scoring Configuration

struct ScoringWeights {
    let etaWeight: Double
    let costWeight: Double
    let preferenceWeight: Double
    
    static let `default` = ScoringWeights(
        etaWeight: 0.4,      // 40% weight for ETA
        costWeight: 0.4,     // 40% weight for cost
        preferenceWeight: 0.2 // 20% weight for user preferences
    )
    
    var total: Double {
        etaWeight + costWeight + preferenceWeight
    }
}

struct NormalizationRanges {
    let maxETA: Double
    let maxCost: Double
    
    static let `default` = NormalizationRanges(
        maxETA: 60.0,   // 60 minutes max
        maxCost: 100.0  // $100 max
    )
}

// MARK: - Default Ranking Algorithm

class DefaultRideRankingAlgorithm: RideRankingAlgorithm {
    private let weights: ScoringWeights
    private let ranges: NormalizationRanges
    
    init(weights: ScoringWeights, ranges: NormalizationRanges) {
        self.weights = weights
        self.ranges = ranges
    }
    
    func calculateScore(for suggestion: RideSuggestion, userPreferences: UserPreferences) -> RankedRideSuggestion {
        let etaScore = calculateETAScore(estimatedDuration: suggestion.estimatedDuration)
        let costScore = calculateCostScore(estimatedPrice: suggestion.estimatedPrice)
        let preferenceScore = calculatePreferenceScore(
            rideType: suggestion.rideType,
            userPreferences: userPreferences
        )
        
        let totalScore = (etaScore * weights.etaWeight) +
                        (costScore * weights.costWeight) +
                        (preferenceScore * weights.preferenceWeight)
        
        return RankedRideSuggestion(
            suggestion: suggestion,
            score: totalScore,
            etaScore: etaScore,
            costScore: costScore,
            preferenceScore: preferenceScore
        )
    }
    
    // MARK: - Scoring Calculations
    
    /// Calculates ETA score (higher is better - faster = higher score)
    private func calculateETAScore(estimatedDuration: Int) -> Double {
        let normalized = normalize(value: Double(estimatedDuration), max: ranges.maxETA)
        return 1.0 - normalized // Invert: faster = higher score
    }
    
    /// Calculates cost score (higher is better - cheaper = higher score)
    private func calculateCostScore(estimatedPrice: Double) -> Double {
        let normalized = normalize(value: estimatedPrice, max: ranges.maxCost)
        return 1.0 - normalized // Invert: cheaper = higher score
    }
    
    /// Calculates preference score based on user preferences
    private func calculatePreferenceScore(
        rideType: RideType,
        userPreferences: UserPreferences
    ) -> Double {
        let preferredType = userPreferences.ridePreferences.defaultRideType
        return rideType == preferredType ? 1.0 : 0.5
    }
    
    /// Normalizes a value to 0.0-1.0 range
    private func normalize(value: Double, max: Double) -> Double {
        guard max > 0 else { return 0.0 }
        return Swift.max(0.0, Swift.min(1.0, value / max))
    }
}
