/**
 * Onboarding System Types - Core interfaces for multi-product onboarding
 */

export interface OnboardingProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  icon?: string;
  color?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'information' | 'action' | 'validation' | 'completion';
  required: boolean;
  estimatedTime: number; // in seconds
  validationCriteria?: string[];
  nextStepId?: string;
  alternativeSteps?: string[];
}

export interface OnboardingFlow {
  productId: string;
  steps: OnboardingStep[];
  totalSteps: number;
  estimatedDuration: number;
  systemPrompt: string;
  welcomeMessage: string;
  completionMessage: string;
}

export interface OnboardingProgress {
  sessionId: string;
  productId: string;
  currentStepId: string;
  completedSteps: string[];
  startTime: Date;
  lastActivity: Date;
  completionRate: number; // 0-100
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  timeSpent: number; // in seconds
  errors: OnboardingError[];
}

export interface OnboardingError {
  id: string;
  timestamp: Date;
  type: 'user_confusion' | 'system_error' | 'validation_failed' | 'timeout';
  stepId: string;
  message: string;
  resolved: boolean;
  resolution?: string;
}

export interface ConversationContext {
  sessionId: string;
  productId: string;
  currentStep: OnboardingStep;
  userProgress: OnboardingProgress;
  conversationHistory: ConversationTurn[];
  userPreferences: UserPreferences;
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'assistant';
  content: string;
  audioTranscript?: string;
  stepId?: string;
  intent?: string;
  confidence?: number;
}

export interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'interactive';
  pace: 'slow' | 'normal' | 'fast';
  preferredModality: 'voice' | 'text' | 'mixed';
  skipBasics: boolean;
  reminderFrequency: 'high' | 'medium' | 'low' | 'none';
}

export interface OnboardingAnalytics {
  sessionId: string;
  productId: string;
  metrics: {
    responseTime: number[];
    userSatisfaction?: number;
    completionRate: number;
    dropoffPoints: string[];
    commonErrors: OnboardingError[];
    averageStepTime: Record<string, number>;
  };
  timestamp: Date;
}

export interface OnboardingState {
  selectedProduct: OnboardingProduct | null;
  currentFlow: OnboardingFlow | null;
  progress: OnboardingProgress | null;
  context: ConversationContext | null;
  isActive: boolean;
  isPaused: boolean;
}

// Event types for onboarding system
export type OnboardingEvent = 
  | { type: 'PRODUCT_SELECTED'; payload: OnboardingProduct }
  | { type: 'FLOW_STARTED'; payload: OnboardingFlow }
  | { type: 'STEP_COMPLETED'; payload: { stepId: string; timeSpent: number } }
  | { type: 'STEP_FAILED'; payload: { stepId: string; error: OnboardingError } }
  | { type: 'PROGRESS_UPDATED'; payload: OnboardingProgress }
  | { type: 'SESSION_PAUSED'; payload: string }
  | { type: 'SESSION_RESUMED'; payload: string }
  | { type: 'SESSION_COMPLETED'; payload: OnboardingAnalytics }
  | { type: 'SESSION_ABANDONED'; payload: { reason: string; stepId: string } };
