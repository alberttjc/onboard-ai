/**
 * Additional TypeScript Declarations for Onboarding System
 */

// Extend Window interface for analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    posthog: {
      capture: (event: string, properties?: Record<string, any>) => void;
    };
    mixpanel: {
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

// Custom hooks return types
export interface UseOnboardingReturn {
  isOnboardingActive: boolean;
  currentProduct: string | null;
  progress: number;
  currentStep: string | null;
  startOnboarding: (productId: string) => Promise<void>;
  pauseOnboarding: () => void;
  resumeOnboarding: () => void;
  restartOnboarding: () => void;
}

// Component prop types
export interface OnboardingComponentProps {
  className?: string;
  children?: React.ReactNode;
  onError?: (error: Error) => void;
}

// Error types for better error handling
export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: string,
    public step?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}

export class AudioProcessingError extends Error {
  constructor(
    message: string,
    public audioContext?: AudioContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AudioProcessingError';
  }
}

export class AnalyticsError extends Error {
  constructor(
    message: string,
    public service: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

// Export to make declarations available
export {};
