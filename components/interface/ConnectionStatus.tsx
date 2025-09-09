'use client';

/**
 * Optimized Connection Status Component
 * Minimal header showing connection state and session info
 */

import React, { memo } from 'react';
import { useLiveAPI } from '@/contexts/LiveAPIProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug } from "lucide-react";

interface ConnectionStatusProps {
  onToggleLogs?: (show: boolean) => void;
  showLogs?: boolean;
}

const ConnectionStatus = memo(({ onToggleLogs, showLogs = false }: ConnectionStatusProps) => {
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
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus;
