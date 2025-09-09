'use client';

/**
 * Optimized Main Interface - Central content area
 * Memoized and performance-optimized with mobile responsiveness
 */

import React, { memo, useMemo, useRef, useEffect } from 'react';
import { useLiveAPI } from '@/contexts/LiveAPIProvider';
import { useVideoFrameProcessor } from '@/hooks/use-video-frame-processor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Play,
  Square,
  Settings
} from 'lucide-react';

const VolumeIndicator = memo(({ 
  label, 
  volume, 
  color = 'bg-green-500',
  description
}: { 
  label: string; 
  volume: number; 
  color?: string; 
  description?: string;
}) => (
  <div className="bg-gray-800 p-4 lg:p-3 rounded-lg">
    <h3 className="text-base lg:text-sm font-medium text-gray-300 mb-2">{label}</h3>
    <div className="w-full bg-gray-700 rounded-full h-3 lg:h-2">
      <div 
        className={`${color} h-3 lg:h-2 rounded-full transition-all duration-100`}
        style={{ width: `${Math.min(volume, 100)}%` }}
      />
    </div>
    {description && (
      <p className="text-sm lg:text-xs text-gray-400 mt-1">{description}</p>
    )}
  </div>
));

VolumeIndicator.displayName = 'VolumeIndicator';

const TranscriptSection = memo(({ transcript }: { transcript: string }) => {
  if (!transcript) return null;

  return (
    <div className="text-left whitespace-pre-line w-full">
      <h2 className="text-2xl lg:text-xl font-semibold mb-2">Transcript</h2>
      <ScrollArea className="h-40 lg:h-48 bg-gray-800 rounded-md p-3 lg:p-2 text-base lg:text-sm">
        {transcript}
      </ScrollArea>
    </div>
  );
});

TranscriptSection.displayName = 'TranscriptSection';

interface MainInterfaceProps {
  onToggleConsole?: (show: boolean) => void;
  showConsole?: boolean;
}

const MainInterface = memo(({ onToggleConsole, showConsole }: MainInterfaceProps = {}) => {
  const {
    state,
    toggleRecording,
    startCamera,
    startScreenShare,
    stopVideo,
    connect,
    disconnect,
    sendMessage,
    setMessage,
  } = useLiveAPI();
  
  // Video ref for displaying camera/screen share
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Video frame processor for sending frames to Gemini
  const { isCapturing } = useVideoFrameProcessor(videoRef, {
    frameRate: 0.5, // 0.5 fps like original app
    quality: 0.8,   // 80% JPEG quality
    scale: 0.25     // 25% scale for performance
  });
  
  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && state.activeVideoStream) {
      videoRef.current.srcObject = state.activeVideoStream;
    }
  }, [state.activeVideoStream]);

  // Memoize status message for performance
  const statusMessage = useMemo(() => {
    if (!state.isConnected) {
      return "Microphone starts automatically when connected";
    }
    
    if (!state.audioEnabled) {
      return "Voice assistant is ready - responses will be in text only";
    }
    
    if (state.isRecording) {
      return "🎤 Recording active - I'm listening! Speak freely...";
    }
    
    return "Connecting audio... Microphone will auto-start when ready.";
  }, [state.isConnected, state.audioEnabled, state.isRecording]);

  // Memoized button handlers
  const handleToggleConnection = useMemo(() => 
    state.isConnected ? disconnect : connect,
    [state.isConnected, connect, disconnect]
  );

  const handleToggleCamera = useMemo(() => 
    () => {
      if (state.isCameraOn) {
        stopVideo();
      } else {
        startCamera();
      }
    },
    [state.isCameraOn, startCamera, stopVideo]
  );

  const handleToggleScreenShare = useMemo(() => 
    () => {
      if (state.isScreenSharing) {
        stopVideo();
      } else {
        startScreenShare();
      }
    },
    [state.isScreenSharing, startScreenShare, stopVideo]
  );

  const handleSendMessage = () => {
    sendMessage(state.message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Video Feed */}
          {state.activeVideoStream && (state.isCameraOn || state.isScreenSharing) && (
            <div className="mb-8 relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-md h-48 lg:h-64 bg-gray-800 rounded-lg mx-auto object-cover"
              />
              {isCapturing && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs animate-pulse">
                  📹 Live
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {state.isCameraOn ? '📹 Camera' : '🖥️ Screen Share'}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-6 lg:space-y-4">
            <h1 className="text-3xl lg:text-3xl font-bold text-gray-200">
              Live Voice Assistant
            </h1>
            
            <p className="text-lg lg:text-lg text-gray-400">{statusMessage}</p>

            <TranscriptSection transcript={state.transcript} />
            
            {/* Audio Activity Indicators */}
            {state.isConnected && state.audioEnabled && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <VolumeIndicator 
                  label="Input Volume" 
                  volume={state.inputVolume}
                  color="bg-green-500"
                  description={state.isRecording ? '🎤 Auto-recording active...' : 'Will auto-start when connected'}
                />
                <VolumeIndicator 
                  label="Output Volume" 
                  volume={state.outputVolume}
                  color="bg-blue-500"
                  description="🔊 Aoede voice responses"
                />
              </div>
            )}
            
            {/* Video Activity Indicator */}
            {state.isConnected && (state.isCameraOn || state.isScreenSharing) && (
              <div className="bg-gray-800 p-4 lg:p-3 rounded-lg mt-4">
                <h3 className="text-base lg:text-sm font-medium text-gray-300 mb-2">
                  📹 Video Stream Status
                </h3>
                <div className="flex items-center justify-between text-sm lg:text-xs">
                  <span className={isCapturing ? "text-green-400" : "text-gray-400"}>
                    {isCapturing ? '✅ Sending frames to Gemini' : '⌚ Initializing...'}
                  </span>
                  <span className="text-gray-400">
                    {state.isCameraOn ? 'Camera' : 'Screen'} • 0.5 FPS
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleRecording}
              disabled={!state.isConnected || !state.audioEnabled}
              className={`w-16 h-16 lg:w-14 lg:h-14 rounded-full ${
                !state.isConnected || !state.audioEnabled
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : state.isRecording 
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {state.isRecording ? <MicOff className="w-7 h-7 lg:w-6 lg:h-6" /> : <Mic className="w-7 h-7 lg:w-6 lg:h-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleToggleScreenShare}
              title={state.isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
              className={`w-16 h-16 lg:w-14 lg:h-14 rounded-full ${
                state.isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {state.isScreenSharing ? <MonitorOff className="w-7 h-7 lg:w-6 lg:h-6" /> : <Monitor className="w-7 h-7 lg:w-6 lg:h-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleToggleCamera}
              title={state.isCameraOn ? "Stop camera" : "Start camera"}
              className={`w-16 h-16 lg:w-14 lg:h-14 rounded-full ${
                state.isCameraOn
                  ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-400"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {state.isCameraOn ? <VideoOff className="w-7 h-7 lg:w-6 lg:h-6" /> : <Video className="w-7 h-7 lg:w-6 lg:h-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => onToggleConsole?.(!showConsole)}
              title="Console settings"
              className={`w-16 h-16 lg:w-14 lg:h-14 rounded-full lg:hidden ${
                showConsole
                  ? "bg-gray-600 hover:bg-gray-700 text-white ring-2 ring-gray-400"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              <Settings className="w-7 h-7 lg:w-6 lg:h-6" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleToggleConnection}
              title={state.isConnected ? "Stop connection" : "Start connection"}
              className="w-16 h-16 lg:w-14 lg:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {state.isConnected ? <Square className="w-7 h-7 lg:w-6 lg:h-6" /> : <Play className="w-7 h-7 lg:w-6 lg:h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Input */}
      <div className="p-6 lg:p-4 border-t border-gray-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3 lg:gap-2">
            <Input
              placeholder={state.audioEnabled 
                ? "Type something or use voice (microphone button above)..." 
                : "Type something..."
              }
              value={state.message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 lg:h-10 text-base lg:text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!state.isConnected || !state.message.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-12 lg:h-10 px-6 lg:px-4 text-base lg:text-sm"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

MainInterface.displayName = 'MainInterface';

export default MainInterface;
export type { MainInterfaceProps };