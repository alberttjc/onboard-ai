'use client';

import React, { Suspense, useState } from 'react';
import { LiveAPIProvider } from '@/contexts/LiveAPIProvider';

// Lazy load components for better performance
const ControlPanel = React.lazy(() => import('@/components/interface/ControlPanel'));
const LogsPanel = React.lazy(() => import('@/components/interface/LogsPanel'));
const MainInterface = React.lazy(() => import('@/components/interface/MainInterface'));
const ConnectionStatus = React.lazy(() => import('@/components/interface/ConnectionStatus'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
  </div>
);

export default function LiveAPIConsole() {
  // Desktop: console always visible, Mobile: console starts hidden
  const [showConsole, setShowConsole] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  return (
    <LiveAPIProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Desktop Layout: 3-column */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left Panel - Controls */}
          <Suspense fallback={<div className="w-80 bg-black animate-pulse" />}>
            <ControlPanel 
              showConsole={true}
            />
          </Suspense>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
              <ConnectionStatus 
                onToggleLogs={setShowLogs}
                showLogs={showLogs}
              />
            </Suspense>
            
            <Suspense fallback={<LoadingSpinner />}>
              <MainInterface 
                onToggleConsole={setShowConsole}
                showConsole={showConsole}
              />
            </Suspense>
          </div>

          {/* Right Panel - Logs (only when toggled) */}
          {showLogs && (
            <Suspense fallback={<div className="w-96 bg-black animate-pulse" />}>
              <LogsPanel onClose={() => setShowLogs(false)} />
            </Suspense>
          )}
        </div>

        {/* Mobile & Tablet Layout: Stacked with overlays */}
        <div className="lg:hidden min-h-screen flex flex-col">
          {/* Top Header - always visible */}
          <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
            <ConnectionStatus 
              onToggleLogs={setShowLogs}
              showLogs={showLogs}
            />
          </Suspense>
          
          {/* Main Content - full screen */}
          <div className="flex-1 flex flex-col">
            <Suspense fallback={<LoadingSpinner />}>
              <MainInterface 
                onToggleConsole={setShowConsole}
                showConsole={showConsole}
              />
            </Suspense>
          </div>

          {/* Mobile Controls Overlay - Full Screen */}
          {showConsole && (
            <div className="fixed inset-0 z-50 lg:hidden bg-gray-900 animate-in slide-in-from-bottom duration-300">
              <Suspense fallback={<div className="h-full w-full bg-gray-900 animate-pulse" />}>
                <ControlPanel 
                  showConsole={showConsole}
                  onClose={() => setShowConsole(false)}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </LiveAPIProvider>
  );
}
