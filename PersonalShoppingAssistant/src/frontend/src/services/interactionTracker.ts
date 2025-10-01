/**
 * Interaction Tracker Service
 * TASK-022: API Data Flow Integration
 * 
 * Tracks user interactions and provides analytics for personalization
 * and recommendation improvements.
 */

import { useApp } from '../contexts/AppContext';

export interface InteractionEvent {
  id: string;
  type: 'view' | 'like' | 'dislike' | 'favorite' | 'rating' | 'search' | 'filter' | 'compare' | 'share';
  productId?: string;
  searchTerm?: string;
  filterData?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface InteractionAnalytics {
  totalInteractions: number;
  interactionsByType: Record<string, number>;
  popularProducts: Array<{ productId: string; views: number; likes: number }>;
  searchTrends: Array<{ term: string; count: number; lastSearched: Date }>;
  userEngagement: {
    averageSessionLength: number;
    interactionsPerSession: number;
    mostActiveHour: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class InteractionTracker {
  private events: InteractionEvent[] = [];
  private sessionId: string;
  private sessionStartTime: Date;
  private appContext: ReturnType<typeof useApp> | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
  }

  // Initialize with app context
  initialize(appContext: ReturnType<typeof useApp>) {
    this.appContext = appContext;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track a new interaction
  trackInteraction(
    type: InteractionEvent['type'],
    data: {
      productId?: string;
      searchTerm?: string;
      filterData?: Record<string, any>;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const event: InteractionEvent = {
      id: this.generateEventId(),
      type,
      productId: data.productId,
      searchTerm: data.searchTerm,
      filterData: data.filterData,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.appContext?.state.userInteractions ? 'current_user' : undefined,
      metadata: data.metadata,
    };

    this.events.push(event);
    this.updateAppContext(event);
    this.sendToAnalytics(event);
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update app context with interaction
  private updateAppContext(event: InteractionEvent): void {
    if (!this.appContext) return;

    switch (event.type) {
      case 'view':
        if (event.productId) {
          this.appContext.trackProductView(event.productId);
        }
        break;
      case 'like':
        if (event.productId) {
          this.appContext.trackProductLike(event.productId);
        }
        break;
      case 'dislike':
        if (event.productId) {
          this.appContext.trackProductDislike(event.productId);
        }
        break;
      case 'search':
        if (event.searchTerm) {
          this.appContext.trackSearch(event.searchTerm);
        }
        break;
    }
  }

  // Send interaction to analytics (placeholder for future implementation)
  private sendToAnalytics(event: InteractionEvent): void {
    // This would typically send data to an analytics service
    // Analytics event tracking would be implemented here
  }

  // Track product view
  trackProductView(productId: string, metadata?: Record<string, any>): void {
    this.trackInteraction('view', { productId, metadata });
  }

  // Track product like
  trackProductLike(productId: string, metadata?: Record<string, any>): void {
    this.trackInteraction('like', { productId, metadata });
  }

  // Track product dislike
  trackProductDislike(productId: string, metadata?: Record<string, any>): void {
    this.trackInteraction('dislike', { productId, metadata });
  }

  // Track search
  trackSearch(searchTerm: string, metadata?: Record<string, any>): void {
    this.trackInteraction('search', { searchTerm, metadata });
  }

  // Track filter usage
  trackFilter(filterData: Record<string, any>, metadata?: Record<string, any>): void {
    this.trackInteraction('filter', { filterData, metadata });
  }

  // Track product comparison
  trackCompare(productIds: string[], metadata?: Record<string, any>): void {
    this.trackInteraction('compare', { 
      metadata: { 
        ...metadata, 
        comparedProducts: productIds 
      } 
    });
  }

  // Track share action
  trackShare(productId: string, platform: string, metadata?: Record<string, any>): void {
    this.trackInteraction('share', { 
      productId, 
      metadata: { 
        ...metadata, 
        platform 
      } 
    });
  }

  // Get interaction analytics
  getAnalytics(timeRange?: { start: Date; end: Date }): InteractionAnalytics {
    const start = timeRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = timeRange?.end || new Date();
    
    const filteredEvents = this.events.filter(
      event => event.timestamp >= start && event.timestamp <= end
    );

    // Calculate interactions by type
    const interactionsByType = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate popular products
    const productViews = filteredEvents
      .filter(event => event.type === 'view' && event.productId)
      .reduce((acc, event) => {
        const productId = event.productId!;
        if (!acc[productId]) {
          acc[productId] = { views: 0, likes: 0 };
        }
        acc[productId].views++;
        return acc;
      }, {} as Record<string, { views: number; likes: number }>);

    const productLikes = filteredEvents
      .filter(event => event.type === 'like' && event.productId)
      .reduce((acc, event) => {
        const productId = event.productId!;
        if (!acc[productId]) {
          acc[productId] = { views: 0, likes: 0 };
        }
        acc[productId].likes++;
        return acc;
      }, {} as Record<string, { views: number; likes: number }>);

    const popularProducts = Object.keys(productViews).map(productId => ({
      productId,
      views: productViews[productId]?.views || 0,
      likes: productLikes[productId]?.likes || 0,
    })).sort((a, b) => b.views - a.views);

    // Calculate search trends
    const searchTerms = filteredEvents
      .filter(event => event.type === 'search' && event.searchTerm)
      .reduce((acc, event) => {
        const term = event.searchTerm!;
        if (!acc[term]) {
          acc[term] = { count: 0, lastSearched: event.timestamp };
        }
        acc[term].count++;
        if (event.timestamp > acc[term].lastSearched) {
          acc[term].lastSearched = event.timestamp;
        }
        return acc;
      }, {} as Record<string, { count: number; lastSearched: Date }>);

    const searchTrends = Object.entries(searchTerms).map(([term, data]) => ({
      term,
      count: data.count,
      lastSearched: data.lastSearched,
    })).sort((a, b) => b.count - a.count);

    // Calculate user engagement
    const sessionLength = (Date.now() - this.sessionStartTime.getTime()) / 1000 / 60; // minutes
    const interactionsPerSession = filteredEvents.length;
    const hourCounts = filteredEvents.reduce((acc, event) => {
      const hour = event.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

    return {
      totalInteractions: filteredEvents.length,
      interactionsByType,
      popularProducts,
      searchTrends,
      userEngagement: {
        averageSessionLength: sessionLength,
        interactionsPerSession,
        mostActiveHour: parseInt(mostActiveHour.toString()),
      },
      timeRange: { start, end },
    };
  }

  // Get events for a specific product
  getProductEvents(productId: string): InteractionEvent[] {
    return this.events.filter(event => event.productId === productId);
  }

  // Get events by type
  getEventsByType(type: InteractionEvent['type']): InteractionEvent[] {
    return this.events.filter(event => event.type === type);
  }

  // Clear all events
  clearEvents(): void {
    this.events = [];
  }

  // Export events for analytics
  exportEvents(): InteractionEvent[] {
    return [...this.events];
  }

  // Get session information
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      duration: Date.now() - this.sessionStartTime.getTime(),
      eventCount: this.events.length,
    };
  }
}

// Singleton instance
export const interactionTracker = new InteractionTracker();

// Hook to use the interaction tracker
export const useInteractionTracker = () => {
  return interactionTracker;
};
