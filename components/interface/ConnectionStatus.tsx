'use client';

/**
 * Optimized Connection Status Component
 * Minimal header showing connection state and session info
 */

import React, { memo } from 'react';
import { useLiveAPI } from '@/contexts/LiveAPIProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, Settings } from "lucide-react";

interface ConnectionStatusProps {
  onToggleLogs?: (show: boolean) => void;
  showLogs?: boolean;
  onToggleLeftPanel?: () => void; // NEW: Left panel toggle
  showLeftPanel?: boolean; // NEW: Left panel state
}

const ConnectionStatus = memo(({ onToggleLogs, showLogs = false, onToggleLeftPanel, showLeftPanel }: ConnectionStatusProps) => {
  const { state } = useLiveAPI();

  return (
    <div className="p-4 lg:p-4 p-6 border-b border-gray-800 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex gap-2 items-center flex-wrap">
          <Badge variant={state.isConnected ? "default" : "destructive"} className="text-xs lg:text-xs text-sm">
            {state.isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="default" className="text-xs lg:text-xs text-sm">
            {state.audioEnabled ? '🔊 Audio' : '📝 Text'}
          </Badge>
          {state.sessionId && (
            <Badge variant="default" className="text-xs lg:text-xs text-sm hidden sm:inline-flex">
              {state.sessionId}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {/* NEW: Left Panel Toggle Button (Gear Icon) */}
        {onToggleLeftPanel && (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-gray-400 hover:text-white ${
              showLeftPanel ? 'text-blue-400' : ''
            } w-10 h-10 lg:w-auto lg:h-auto hidden lg:flex`}
            onClick={onToggleLeftPanel}
            title={showLeftPanel ? "Hide console panel" : "Show console panel"}
          >
            <Settings className="w-5 h-5 lg:w-4 lg:h-4" />
          </Button>
        )}
        
        {/* Debug/Logs Toggle Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-gray-400 hover:text-white ${
            showLogs ? 'text-blue-400' : ''
          } w-10 h-10 lg:w-auto lg:h-auto hidden lg:flex`}
          onClick={() => onToggleLogs?.(!showLogs)}
          title={showLogs ? "Hide logs panel" : "Show logs panel"}
        >
          <Bug className="w-5 h-5 lg:w-4 lg:h-4" />
        </Button>
      </div>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus;
