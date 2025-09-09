/**
 * Onboarding Progress Component - Visual progress tracking during onboarding
 */

'use client';

import React, { memo } from 'react';
import { OnboardingProgress, OnboardingStep } from '@/lib/types/onboarding.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface OnboardingProgressProps {
  progress: OnboardingProgress;
  currentStep: OnboardingStep;
  allSteps: OnboardingStep[];
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  isPaused?: boolean;
  estimatedTimeRemaining?: number;
}

const StepIndicator = memo(({ 
  step, 
  isCompleted, 
  isCurrent, 
  stepNumber 
}: { 
  step: OnboardingStep; 
  isCompleted: boolean; 
  isCurrent: boolean; 
  stepNumber: number;
}) => {
  const getStepIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    } else if (isCurrent) {
      return <Circle className="w-5 h-5 text-blue-400 fill-current" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStepStatus = () => {
    if (isCompleted) return 'Completed';
    if (isCurrent) return 'In Progress';
    return 'Pending';
  };

  return (
    <div 
      className={`
        flex items-center space-x-3 p-3 rounded-lg transition-all duration-300
        ${isCurrent ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-800/50'}
        ${isCompleted ? 'opacity-75' : 'opacity-100'}
      `}
    >
      {/* Step Number and Icon */}
      <div className="flex items-center space-x-2 min-w-0">
        <span className="text-sm text-gray-400 font-mono w-6">
          {stepNumber.toString().padStart(2, '0')}
        </span>
        {getStepIcon()}
      </div>

      {/* Step Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`
            font-medium truncate
            ${isCurrent ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-gray-300'}
          `}>
            {step.title}
          </h4>
          <Badge 
            variant="secondary" 
            className={`
              ml-2 text-xs shrink-0
              ${isCurrent ? 'bg-blue-500/20 text-blue-300' : 
                isCompleted ? 'bg-green-500/20 text-green-300' : 
                'bg-gray-500/20 text-gray-400'}
            `}
          >
            {getStepStatus()}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-400 mt-1 truncate">
          {step.description}
        </p>
        
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            ~{Math.ceil(step.estimatedTime / 60)} min
          </span>
          {step.type !== 'information' && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              {step.type === 'action' ? 'Action Required' : 'Validation'}
            </Badge>
          )}
        </div>
      </div>

      {/* Current Step Indicator */}
      {isCurrent && (
        <ArrowRight className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
      )}
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';

const OnboardingProgressComponent = memo(({ 
  progress, 
  currentStep, 
  allSteps,
  onPause,
  onResume,
  onRestart,
  isPaused = false,
  estimatedTimeRemaining = 0
}: OnboardingProgressProps) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} min remaining`;
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'paused': return 'text-yellow-400';
      case 'abandoned': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'completed': return 'Completed! 🎉';
      case 'in_progress': return isPaused ? 'Paused' : 'In Progress';
      case 'paused': return 'Paused';
      case 'abandoned': return 'Abandoned';
      default: return 'Not Started';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Progress</h3>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor()} bg-transparent border-current`}
        >
          {getStatusText()}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            Step {progress.completedSteps.length + 1} of {allSteps.length}
          </span>
          <span className="text-sm text-gray-400">
            {Math.round(progress.completionRate)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.completionRate}%` }}
          />
        </div>
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Time Spent</div>
          <div className="text-sm font-medium text-white">
            {formatTime(progress.timeSpent)}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Remaining</div>
          <div className="text-sm font-medium text-white">
            {estimatedTimeRemaining > 0 ? formatTimeRemaining(estimatedTimeRemaining) : 'Almost done!'}
          </div>
        </div>
      </div>

      {/* Current Step Highlight */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h4 className="text-blue-300 font-medium mb-2">Current Step</h4>
        <p className="text-white font-medium">{currentStep.title}</p>
        <p className="text-gray-300 text-sm mt-1">{currentStep.description}</p>
        
        {currentStep.required && (
          <div className="flex items-center mt-2 text-xs text-blue-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Action required to proceed
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-2 mb-6">
        {progress.status === 'in_progress' && (
          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? onResume : onPause}
            className="flex-1"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            )}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restart
        </Button>
      </div>

      {/* Steps List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-300 mb-3">All Steps</h4>
        {allSteps.map((step, index) => {
          const isCompleted = progress.completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep.id;
          
          return (
            <StepIndicator
              key={step.id}
              step={step}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              stepNumber={index + 1}
            />
          );
        })}
      </div>

      {/* Error Display */}
      {progress.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center text-red-400 text-sm font-medium mb-1">
            <AlertCircle className="w-4 h-4 mr-1" />
            Issues Encountered
          </div>
          <div className="text-xs text-red-300">
            {progress.errors.filter(e => !e.resolved).length} unresolved issues
          </div>
        </div>
      )}
    </div>
  );
});

OnboardingProgressComponent.displayName = 'OnboardingProgressComponent';

export default OnboardingProgressComponent;
