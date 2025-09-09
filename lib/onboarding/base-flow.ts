/**
 * Base Onboarding Flow Manager - Core onboarding orchestration
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  OnboardingFlow, 
  OnboardingStep, 
  OnboardingProgress, 
  OnboardingError,
  ConversationContext,
  ConversationTurn,
  UserPreferences,
  OnboardingAnalytics
} from '@/lib/types/onboarding.types';

export abstract class BaseOnboardingFlow {
  protected flowId: string;
  protected productId: string;
  protected steps: OnboardingStep[] = [];
  protected currentStepIndex: number = 0;
  protected startTime: Date = new Date();
  protected analyticsData: OnboardingAnalytics;

  constructor(productId: string) {
    this.flowId = uuidv4();
    this.productId = productId;
    this.analyticsData = {
      sessionId: this.flowId,
      productId,
      metrics: {
        responseTime: [],
        completionRate: 0,
        dropoffPoints: [],
        commonErrors: [],
        averageStepTime: {}
      },
      timestamp: new Date()
    };
  }

  // Abstract methods to be implemented by specific product flows
  abstract initializeSteps(): OnboardingStep[];
  abstract generateSystemPrompt(): string;
  abstract getWelcomeMessage(): string;
  abstract getCompletionMessage(): string;
  abstract validateStep(stepId: string, userInput: string): Promise<boolean>;

  // Core flow management methods
  public getFlow(): OnboardingFlow {
    if (this.steps.length === 0) {
      this.steps = this.initializeSteps();
    }

    return {
      productId: this.productId,
      steps: this.steps,
      totalSteps: this.steps.length,
      estimatedDuration: this.calculateTotalDuration(),
      systemPrompt: this.generateSystemPrompt(),
      welcomeMessage: this.getWelcomeMessage(),
      completionMessage: this.getCompletionMessage()
    };
  }

  public getCurrentStep(): OnboardingStep | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  public getNextStep(): OnboardingStep | null {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return null;

    if (currentStep.nextStepId) {
      return this.steps.find(step => step.id === currentStep.nextStepId) || null;
    }

    if (this.currentStepIndex + 1 < this.steps.length) {
      return this.steps[this.currentStepIndex + 1];
    }

    return null;
  }

  public async advanceStep(userInput?: string): Promise<{ success: boolean; message: string }> {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      return { success: false, message: 'No current step found' };
    }

    // Validate step if user input provided
    if (userInput && currentStep.required) {
      const isValid = await this.validateStep(currentStep.id, userInput);
      if (!isValid) {
        this.recordError(currentStep.id, 'validation_failed', 'Step validation failed');
        return { success: false, message: 'Please complete the current step before proceeding' };
      }
    }

    // Record step completion time
    const stepStartTime = this.getStepStartTime(currentStep.id);
    const stepDuration = stepStartTime ? Date.now() - stepStartTime : 0;
    this.recordStepCompletion(currentStep.id, stepDuration);

    // Move to next step
    const nextStep = this.getNextStep();
    if (nextStep) {
      this.currentStepIndex = this.steps.findIndex(step => step.id === nextStep.id);
      this.setStepStartTime(nextStep.id, Date.now());
      return { success: true, message: `Advanced to: ${nextStep.title}` };
    } else {
      // Flow completed
      this.analyticsData.metrics.completionRate = 100;
      return { success: true, message: 'Onboarding completed successfully!' };
    }
  }

  public createProgress(sessionId: string): OnboardingProgress {
    const completedSteps = this.steps
      .slice(0, this.currentStepIndex)
      .map(step => step.id);

    return {
      sessionId,
      productId: this.productId,
      currentStepId: this.getCurrentStep()?.id || '',
      completedSteps,
      startTime: this.startTime,
      lastActivity: new Date(),
      completionRate: this.calculateCompletionRate(),
      status: this.currentStepIndex === 0 ? 'not_started' : 
              this.currentStepIndex >= this.steps.length ? 'completed' : 'in_progress',
      timeSpent: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      errors: []
    };
  }

  public createConversationContext(
    sessionId: string, 
    progress: OnboardingProgress,
    conversationHistory: ConversationTurn[] = [],
    userPreferences: UserPreferences = this.getDefaultUserPreferences()
  ): ConversationContext {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      throw new Error('No current step available for context creation');
    }

    return {
      sessionId,
      productId: this.productId,
      currentStep,
      userProgress: progress,
      conversationHistory,
      userPreferences
    };
  }

  // Helper methods
  private calculateTotalDuration(): number {
    return this.steps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  private calculateCompletionRate(): number {
    if (this.steps.length === 0) return 0;
    return Math.round((this.currentStepIndex / this.steps.length) * 100);
  }

  private recordError(stepId: string, type: OnboardingError['type'], message: string): void {
    const error: OnboardingError = {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      stepId,
      message,
      resolved: false
    };
    this.analyticsData.metrics.commonErrors.push(error);
  }

  private recordStepCompletion(stepId: string, duration: number): void {
    this.analyticsData.metrics.averageStepTime[stepId] = duration;
    this.analyticsData.metrics.responseTime.push(duration);
  }

  private stepStartTimes: Record<string, number> = {};

  private getStepStartTime(stepId: string): number | undefined {
    return this.stepStartTimes[stepId];
  }

  private setStepStartTime(stepId: string, timestamp: number): void {
    this.stepStartTimes[stepId] = timestamp;
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      communicationStyle: 'interactive',
      pace: 'normal',
      preferredModality: 'voice',
      skipBasics: false,
      reminderFrequency: 'medium'
    };
  }

  // Analytics methods
  public getAnalytics(): OnboardingAnalytics {
    return {
      ...this.analyticsData,
      timestamp: new Date()
    };
  }

  public recordResponseTime(duration: number): void {
    this.analyticsData.metrics.responseTime.push(duration);
  }

  public recordDropoffPoint(stepId: string): void {
    if (!this.analyticsData.metrics.dropoffPoints.includes(stepId)) {
      this.analyticsData.metrics.dropoffPoints.push(stepId);
    }
  }
}
