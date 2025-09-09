'use client';

/**
 * Optimized Video Frame Processor for Gemini Live API
 * Handles video frame capture and streaming to Gemini
 * Based on the original React app but optimized for performance
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLiveAPI } from '@/contexts/LiveAPIProvider';

interface VideoFrameProcessorOptions {
  frameRate?: number; // frames per second to send to API
  quality?: number; // JPEG quality (0-1)
  scale?: number; // scale factor (0-1) to reduce frame size
}

export function useVideoFrameProcessor(
  videoRef: React.RefObject<HTMLVideoElement>,
  options: VideoFrameProcessorOptions = {}
) {
  const { state, clientRef, addLog } = useLiveAPI();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  
  const {
    frameRate = 0.5, // 0.5 fps default (like original app)
    quality = 0.8,    // 80% JPEG quality
    scale = 0.25      // 25% scale (like original app)
  } = options;

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.style.display = 'none';
      document.body.appendChild(canvasRef.current);
    }

    return () => {
      if (canvasRef.current && document.body.contains(canvasRef.current)) {
        document.body.removeChild(canvasRef.current);
      }
    };
  }, []);

  // Optimized frame capture function
  const captureAndSendFrame = useCallback(() => {
    if (!state.isConnected || !clientRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    try {
      // Set canvas size (scaled down for performance)
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG
      const base64 = canvas.toDataURL('image/jpeg', quality);
      const data = base64.slice(base64.indexOf(',') + 1);

      // Send frame to Gemini API
      clientRef.current.sendRealtimeInput([{
        mimeType: 'image/jpeg',
        data
      }]);

      addLog('info', `📸 Sent video frame: ${canvas.width}x${canvas.height}`);
    } catch (error) {
      addLog('error', 'Failed to capture video frame', error);
    }
  }, [state.isConnected, videoRef, clientRef, scale, quality, addLog]);

  // Video frame streaming loop
  useEffect(() => {
    const startFrameCapture = () => {
      // Check if we should continue capturing
      if (!state.isConnected || (!state.isCameraOn && !state.isScreenSharing)) {
        return;
      }
      
      captureAndSendFrame();
      timeoutRef.current = window.setTimeout(startFrameCapture, 1000 / frameRate);
    };

    if (state.isConnected && (state.isCameraOn || state.isScreenSharing)) {
      addLog('info', `📹 Starting video frame capture at ${frameRate} fps`);
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(startFrameCapture);
    } else {
      // Stop capturing if conditions no longer met
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        addLog('info', '📹 Video frame capture stopped');
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state.isConnected, state.isCameraOn, state.isScreenSharing, frameRate, captureAndSendFrame, addLog]);

  return {
    captureFrame: captureAndSendFrame,
    isCapturing: state.isConnected && (state.isCameraOn || state.isScreenSharing)
  };
}
