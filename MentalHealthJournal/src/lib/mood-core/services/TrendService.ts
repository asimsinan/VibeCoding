/**
 * TrendService - Calculates mood trends and statistics
 * Implements trend analysis and insights generation (FR-004)
 * Follows single domain model approach (Anti-Abstraction Gate)
 */

import { MoodEntry, MoodEntryStatus, MoodTrend, TimePeriod, MoodStatistics } from '../models';
import { LocalStorageService } from '../../mood-storage/services/LocalStorageService';

export class TrendService {
  constructor(private storageService: LocalStorageService) {}

  /**
   * Calculate mood trend for a specific time period (FR-004)
   */
  async calculateTrend(userId: string, period: TimePeriod): Promise<MoodTrend> {
    const { startDate, endDate } = this.getDateRangeForPeriod(period);
    
    // Get all mood entries for the period
    const allEntries = await this.storageService.getMoodEntriesByDateRange(
      userId,
      startDate,
      endDate
    );

    // Filter only active entries
    const entries = allEntries.filter(entry => entry.status === MoodEntryStatus.Active);

    // Calculate statistics
    const statistics = this.calculateStatistics(entries, period);

    // Create data points for chart
    const dataPoints = entries.map(entry => ({
      date: entry.date,
      value: entry.rating,
      entryId: entry.id,
    }));

    // Generate insights
    const insights = this.generateInsights(statistics, period);

    // Create trend object
    const trend: MoodTrend = {
      id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      period,
      startDate,
      endDate,
      statistics,
      dataPoints,
      insights,
      createdAt: new Date().toISOString(),
    };

    return trend;
  }

  /**
   * Get date range for a specific time period
   */
  private getDateRangeForPeriod(period: TimePeriod): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case TimePeriod.Week:
        startDate.setDate(endDate.getDate() - 6);
        break;
      case TimePeriod.Month:
        startDate.setDate(endDate.getDate() - 29);
        break;
      case TimePeriod.Quarter:
        startDate.setDate(endDate.getDate() - 89);
        break;
      case TimePeriod.Year:
        startDate.setDate(endDate.getDate() - 364);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * Calculate statistics from mood entries
   */
  private calculateStatistics(entries: MoodEntry[], period: TimePeriod): MoodStatistics {
    if (entries.length === 0) {
      return {
        averageMood: 0,
        lowestMood: 0,
        highestMood: 0,
        moodVariance: 0,
        totalEntries: 0,
        completionRate: 0,
        trendDirection: 'stable',
        moodDistribution: this.getEmptyDistribution(),
      };
    }

    const ratings = entries.map(e => e.rating);
    const averageMood = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const lowestMood = Math.min(...ratings);
    const highestMood = Math.max(...ratings);

    // Calculate variance
    const variance = ratings.reduce((sum, rating) => {
      return sum + Math.pow(rating - averageMood, 2);
    }, 0) / ratings.length;

    // Calculate completion rate
    const daysInPeriod = this.getDaysInPeriod(period);
    const completionRate = entries.length / daysInPeriod;

    // Determine trend direction
    const trendDirection = this.determineTrendDirection(entries);

    // Calculate mood distribution
    const moodDistribution = this.calculateMoodDistribution(ratings);

    return {
      averageMood,
      lowestMood,
      highestMood,
      moodVariance: variance,
      totalEntries: entries.length,
      completionRate,
      trendDirection,
      moodDistribution,
    };
  }

  /**
   * Get number of days in a period
   */
  private getDaysInPeriod(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.Week:
        return 7;
      case TimePeriod.Month:
        return 30;
      case TimePeriod.Quarter:
        return 90;
      case TimePeriod.Year:
        return 365;
    }
  }

  /**
   * Determine trend direction based on entries
   */
  private determineTrendDirection(entries: MoodEntry[]): 'improving' | 'declining' | 'stable' {
    if (entries.length < 2) {
      return 'stable';
    }

    // Sort by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Compare first half average with second half average
    const midPoint = Math.floor(sortedEntries.length / 2);
    const firstHalf = sortedEntries.slice(0, midPoint);
    const secondHalf = sortedEntries.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.rating, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.rating, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (Math.abs(difference) < 0.5) {
      return 'stable';
    } else if (difference > 0) {
      return 'improving';
    } else {
      return 'declining';
    }
  }

  /**
   * Calculate mood distribution
   */
  private calculateMoodDistribution(ratings: number[]): Record<string, number> {
    const distribution = this.getEmptyDistribution();

    ratings.forEach(rating => {
      distribution[rating.toString()] = (distribution[rating.toString()] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get empty mood distribution object
   */
  private getEmptyDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i.toString()] = 0;
    }
    return distribution;
  }

  /**
   * Generate insights from statistics (FR-004)
   */
  private generateInsights(statistics: MoodStatistics, period: TimePeriod): string[] {
    const insights: string[] = [];

    // Trend direction insight
    if (statistics.totalEntries >= 3) {
      if (statistics.trendDirection === 'improving') {
        insights.push('Your mood has been improving over this period. Keep up the positive momentum!');
      } else if (statistics.trendDirection === 'declining') {
        insights.push('Your mood has been declining recently. Consider reaching out for support if needed.');
      } else {
        insights.push('Your mood has been relatively stable during this period.');
      }
    }

    // Completion rate insight
    if (statistics.totalEntries > 0) {
      if (statistics.completionRate < 0.5) {
        insights.push(`Your completion rate is ${Math.round(statistics.completionRate * 100)}%. Try to log more consistently for better insights.`);
      } else if (statistics.completionRate > 0.8) {
        insights.push('Great job on consistent mood tracking! This helps provide accurate trends.');
      }
    }

    // Average mood insight
    if (statistics.averageMood >= 7) {
      insights.push('Your average mood is in the positive range. You\'re doing well!');
    } else if (statistics.averageMood <= 4) {
      insights.push('Your average mood has been low. Remember to practice self-care and seek support when needed.');
    }

    // Variability insight
    if (statistics.moodVariance > 4) {
      insights.push('Your mood has been quite variable. Consider identifying triggers for these fluctuations.');
    } else if (statistics.moodVariance < 1 && statistics.totalEntries > 5) {
      insights.push('Your mood has been very consistent during this period.');
    }

    return insights;
  }
}
