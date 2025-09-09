"use client";

/**
 * Control Panel - Left sidebar with API controls
 * FIXED: Enhanced system instruction reactivity for onboarding prompt injection
 */

import React, { memo, useEffect, useState } from "react";
import { useLiveAPI } from "@/contexts/LiveAPIProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface ControlPanelProps {
  showConsole?: boolean;
  onClose?: () => void;
}

const ControlPanel = memo(({ 
  showConsole = true,
  onClose
}: ControlPanelProps) => {
  const {
    state,
    setApiKey,
    setModel,
    setSystemInstruction,
  } = useLiveAPI();

  // 🔧 FIX: Force textarea to reflect current system instruction
  const [localSystemInstruction, setLocalSystemInstruction] = useState(state.systemInstruction);

  // 🔄 Update local state when global state changes (onboarding prompt injection)
  useEffect(() => {
    console.log('📋 System instruction changed:', {
      oldLength: localSystemInstruction.length,
      newLength: state.systemInstruction.length,
      preview: state.systemInstruction.substring(0, 100) + '...'
    });
    
    setLocalSystemInstruction(state.systemInstruction);
  }, [state.systemInstruction, state.selectedProduct?.id, state.onboardingMode]); // FIXED: Added more dependencies

  // 🎩 Handle manual edits while preserving onboarding updates
  const handleSystemInstructionChange = (value: string) => {
    setLocalSystemInstruction(value);
    setSystemInstruction(value);
  };

  if (!showConsole) {
    return null;
  }

  return (
    <div className="w-full lg:w-[25%] bg-gray-900 lg:bg-black lg:border-r border-gray-800 transition-all duration-300 flex flex-col h-screen lg:h-auto lg:max-h-screen">
      <div className="flex flex-col flex-1 p-6 lg:p-4 pb-8 lg:pb-4 overflow-hidden">
        {/* Header with Controls */}
        <div className="flex items-center justify-between mb-6 lg:mb-4 pt-12 lg:pt-0">
          <h2 className="text-2xl lg:text-lg font-semibold">Console Settings</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="text-gray-400 hover:text-white w-12 h-12 lg:hidden rounded-full bg-gray-800 hover:bg-gray-700"
              title="Close console"
            >
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* API Controls */}
        <div className="flex-1 flex flex-col space-y-6 lg:space-y-3">
          <div className="flex-shrink-0">
            <Label htmlFor="model-select" className="text-lg lg:text-sm text-gray-300 mb-3 lg:mb-2 block font-medium">
              Model
            </Label>
            <Select value={state.selectedModel} onValueChange={setModel}>
              <SelectTrigger className="bg-gray-800 border-gray-700 h-14 lg:h-auto text-lg lg:text-sm">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="models/gemini-2.0-flash-exp" className="bg-gray-800 text-white hover:bg-gray-700 focus:bg-gray-700 h-14 lg:h-auto text-lg lg:text-sm">
                  Gemini 2.0 Flash Experimental
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0">
            <Label htmlFor="api-key" className="text-lg lg:text-sm text-gray-300 mb-3 lg:mb-2 block font-medium">
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter API Key"
              value={state.apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-14 lg:h-auto text-lg lg:text-sm"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 lg:mb-2">
              <Label htmlFor="system-instruction" className="text-lg lg:text-sm text-gray-300 font-medium flex-shrink-0">
                System Instructions
              </Label>
              
              {/* 🎯 Visual indicator when onboarding prompt is active */}
              {state.onboardingMode && state.selectedProduct && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded px-2 py-1 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 text-xs font-medium">
                    {state.selectedProduct.name} Coach
                  </span>
                </div>
              )}
            </div>
            <Textarea
              id="system-instruction"
              placeholder="System Instructions"
              value={localSystemInstruction}
              onChange={(e) => handleSystemInstructionChange(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none flex-1 text-lg lg:text-sm leading-relaxed lg:leading-normal"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ControlPanel.displayName = "ControlPanel";

export default ControlPanel;