/**
 * Onboarding System - Main exports
 */

// Core types
export * from './types/onboarding.types';

// Flow implementations
export { BaseOnboardingFlow } from './onboarding/base-flow';
export { NotionOnboardingFlow } from './onboarding/notion-flow';
export { TrelloOnboardingFlow } from './onboarding/trello-flow';
export { FreeFormChatFlow } from './onboarding/chat-flow';
export { OnboardingManager, onboardingManager } from './onboarding/onboarding-manager';

// Analytics
export { AnalyticsService, analyticsService } from './analytics/analytics-service';

// React components
export { default as ProductSelector } from '../components/onboarding/ProductSelector';
export { default as OnboardingProgress } from '../components/onboarding/OnboardingProgress';
