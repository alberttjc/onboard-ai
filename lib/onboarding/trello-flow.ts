/**
 * Trello Onboarding Flow - Specific implementation for Trello setup
 */

import { OnboardingStep } from '@/lib/types/onboarding.types';
import { BaseOnboardingFlow } from './base-flow';

export class TrelloOnboardingFlow extends BaseOnboardingFlow {
  constructor() {
    super('trello');
  }

  initializeSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to Trello',
        description: 'Introduction to Trello and Kanban project management',
        type: 'information',
        required: false,
        estimatedTime: 30,
        nextStepId: 'account-setup'
      },
      {
        id: 'account-setup',
        title: 'Create Your Account',
        description: 'Sign up for Trello or log into existing account',
        type: 'action',
        required: true,
        estimatedTime: 90,
        validationCriteria: ['Account created', 'Email verified'],
        nextStepId: 'first-board'
      },
      {
        id: 'first-board',
        title: 'Create Your First Board',
        description: 'Set up a project board and understand board structure',
        type: 'action',
        required: true,
        estimatedTime: 120,
        validationCriteria: ['Board created', 'Board named'],
        nextStepId: 'lists-setup'
      },
      {
        id: 'lists-setup',
        title: 'Organize with Lists',
        description: 'Create lists to represent different stages of your workflow',
        type: 'action',
        required: true,
        estimatedTime: 90,
        validationCriteria: ['Multiple lists created', 'List names defined'],
        nextStepId: 'cards-tutorial'
      },
      {
        id: 'cards-tutorial',
        title: 'Adding Cards',
        description: 'Learn to create and organize cards within lists',
        type: 'action',
        required: true,
        estimatedTime: 150,
        validationCriteria: ['Cards created', 'Card details added'],
        nextStepId: 'card-details'
      },
      {
        id: 'card-details',
        title: 'Card Details and Features',
        description: 'Explore due dates, checklists, labels, and attachments',
        type: 'action',
        required: true,
        estimatedTime: 180,
        validationCriteria: ['Due date set', 'Checklist added', 'Labels applied'],
        nextStepId: 'team-collaboration'
      },
      {
        id: 'team-collaboration',
        title: 'Team Collaboration',
        description: 'Learn to invite members and assign cards',
        type: 'information',
        required: false,
        estimatedTime: 120,
        nextStepId: 'automation-intro'
      },
      {
        id: 'automation-intro',
        title: 'Butler Automation',
        description: 'Introduction to Trello\'s automation features',
        type: 'information',
        required: false,
        estimatedTime: 150,
        nextStepId: 'completion'
      },
      {
        id: 'completion',
        title: 'Ready to Organize!',
        description: 'You\'re now equipped to manage projects with Trello',
        type: 'completion',
        required: false,
        estimatedTime: 30
      }
    ];
  }

  generateSystemPrompt(): string {
    return `You are an expert Trello onboarding coach with an organized, methodical approach. Your role is to guide users through mastering Trello's Kanban-style project management system.

CORE PERSONALITY:
- Organized and systematic teacher
- Passionate about productivity and project management
- Clear and methodical in explanations
- Focuses on practical workflow implementation

COMMUNICATION STYLE:
- Use structured, step-by-step approach
- Emphasize visual organization principles
- Provide real-world project examples
- Ask about user's specific project needs
- Connect features to productivity benefits

ONBOARDING OBJECTIVES:
1. Help user create account and first board
2. Teach Kanban methodology through Trello
3. Build practical workflow with lists and cards
4. Introduce advanced features (labels, due dates, checklists)
5. Explore team collaboration and automation

CURRENT STEP AWARENESS:
- Always reference the current onboarding step
- Provide specific instructions for current task
- Use Kanban terminology appropriately
- Validate understanding before progressing

INTERACTION PATTERNS:
- Begin with current step context
- Explain the 'why' behind each feature
- Use project management best practices
- Encourage workflow customization
- Celebrate organizational achievements

KANBAN FOCUS:
- Emphasize visual workflow management
- Teach board → lists → cards hierarchy
- Connect to project management principles
- Show how movement represents progress

LIMITATIONS:
- Stay focused on Trello and project management
- Don't provide support for other productivity tools
- Redirect off-topic questions back to onboarding

Remember: Your goal is to transform the user into an organized, efficient project manager using Trello's visual system.`;
  }

  getWelcomeMessage(): string {
    return `Hello! Welcome to your Trello onboarding journey! 📋✨

I'm here to help you master Trello's visual project management system. In about 15-20 minutes, we'll transform you into a Kanban pro by:

🎯 Setting up your account and first project board
📝 Creating lists that represent your workflow stages
🃏 Adding cards for individual tasks and ideas
⚡ Using powerful features like labels, due dates, and checklists
👥 Understanding team collaboration capabilities

Trello makes project management visual and intuitive - you'll see your work move through stages from "To Do" to "Done" right before your eyes!

Ready to create your organized digital workspace? Let's start with setting up your Trello account!`;
  }

  getCompletionMessage(): string {
    return `🎉 Fantastic! You've mastered the essentials of Trello!

You're now equipped with:
• A clear understanding of Kanban workflow management
• Skills to create organized boards, lists, and cards
• Knowledge of powerful features like labels and due dates
• Team collaboration capabilities
• Awareness of automation possibilities with Butler

Your digital project management system is ready to help you stay organized and productive. Whether it's personal tasks, team projects, or creative endeavors, you now have the visual tools to manage it all effectively.

What's the first project you'd like to organize in your new Trello workspace?`;
  }

  async validateStep(stepId: string, userInput: string): Promise<boolean> {
    const step = this.steps.find(s => s.id === stepId);
    if (!step || !step.validationCriteria) {
      return true;
    }

    const input = userInput.toLowerCase();
    
    switch (stepId) {
      case 'account-setup':
        return input.includes('account') || input.includes('signed') || input.includes('created') || input.includes('verified');
      
      case 'first-board':
        return input.includes('board') || input.includes('created') || input.includes('project');
      
      case 'lists-setup':
        return input.includes('list') || input.includes('workflow') || input.includes('stage');
      
      case 'cards-tutorial':
        return input.includes('card') || input.includes('task') || input.includes('added');
      
      case 'card-details':
        return input.includes('due date') || input.includes('checklist') || input.includes('label') || input.includes('details');
      
      default:
        return true;
    }
  }
}
