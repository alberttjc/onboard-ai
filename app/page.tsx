'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { LiveAPIProvider } from '@/contexts/LiveAPIProvider';

// Lazy load components for better performance
const ControlPanel = React.lazy(() => import('@/components/interface/ControlPanel'));
const LogsPanel = React.lazy(() => import('@/components/interface/LogsPanel'));
const MainInterface = React.lazy(() => import('@/components/interface/MainInterface'));
const ConnectionStatus = React.lazy(() => import('@/components/interface/ConnectionStatus'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    <span className="ml-2 text-white">Loading...</span>
  </div>
);

const LoadingFallback = ({ width }: { width?: string }) => (
  <div className={`${width || 'w-full'} bg-gray-800 animate-pulse rounded-lg`}>
    <LoadingSpinner />
  </div>
);

export default function VoiceOnboardingApp() {
  // Desktop: console always visible, Mobile: console starts hidden
  const [showConsole, setShowConsole] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true); // NEW: Left panel toggle
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <LiveAPIProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Desktop Layout: 3-column */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left Panel - Controls (conditionally shown) */}
          {showLeftPanel && (
            <Suspense fallback={<LoadingFallback width="w-[30%]" />}>
              <ControlPanel 
                showConsole={true}
              />
            </Suspense>
          )}
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <Suspense fallback={<LoadingFallback width="h-16" />}>
              <ConnectionStatus 
                onToggleLogs={setShowLogs}
                showLogs={showLogs}
                onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
                showLeftPanel={showLeftPanel}
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
            <Suspense fallback={<LoadingFallback width="w-[30%]" />}>
              <LogsPanel onClose={() => setShowLogs(false)} />
            </Suspense>
          )}
        </div>

        {/* Mobile & Tablet Layout: Stacked with overlays */}
        <div className="lg:hidden min-h-screen flex flex-col">
          {/* Top Header - always visible */}
          <Suspense fallback={<LoadingFallback width="h-16" />}>
            <ConnectionStatus 
              onToggleLogs={setShowLogs}
              showLogs={showLogs}
              onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
              showLeftPanel={showLeftPanel}
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
              <Suspense fallback={<LoadingSpinner />}>
                <ControlPanel 
                  showConsole={showConsole}
                  onClose={() => setShowConsole(false)}
                />
              </Suspense>
            </div>
          )}

          {/* Mobile Logs Overlay */}
          {showLogs && isMobileView && (
            <div className="fixed inset-0 z-40 lg:hidden bg-gray-900 animate-in slide-in-from-right duration-300">
              <Suspense fallback={<LoadingSpinner />}>
                <LogsPanel onClose={() => setShowLogs(false)} />
              </Suspense>
            </div>
          )}
        </div>

        {/* PWA Manifest and Service Worker Registration */}
        <div className="hidden">
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1f2937" />
          <meta name="description" content="Voice AI Onboarding Agent - Personalized, step-by-step guidance for SaaS products through natural voice interactions." />
          <meta name="keywords" content="voice AI, onboarding, Notion, Trello, voice interface, product setup, guided tutorial" />
        </div>
      </div>
    </LiveAPIProvider>
  );
}
