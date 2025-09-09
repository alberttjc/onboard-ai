/**
 * Onboarding Step Announcer - Provides audio announcements for step transitions
 */

import { OnboardingStep, OnboardingProgress } from '@/lib/types/onboarding.types';

export class StepAnnouncer {
  static generateProgressAnnouncement(
    completedStep: OnboardingStep,
    nextStep: OnboardingStep | null,
    progress: OnboardingProgress
  ): string {
    const productName = progress.productId.charAt(0).toUpperCase() + progress.productId.slice(1);
    
    let announcement = `Perfect! You've successfully completed "${completedStep.title}". `;
    
    // Celebrate the achievement
    announcement += this.getCelebrationMessage(completedStep.type);
    
    // Announce progress
    const progressPercent = Math.round(progress.completionRate);
    announcement += ` You're now ${progressPercent}% through your ${productName} onboarding! `;
    
    // Introduce next step or completion
    if (nextStep) {
      announcement += `Next up is "${nextStep.title}". `;
      announcement += this.getStepIntroduction(nextStep);
    } else {
      announcement += `🎉 Congratulations! You've completed the entire ${productName} onboarding process! You're now ready to use ${productName} like a pro!`;
    }
    
    return announcement;
  }

  static generateStepIntroduction(step: OnboardingStep, stepNumber: number, totalSteps: number): string {
    let intro = `Welcome to step ${stepNumber} of ${totalSteps}: "${step.title}". `;
    
    switch (step.type) {
      case 'information':
        intro += "I'll explain some important concepts that will help you succeed. ";
        break;
      case 'action':
        intro += "This is a hands-on step where you'll actively work in the application. ";
        break;
      case 'validation':
        intro += "Let's check your progress and make sure everything is working correctly. ";
        break;
      case 'completion':
        intro += "You've reached the final step - let's celebrate your achievement! ";
        break;
    }
    
    intro += step.description;
    
    // Add time estimate
    if (step.estimatedTime > 60) {
      const minutes = Math.ceil(step.estimatedTime / 60);
      intro += ` This step typically takes about ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }
    
    // Add encouragement for required steps
    if (step.required) {
      intro += " I'm here to help you every step of the way, so don't hesitate to ask questions!";
    }
    
    return intro;
  }

  private static getCelebrationMessage(stepType: OnboardingStep['type']): string {
    const celebrations = {
      information: "You've absorbed that information really well! ",
      action: "Great job completing that task! ",
      validation: "Everything looks perfect! ",
      completion: "Outstanding work! "
    };
    
    return celebrations[stepType] || "Well done! ";
  }

  private static getStepIntroduction(step: OnboardingStep): string {
    switch (step.type) {
      case 'information':
        return "I'll walk you through some key concepts that will make everything easier.";
      case 'action':
        return "This is where you'll get hands-on experience with the platform.";
      case 'validation':
        return "We'll make sure everything is working perfectly before moving on.";
      case 'completion':
        return "Time to celebrate your success!";
      default:
        return "Let's continue with the next part of your journey.";
    }
  }
}
