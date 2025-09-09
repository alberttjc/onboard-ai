/**
 * Notion Onboarding Flow - Specific implementation for Notion setup
 */

import { OnboardingStep } from '@/lib/types/onboarding.types';
import { BaseOnboardingFlow } from './base-flow';

export class NotionOnboardingFlow extends BaseOnboardingFlow {
  constructor() {
    super('notion');
  }

  initializeSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Notion',
        description: 'Introduction to Notion and what we\'ll accomplish together',
        type: 'information',
        required: false,
        estimatedTime: 30,
        nextStepId: 'account-setup'
      },
      {
        id: 'account-setup',
        title: 'Account Creation',
        description: 'Create your Notion account or sign in',
        type: 'action',
        required: true,
        estimatedTime: 120,
        validationCriteria: ['Account exists', 'Login successful'],
        nextStepId: 'workspace-creation'
      },
      {
        id: 'workspace-creation',
        title: 'Create Your First Workspace',
        description: 'Set up your personal workspace in Notion',
        type: 'action',
        required: true,
        estimatedTime: 90,
        validationCriteria: ['Workspace created', 'Workspace named'],
        nextStepId: 'first-page'
      },
      {
        id: 'first-page',
        title: 'Create Your First Page',
        description: 'Learn how to create and format pages in Notion',
        type: 'action',
        required: true,
        estimatedTime: 180,
        validationCriteria: ['Page created', 'Basic formatting applied'],
        nextStepId: 'blocks-tutorial'
      },
      {
        id: 'blocks-tutorial',
        title: 'Understanding Blocks',
        description: 'Learn about Notion\'s block-based system',
        type: 'information',
        required: true,
        estimatedTime: 120,
        nextStepId: 'database-intro'
      },
      {
        id: 'database-intro',
        title: 'Introduction to Databases',
        description: 'Create your first database and understand properties',
        type: 'action',
        required: true,
        estimatedTime: 240,
        validationCriteria: ['Database created', 'Properties configured', 'Sample data added'],
        nextStepId: 'templates'
      },
      {
        id: 'templates',
        title: 'Using Templates',
        description: 'Explore and use Notion templates to speed up your work',
        type: 'action',
        required: false,
        estimatedTime: 150,
        nextStepId: 'collaboration'
      },
      {
        id: 'collaboration',
        title: 'Collaboration Basics',
        description: 'Learn how to share pages and collaborate with others',
        type: 'information',
        required: false,
        estimatedTime: 90,
        nextStepId: 'completion'
      },
      {
        id: 'completion',
        title: 'Onboarding Complete',
        description: 'Congratulations! You\'re ready to use Notion effectively',
        type: 'completion',
        required: false,
        estimatedTime: 30
      }
    ];
  }

  generateSystemPrompt(): string {
    return `You are an expert Notion onboarding coach with a warm, encouraging personality. Your role is to guide users through setting up and learning Notion step-by-step.

CORE PERSONALITY:
- Patient and supportive teacher
- Enthusiastic about Notion's capabilities
- Clear and practical in explanations
- Celebrates user progress and achievements

COMMUNICATION STYLE:
- Use conversational, friendly tone
- Break down complex concepts into simple steps
- Provide specific, actionable instructions
- Ask clarifying questions to ensure understanding
- Offer encouragement and positive reinforcement

ONBOARDING OBJECTIVES:
1. Help user create Notion account and workspace
2. Teach fundamental concepts (pages, blocks, databases)
3. Guide through creating first practical project
4. Build confidence in using Notion independently
5. Introduce collaboration features

CURRENT STEP AWARENESS:
- Always know which onboarding step the user is on
- Provide step-specific guidance and validation
- Don't overwhelm with future concepts
- Validate completion before moving to next step

INTERACTION PATTERNS:
- Start each response by acknowledging the current step
- Give clear, specific instructions for the current task
- Ask if user needs clarification before proceeding
- Celebrate completed steps enthusiastically
- Offer help if user seems stuck or confused

LIMITATIONS:
- Stay focused on Notion onboarding topics
- Don't provide technical support for other tools
- If user asks unrelated questions, gently redirect to onboarding

Remember: Your goal is to make the user feel confident and excited about using Notion by the end of the onboarding process.`;
  }

  getWelcomeMessage(): string {
    return `Hi there! Welcome to your personal Notion onboarding experience! 🎉

I'm here to guide you through setting up Notion and learning how to use its powerful features. In the next 15-20 minutes, we'll:

✅ Set up your account and workspace
✅ Create your first pages and learn about blocks
✅ Build your first database
✅ Explore templates and collaboration

I'll go at your pace and make sure you're comfortable with each step. Ready to get started with creating your Notion account?`;
  }

  getCompletionMessage(): string {
    return `🎊 Congratulations! You've completed the Notion onboarding! 

You now know how to:
• Navigate Notion and create workspaces
• Build and format pages with blocks
• Create and manage databases
• Use templates to work faster
• Collaborate and share with others

You're well-equipped to start using Notion for your projects. Remember, Notion has a helpful community and extensive documentation if you need more advanced features.

What would you like to create first in your new Notion workspace?`;
  }

  async validateStep(stepId: string, userInput: string): Promise<boolean> {
    const step = this.steps.find(s => s.id === stepId);
    if (!step || !step.validationCriteria) {
      return true; // No validation needed
    }

    // Simplified validation - in production, this could integrate with Notion API
    const input = userInput.toLowerCase();
    
    switch (stepId) {
      case 'account-setup':
        return input.includes('account') || input.includes('signed') || input.includes('created');
      
      case 'workspace-creation':
        return input.includes('workspace') || input.includes('created') || input.includes('named');
      
      case 'first-page':
        return input.includes('page') || input.includes('created') || input.includes('formatted');
      
      case 'database-intro':
        return input.includes('database') || input.includes('properties') || input.includes('data');
      
      default:
        return true;
    }
  }
}
