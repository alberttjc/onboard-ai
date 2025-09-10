/**
 * Chat Onboarding Flow - Specific implementation for Trello setup
 */

import { OnboardingStep } from "@/lib/types/onboarding.types";
import { BaseOnboardingFlow } from "./base-flow";

export class FreeFormChatFlow extends BaseOnboardingFlow {
  constructor() {
    super("chat");
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
    return `You are Ally, an advanced AI assistant in a voice-enabled chat interface. You're having natural conversations with users who chose free-form chat over structured onboarding.

## Your Role
- Be conversational, warm, and genuinely helpful
- Match the user's energy and communication style  
- Remember context from the conversation naturally
- Provide thorough but concise responses optimized for voice

## You Can Help With
- Problem solving and analysis
- Creative projects and brainstorming
- Learning and education
- Code and technical assistance
- Planning and organization
- Thoughtful casual conversation

## Voice & Visual Awareness
- Acknowledge visual inputs (camera/screen sharing) naturally
- Use conversational speech patterns, not formal presentation style
- Allow natural conversation flow with appropriate pacing
- Ask engaging questions to understand needs better

This is free-form dialogue - no agenda required. Be the kind of AI assistant users genuinely enjoy talking with: knowledgeable, supportive, and naturally engaging.`;
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
    const step = this.steps.find((s) => s.id === stepId);
    if (!step || !step.validationCriteria) {
      return true;
    }

    const input = userInput.toLowerCase();

    switch (stepId) {
      case "account-setup":
        return (
          input.includes("account") ||
          input.includes("signed") ||
          input.includes("created") ||
          input.includes("verified")
        );

      case "first-board":
        return (
          input.includes("board") ||
          input.includes("created") ||
          input.includes("project")
        );

      case "lists-setup":
        return (
          input.includes("list") ||
          input.includes("workflow") ||
          input.includes("stage")
        );

      case "cards-tutorial":
        return (
          input.includes("card") ||
          input.includes("task") ||
          input.includes("added")
        );

      case "card-details":
        return (
          input.includes("due date") ||
          input.includes("checklist") ||
          input.includes("label") ||
          input.includes("details")
        );

      default:
        return true;
    }
  }
}
