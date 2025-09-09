/**
 * Simplified Onboarding Manager - Essential functionality only
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  OnboardingProduct, 
  OnboardingFlow, 
  OnboardingProgress, 
  ConversationContext, 
  ConversationTurn,
  OnboardingEvent
} from '@/lib/types/onboarding.types';
import { BaseOnboardingFlow } from './base-flow';
import { NotionOnboardingFlow } from './notion-flow';
import { TrelloOnboardingFlow } from './trello-flow';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { StepAnnouncer } from './step-announcer';

export class OnboardingManager {
  private activeFlow: BaseOnboardingFlow | null = null;
  private sessionId: string = '';
  private conversationHistory: ConversationTurn[] = [];
  private sessionStartTime: Date = new Date();

  // Available products for onboarding
  private readonly availableProducts: OnboardingProduct[] = [
    {
      id: 'notion',
      name: 'Notion',
      description: 'All-in-one workspace for notes, docs, and databases',
      category: 'Productivity',
      estimatedTime: 20,
      difficulty: 'medium',
      icon: '📝',
      color: '#000000'
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Visual project management with Kanban boards',
      category: 'Project Management', 
      estimatedTime: 15,
      difficulty: 'easy',
      icon: '📋',
      color: '#0052CC'
    },
    // {
    //   id: 'slack',
    //   name: 'Slack',
    //   description: 'Team communication and collaboration platform',
    //   category: 'Communication',
    //   estimatedTime: 12,
    //   difficulty: 'easy',
    //   icon: '💬',
    //   color: '#4A154B'
    // },
    // {
    //   id: 'figma',
    //   name: 'Figma',
    //   description: 'Collaborative design and prototyping tool',
    //   category: 'Design',
    //   estimatedTime: 25,
    //   difficulty: 'hard',
    //   icon: '🎨',
    //   color: '#F24E1E'
    // }
  ];

  constructor() {
    this.sessionId = uuidv4();
    this.sessionStartTime = new Date();
  }

  // Product selection and flow initialization
  public getAvailableProducts(): OnboardingProduct[] {
    return this.availableProducts;
  }

  public selectProduct(productId: string): { success: boolean; message: string; flow?: OnboardingFlow } {
    const product = this.availableProducts.find(p => p.id === productId);
    if (!product) {
      return { success: false, message: `Product '${productId}' not found` };
    }

    try {
      this.activeFlow = this.createFlowInstance(productId);
      const flow = this.activeFlow.getFlow();
      
      // Simple analytics tracking
      analyticsService.trackEvent(this.sessionId, 'product_selected', {
        product_id: productId,
        product_name: product.name
      });

      return { 
        success: true, 
        message: `Selected ${product.name}. Starting onboarding...`,
        flow 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to initialize ${product.name} onboarding: ${error}` 
      };
    }
  }

  private createFlowInstance(productId: string): BaseOnboardingFlow {
    switch (productId) {
      case 'notion':
        return new NotionOnboardingFlow();
      case 'trello':
        return new TrelloOnboardingFlow();
      default:
        throw new Error(`Onboarding flow not implemented for product: ${productId}`);
    }
  }

  // Simplified conversation management
  public addConversationTurn(
    speaker: 'user' | 'assistant', 
    content: string, 
    audioTranscript?: string
  ): ConversationTurn {
    const turn: ConversationTurn = {
      id: uuidv4(),
      timestamp: new Date(),
      speaker,
      content,
      audioTranscript,
      stepId: this.activeFlow?.getCurrentStep()?.id,
      confidence: audioTranscript ? this.calculateTranscriptionConfidence(audioTranscript) : 1.0
    };

    this.conversationHistory.push(turn);
    
    // Limit conversation history for performance (reduced from 50 to 25)
    if (this.conversationHistory.length > 25) {
      this.conversationHistory = this.conversationHistory.slice(-25);
    }

    return turn;
  }

  private calculateTranscriptionConfidence(transcript: string): number {
    // Simplified confidence calculation
    let confidence = 0.8;
    
    if (transcript.length > 10) confidence += 0.1;
    if (transcript.includes('?') || transcript.includes('.')) confidence += 0.05;
    if (/^[A-Z]/.test(transcript)) confidence += 0.05;
    
    if (transcript.includes('uh') || transcript.includes('um')) confidence -= 0.1;
    if (transcript.length < 3) confidence -= 0.2;
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }

  // Simplified flow progression
  public async processUserInput(userInput: string, audioTranscript?: string): Promise<{
    success: boolean;
    message: string;
    systemPrompt?: string;
    progress?: OnboardingProgress;
    context?: ConversationContext;
    completed?: boolean;
    stepGuidance?: string;
  }> {
    if (!this.activeFlow) {
      return { 
        success: false, 
        message: 'No active onboarding flow. Please select a product first.' 
      };
    }

    // Record user input
    const startTime = Date.now();
    this.addConversationTurn('user', userInput, audioTranscript);

    try {
      // Get current step before advancing
      const currentStep = this.activeFlow.getCurrentStep();
      
      // Process the input and potentially advance the flow
      const advanceResult = await this.activeFlow.advanceStep(userInput);
      const responseTime = Date.now() - startTime;
      
      // Track response time (simplified)
      if (currentStep) {
        analyticsService.trackResponseTime(this.sessionId, currentStep.id, responseTime);
      }

      // Create updated progress and context
      const progress = this.activeFlow.createProgress(this.sessionId);
      const context = this.activeFlow.createConversationContext(
        this.sessionId,
        progress,
        this.conversationHistory
      );

      // Generate step-specific guidance
      let stepGuidance = '';
      if (advanceResult.success) {
        const nextStep = this.activeFlow.getCurrentStep();
        if (nextStep && currentStep) {
          stepGuidance = StepAnnouncer.generateProgressAnnouncement(
            currentStep,
            nextStep,
            progress
          );
        } else if (nextStep) {
          const stepNumber = this.activeFlow.getFlow().steps.findIndex(s => s.id === nextStep.id) + 1;
          stepGuidance = StepAnnouncer.generateStepIntroduction(
            nextStep,
            stepNumber,
            this.activeFlow.getFlow().steps.length
          );
        }
      }

      // Check if onboarding completed
      if (advanceResult.success && progress.status === 'completed') {
        const totalTime = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
        analyticsService.trackOnboardingCompleted(
          this.sessionId,
          this.activeFlow.getFlow().productId,
          totalTime,
          progress.completionRate
        );
      }

      return {
        success: advanceResult.success,
        message: advanceResult.message,
        systemPrompt: this.activeFlow.getFlow().systemPrompt,
        progress,
        context,
        completed: progress.status === 'completed',
        stepGuidance
      };

    } catch (error) {
      const errorMessage = `Error processing input: ${error}`;
      this.addConversationTurn('assistant', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  // Simplified session management
  public pauseSession(): void {
    if (this.activeFlow) {
      analyticsService.trackEvent(this.sessionId, 'session_paused', {
        product_id: this.activeFlow.getFlow().productId
      });
    }
  }

  public resumeSession(): void {
    if (this.activeFlow) {
      analyticsService.trackEvent(this.sessionId, 'session_resumed', {
        product_id: this.activeFlow.getFlow().productId
      });
    }
  }

  public resetSession(): void {
    // Track abandonment if there was an active flow
    if (this.activeFlow) {
      const progress = this.getCurrentProgress();
      const currentStep = this.activeFlow.getCurrentStep();
      
      analyticsService.trackOnboardingAbandoned(
        this.sessionId,
        this.activeFlow.getFlow().productId,
        currentStep?.id || 'unknown',
        'manual_reset',
        progress?.completionRate || 0
      );
    }

    this.activeFlow = null;
    this.sessionId = uuidv4();
    this.conversationHistory = [];
    this.sessionStartTime = new Date();
  }

  // State management methods
  public getCurrentFlow(): OnboardingFlow | null {
    return this.activeFlow ? this.activeFlow.getFlow() : null;
  }

  public getCurrentProgress(): OnboardingProgress | null {
    return this.activeFlow ? this.activeFlow.createProgress(this.sessionId) : null;
  }

  public getCurrentContext(): ConversationContext | null {
    if (!this.activeFlow) return null;
    
    const progress = this.getCurrentProgress();
    if (!progress) return null;

    return this.activeFlow.createConversationContext(
      this.sessionId,
      progress,
      this.conversationHistory
    );
  }

  public getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }

  // Simplified analytics
  public getSessionId(): string {
    return this.sessionId;
  }

  public getPerformanceMetrics(): {
    averageResponseTime: number;
    completionRates: Record<string, number>;
    dropoffAnalysis: Record<string, string[]>;
  } {
    return {
      averageResponseTime: analyticsService.getAverageResponseTime(),
      completionRates: analyticsService.getCompletionRates(),
      dropoffAnalysis: analyticsService.getDropoffAnalysis()
    };
  }

  // Generate step-specific guidance messages
  public generateStepGuidance(step: any): string {
    if (!this.activeFlow) return '';
    
    const productName = this.activeFlow.getFlow().productId;
    const stepNumber = this.activeFlow.getFlow().steps.findIndex(s => s.id === step.id) + 1;
    const totalSteps = this.activeFlow.getFlow().steps.length;
    
    // Generate contextual guidance based on step type and product
    let guidance = `Great! Now we're on step ${stepNumber} of ${totalSteps}: ${step.title}. `;
    
    switch (step.type) {
      case 'information':
        guidance += `Let me explain ${step.description.toLowerCase()}. This will help you understand how to use ${productName} effectively.`;
        break;
      case 'action':
        guidance += `Time to take action! ${step.description} I'll guide you through each part of this step.`;
        break;
      case 'validation':
        guidance += `Let's validate your progress. ${step.description} Tell me when you've completed this step.`;
        break;
      case 'completion':
        guidance += `Congratulations! ${step.description} You've successfully completed the ${productName} onboarding!`;
        break;
      default:
        guidance += step.description;
    }
    
    // Add estimated time if available
    if (step.estimatedTime > 60) {
      const minutes = Math.ceil(step.estimatedTime / 60);
      guidance += ` This should take about ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }
    
    // Add encouragement for required steps
    if (step.required) {
      guidance += " Don't worry if you need help - I'm here to guide you through every detail!";
    }
    
    return guidance;
  }

  // Utility methods
  public getSystemPromptForCurrentStep(): string | null {
    if (!this.activeFlow) return null;
    return this.activeFlow.getFlow().systemPrompt;
  }

  public isOnboardingActive(): boolean {
    return this.activeFlow !== null;
  }

  public getEstimatedTimeRemaining(): number {
    if (!this.activeFlow) return 0;
    
    const flow = this.activeFlow.getFlow();
    const currentStep = this.activeFlow.getCurrentStep();
    
    if (!currentStep) return 0;
    
    const currentStepIndex = flow.steps.findIndex(step => step.id === currentStep.id);
    const remainingSteps = flow.steps.slice(currentStepIndex);
    
    return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  }
}

// Export singleton instance for global use
export const onboardingManager = new OnboardingManager();
