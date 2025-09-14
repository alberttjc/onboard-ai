/**
 * Enhanced Main Interface with Onboarding Support
 */

"use client";

import React, { memo, useMemo, useRef, useEffect, useState } from "react";
import { useLiveAPI } from "@/contexts/LiveAPIProvider";
import { useVideoFrameProcessor } from "@/hooks/use-video-frame-processor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Play,
  Square,
  Settings,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// Import onboarding components with error handling
import ProductSelector from "@/components/onboarding/ProductSelector";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { OnboardingErrorBoundary } from "@/components/onboarding/OnboardingErrorBoundary";

const VolumeIndicator = memo(
  ({
    label,
    volume,
    color = "bg-green-500",
    description,
  }: {
    label: string;
    volume: number;
    color?: string;
    description?: string;
  }) => (
    <div className="bg-gray-800 p-4 lg:p-3 rounded-lg">
      <h3 className="text-base lg:text-sm font-medium text-gray-300 mb-2">
        {label}
      </h3>
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
  )
);

VolumeIndicator.displayName = "VolumeIndicator";

const OnboardingHeader = memo(
  ({
    productName,
    onBackToSelection,
  }: {
    productName: string;
    onBackToSelection: () => void;
  }) => (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {productName} Onboarding
            </h2>
            <p className="text-blue-300 text-sm">
              I'm here to guide you through the setup process
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToSelection}
            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Products
          </Button>
        </div>
      </div>
    </div>
  )
);

OnboardingHeader.displayName = "OnboardingHeader";

interface MainInterfaceProps {
  onToggleConsole: (show: boolean) => void;
  showConsole: boolean;
}

const MainInterface = memo(
  ({ onToggleConsole, showConsole }: MainInterfaceProps) => {
    const {
      state,
      connect,
      disconnect,
      toggleRecording,
      sendMessage,
      setMessage,
      startCamera,
      startScreenShare,
      stopVideo,

      // Onboarding methods
      getAvailableProducts,
      selectProduct,
      startOnboarding,
      pauseOnboarding,
      resumeOnboarding,
      restartOnboarding,
      getEstimatedTimeRemaining,
    } = useLiveAPI();

    const [isProductSelecting, setIsProductSelecting] = useState(false);
    const [showProgressPanel, setShowProgressPanel] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Video frame processing for visual input
    const { captureFrame, isCapturing } = useVideoFrameProcessor(videoRef, {
      frameRate: 0.5, // 0.5 fps for onboarding context
      quality: 0.8, // Good quality for visual guidance
      scale: 0.3, // Moderate scale for performance
    });

    // Enhanced video stream setup with error handling
    useEffect(() => {
      if (videoRef.current && state.activeVideoStream) {
        try {
          videoRef.current.srcObject = state.activeVideoStream;

          // Add event listeners for video stream
          const video = videoRef.current;

          const handleLoadedMetadata = () => {
            console.log("📹 Video metadata loaded:", {
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration,
            });
          };

          const handlePlay = () => {
            console.log("📹 Video playback started");
            if (state.isConnected) {
              console.log("📸 Video frame capture will begin");
            }
          };

          const handleError = (e: any) => {
            console.error("📹 Video error:", e);
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);
          video.addEventListener("play", handlePlay);
          video.addEventListener("error", handleError);

          // Cleanup listeners
          return () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("error", handleError);
          };
        } catch (error) {
          console.error("📹 Failed to setup video stream:", error);
        }
      }
    }, [state.activeVideoStream, state.isConnected]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (state.message.trim()) {
        sendMessage(state.message);
      }
    };

    // Onboarding handlers
    const handleProductSelect = async (productId: string) => {
      setIsProductSelecting(true);
      try {
        setShowProgressPanel(true)
        if (productId === "chat") {
          // Connect directly without onboarding flow
          setShowProgressPanel(false);
        }
        
        console.log("🚀 Starting seamless onboarding flow for:", productId);

        // Step 1: Select the product and load the flow
        const result = await selectProduct(productId);
        if (!result.success) {
          console.error("❌ Product selection failed:", result.message);
          return;
        }

        console.log("✅ Product selected, auto-starting onboarding...");

        // Step 2: Wait a moment for state to update, then start onboarding
        setTimeout(async () => {
          try {
            await startOnboarding();
            console.log("🎉 Seamless onboarding initiated successfully!");
          } catch (error) {
            console.error("❌ Error auto-starting onboarding:", error);
          }
        }, 200); // Brief delay to ensure state is updated
      } catch (error) {
        console.error("❌ Error in seamless onboarding flow:", error);
      } finally {
        setIsProductSelecting(false);
      }
    };

    const handleBackToProducts = () => {
      try {
        console.log("🔄 Navigating back to products...");
        restartOnboarding();
        setIsProductSelecting(true);
        console.log("✅ Successfully returned to product selection");
      } catch (error) {
        console.error("❌ Error navigating back to products:", error);
        // Fallback: force reset state
        setIsProductSelecting(true);
      }
    };

    const availableProducts = useMemo(
      () => getAvailableProducts(),
      [getAvailableProducts]
    );

    // FIXED: Correct view state logic

    // Show product selection if:
    // - User is actively selecting (loading state), OR
    // - No onboarding mode active (initial state)
    const showProductSelection = isProductSelecting || !state.onboardingMode;

    // Show onboarding interface if:
    // - In onboarding mode AND have selected product AND flow AND not actively selecting
    const showOnboardingInterface =
      state.onboardingMode &&
      state.selectedProduct &&
      state.currentFlow &&
      !isProductSelecting;

    // Show general chat interface if:
    // - Connected but not in onboarding mode and not selecting products
    const showGeneralChat =
      state.isConnected && !state.onboardingMode && !isProductSelecting;

    return (
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Mobile Console Toggle Button */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Badge variant={state.isConnected ? "default" : "secondary"}>
              {state.isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {state.onboardingMode && state.selectedProduct && (
              <Badge
                variant="outline"
                className="text-blue-300 border-blue-500/30"
              >
                {state.selectedProduct.name} Onboarding
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleConsole(!showConsole)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Left Content - Main Interface */}
          <div className="flex-1 flex flex-col">
            {/* Product Selection View */}
            {showProductSelection && (
              <div className="flex-1 flex items-center justify-center p-6">
                <OnboardingErrorBoundary>
                  <ProductSelector
                    products={availableProducts}
                    selectedProductId={state.selectedProduct?.id}
                    onProductSelect={handleProductSelect}
                    isLoading={isProductSelecting}
                  />
                </OnboardingErrorBoundary>
              </div>
            )}

            {/* Onboarding Interface */}
            {showOnboardingInterface && (
              <div className="flex-1 flex flex-col p-6">
                {/* Onboarding Header */}
                <OnboardingHeader
                  productName={state.selectedProduct!.name}
                  onBackToSelection={handleBackToProducts}
                />

                {/* Main Chat Area */}
                <div className="flex-1 bg-gray-800 rounded-xl p-6 mb-4 flex flex-col">
                  {/* Enhanced Video Display */}
                  {(state.isCameraOn || state.isScreenSharing) && (
                    <div className="mb-4 relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-2xl mx-auto rounded-lg bg-gray-700"
                        onPlay={() => console.log("📹 Video started playing")}
                        onError={(e) => console.error("📹 Video error:", e)}
                      />

                      {/* Video Status Badges */}
                      <div className="absolute top-2 left-2 space-y-1">
                        <Badge
                          variant="secondary"
                          className="bg-black/70 text-white"
                        >
                          {state.isCameraOn ? "📹 Camera" : "🖥️ Screen"}
                        </Badge>

                        {isCapturing && state.isConnected && (
                          <Badge
                            variant="secondary"
                            className="bg-green-600/70 text-white animate-pulse"
                          >
                            📸 AI Analyzing
                          </Badge>
                        )}
                      </div>

                      {/* Connection Status for Video */}
                      {!state.isConnected && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <Badge
                            variant="secondary"
                            className="bg-yellow-600 text-white"
                          >
                            Connect to enable AI vision
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transcript/Conversation Display */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4">
                      {state.transcript ? (
                        <div className="prose prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap text-sm">
                            {state.transcript}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-lg font-medium mb-2">
                            Ready to start your onboarding!
                          </p>
                          <p className="text-sm">
                            Connect and begin speaking to get personalized
                            guidance for {state.selectedProduct?.name}.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Connection and Recording Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={state.isConnected ? "default" : "secondary"}
                      >
                        {state.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                      </Badge>
                      {state.isRecording && (
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-500/30"
                        >
                          🎤 Recording
                        </Badge>
                      )}
                      {state.isOnboardingPaused && (
                        <Badge
                          variant="outline"
                          className="text-yellow-400 border-yellow-500/30"
                        >
                          ⏸️ Paused
                        </Badge>
                      )}
                    </div>

                    {state.isConnected && (
                      <div className="flex items-center space-x-2">
                        {/* Recording Toggle */}
                        <Button
                          variant={
                            state.isRecording ? "destructive" : "outline"
                          }
                          size="sm"
                          onClick={toggleRecording}
                        >
                          {state.isRecording ? (
                            <>
                              <Square className="w-4 h-4 mr-1" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Record
                            </>
                          )}
                        </Button>

                        {/* Enhanced Video Controls */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={state.isCameraOn ? stopVideo : startCamera}
                          className="relative"
                          title={
                            state.isCameraOn ? "Stop camera" : "Start camera"
                          }
                        >
                          {state.isCameraOn ? (
                            <VideoOff className="w-4 h-4" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                          {state.isCameraOn && isCapturing && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={
                            state.isScreenSharing ? stopVideo : startScreenShare
                          }
                          className="relative"
                          title={
                            state.isScreenSharing
                              ? "Stop screen sharing"
                              : "Start screen sharing"
                          }
                        >
                          {state.isScreenSharing ? (
                            <MonitorOff className="w-4 h-4" />
                          ) : (
                            <Monitor className="w-4 h-4" />
                          )}
                          {state.isScreenSharing && isCapturing && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Text Input */}
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={state.message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        state.isConnected
                          ? "Type your message or use voice..."
                          : "Connect to start chatting..."
                      }
                      disabled={!state.isConnected}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!state.isConnected || !state.message.trim()}
                    >
                      Send
                    </Button>
                  </form>
                </div>

                {/* Connection Controls */}
                <div className="flex justify-center space-x-4">
                  {!state.isConnected ? (
                    <Button
                      onClick={connect}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 px-8"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Connect & Start Onboarding
                    </Button>
                  ) : (
                    <Button
                      onClick={disconnect}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Disconnect
                    </Button>
                  )}

                  {state.isConnected && state.onboardingMode && (
                    <Button
                      onClick={
                        state.isOnboardingPaused
                          ? resumeOnboarding
                          : pauseOnboarding
                      }
                      variant="outline"
                      size="lg"
                    >
                      {state.isOnboardingPaused ? (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* General Chat Interface (when connected but not in onboarding mode) */}
            {showGeneralChat && (
              <div className="flex-1 flex flex-col p-6">
                <div className="flex-1 bg-gray-800 rounded-xl p-6 mb-4 flex flex-col">
                  {/* Enhanced Video Display */}
                  {(state.isCameraOn || state.isScreenSharing) && (
                    <div className="mb-4 relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-2xl mx-auto rounded-lg bg-gray-700"
                        onPlay={() =>
                          console.log("📹 Video started playing in chat mode")
                        }
                        onError={(e) =>
                          console.error("📹 Video error in chat mode:", e)
                        }
                      />

                      {/* Video Status Badges */}
                      <div className="absolute top-2 left-2 space-y-1">
                        <Badge
                          variant="secondary"
                          className="bg-black/70 text-white"
                        >
                          {state.isCameraOn ? "📹 Camera" : "🖥️ Screen"}
                        </Badge>

                        {isCapturing && (
                          <Badge
                            variant="secondary"
                            className="bg-green-600/70 text-white animate-pulse"
                          >
                            📸 AI Vision Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transcript Display */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4">
                      {state.transcript ? (
                        <div className="prose prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap text-sm">
                            {state.transcript}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <Mic className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-lg font-medium mb-2">
                            Start Speaking
                          </p>
                          <p className="text-sm">
                            Your AI assistant is listening...
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Controls */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={state.isConnected ? "default" : "secondary"}
                      >
                        {state.isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                      </Badge>
                      {state.isRecording && (
                        <Badge
                          variant="outline"
                          className="text-red-400 border-red-500/30"
                        >
                          🎤 Recording
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant={state.isRecording ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleRecording}
                      >
                        {state.isRecording ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={state.isCameraOn ? stopVideo : startCamera}
                        className="relative"
                        title={
                          state.isCameraOn ? "Stop camera" : "Start camera"
                        }
                      >
                        {state.isCameraOn ? (
                          <VideoOff className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {state.isCameraOn && isCapturing && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={
                          state.isScreenSharing ? stopVideo : startScreenShare
                        }
                        className="relative"
                        title={
                          state.isScreenSharing
                            ? "Stop screen sharing"
                            : "Start screen sharing"
                        }
                      >
                        {state.isScreenSharing ? (
                          <MonitorOff className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                        {state.isScreenSharing && isCapturing && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Text Input */}
                  <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                      value={state.message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message or use voice..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!state.message.trim()}>
                      Send
                    </Button>
                  </form>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setIsProductSelecting(true)}
                    variant="outline"
                    className="mr-4"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Product Onboarding
                  </Button>

                  <Button onClick={disconnect} variant="outline">
                    <Square className="w-5 h-5 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Onboarding Progress (Desktop Only) */}
          {showOnboardingInterface && state.currentFlow && state.onboardingMode && showProgressPanel && (
          <div className="hidden lg:block w-[25%] border-l border-gray-700 p-6">
          <OnboardingErrorBoundary>
            <OnboardingProgress
            progress={state.onboardingProgress || {
            sessionId: 'temp',
            productId: state.selectedProduct?.id || 'unknown',
            status: 'not_started' as const,
            completedSteps: [],
            currentStepId: state.currentFlow.steps[0]?.id || '',
            completionRate: 0,
            timeSpent: 0,
            errors: [],
            startTime: new Date(),
              lastActivity: new Date()
                }}
                currentStep={
                  state.onboardingContext?.currentStep ||
                state.currentFlow.steps[0]
              }
            allSteps={state.currentFlow.steps}
          onPause={pauseOnboarding}
          onResume={resumeOnboarding}
          onRestart={restartOnboarding}
          isPaused={state.isOnboardingPaused}
          estimatedTimeRemaining={getEstimatedTimeRemaining()}
          />
          </OnboardingErrorBoundary>
          </div>
          )}
        </div>

        {/* Volume Indicators (Bottom) */}
        {state.isConnected && (
          <div className="border-t border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <VolumeIndicator
                label="Input Volume"
                volume={state.inputVolume}
                color="bg-blue-500"
                description="Your microphone level"
              />
              <VolumeIndicator
                label="Output Volume"
                volume={state.outputVolume}
                color="bg-green-500"
                description="AI response audio"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

MainInterface.displayName = "MainInterface";

export default MainInterface;
