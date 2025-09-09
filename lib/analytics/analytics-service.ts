/**
 * Simplified Analytics Service - Essential tracking only
 */

interface AnalyticsEvent {
  sessionId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
}

interface ResponseTimeMetrics {
  sessionId: string;
  stepId: string;
  responseTime: number;
  timestamp: Date;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private responseMetrics: ResponseTimeMetrics[] = [];
  private maxEvents = 100; // Reduced from 1000

  // Simplified event tracking
  public trackEvent(
    sessionId: string, 
    event: string, 
    properties: Record<string, any> = {}
  ): void {
    const analyticsEvent: AnalyticsEvent = {
      sessionId,
      event,
      properties,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);
    
    // Memory management
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-50); // Keep only last 50
    }
    
    // Only log critical events in development
    if (process.env.NODE_ENV === 'development' && this.isCriticalEvent(event)) {
      console.log('📊', event, properties);
    }
  }

  private isCriticalEvent(event: string): boolean {
    return [
      'onboarding_started',
      'onboarding_completed', 
      'onboarding_abandoned',
      'product_selected',
      'critical_error'
    ].includes(event);
  }

  // Essential onboarding tracking only
  public trackOnboardingStart(sessionId: string, productId: string): void {
    this.trackEvent(sessionId, 'onboarding_started', { product_id: productId });
  }

  public trackOnboardingCompleted(
    sessionId: string, 
    productId: string, 
    totalTime: number,
    completionRate: number
  ): void {
    this.trackEvent(sessionId, 'onboarding_completed', {
      product_id: productId,
      total_time_seconds: totalTime,
      completion_rate: completionRate,
    });
  }

  public trackOnboardingAbandoned(
    sessionId: string, 
    productId: string, 
    stepId: string,
    reason: string,
    completionRate: number
  ): void {
    this.trackEvent(sessionId, 'onboarding_abandoned', {
      product_id: productId,
      step_id: stepId,
      reason,
      completion_rate: completionRate,
    });
  }

  // Simplified response time tracking
  public trackResponseTime(
    sessionId: string, 
    stepId: string, 
    responseTime: number
  ): void {
    const metric: ResponseTimeMetrics = {
      sessionId,
      stepId,
      responseTime,
      timestamp: new Date(),
    };

    this.responseMetrics.push(metric);

    // Keep only recent metrics
    if (this.responseMetrics.length > 50) {
      this.responseMetrics = this.responseMetrics.slice(-25);
    }
  }

  // Simplified getters
  public getAverageResponseTime(): number {
    if (this.responseMetrics.length === 0) return 0;
    const total = this.responseMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return total / this.responseMetrics.length;
  }

  public getCompletionRates(): Record<string, number> {
    const completionStats: Record<string, { completed: number; started: number }> = {};

    this.events.forEach(event => {
      if (event.event === 'onboarding_started') {
        const productId = event.properties.product_id;
        if (!completionStats[productId]) {
          completionStats[productId] = { completed: 0, started: 0 };
        }
        completionStats[productId].started++;
      } else if (event.event === 'onboarding_completed') {
        const productId = event.properties.product_id;
        if (completionStats[productId]) {
          completionStats[productId].completed++;
        }
      }
    });

    const rates: Record<string, number> = {};
    Object.entries(completionStats).forEach(([productId, stats]) => {
      rates[productId] = stats.started > 0 ? (stats.completed / stats.started) * 100 : 0;
    });

    return rates;
  }

  public getDropoffAnalysis(): Record<string, string[]> {
    const dropoffPoints: Record<string, string[]> = {};

    this.events.forEach(event => {
      if (event.event === 'onboarding_abandoned') {
        const productId = event.properties.product_id;
        const stepId = event.properties.step_id;
        
        if (!dropoffPoints[productId]) {
          dropoffPoints[productId] = [];
        }
        dropoffPoints[productId].push(stepId);
      }
    });

    return dropoffPoints;
  }

  // Utility methods
  public getRecentEvents(limit: number = 10): AnalyticsEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public clearAnalytics(): void {
    this.events = [];
    this.responseMetrics = [];
  }

  // Remove detailed methods that are not essential for MVP
  public trackStepCompleted = this.trackEvent.bind(this);
  public trackStepFailed = this.trackEvent.bind(this);
  public trackAudioQuality = () => {}; // Stub - not critical for MVP
  public trackVoiceInteraction = () => {}; // Stub - not critical for MVP
}

// Global analytics instance
export const analyticsService = new AnalyticsService();
