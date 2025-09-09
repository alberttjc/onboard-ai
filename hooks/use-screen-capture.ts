'use client';

/**
 * Copyright 2024 Google LLC
 * 
 * Optimized Screen Capture Hook for Next.js
 * Performance-focused with proper cleanup and error handling
 */

import { useState, useEffect, useCallback } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useScreenCapture(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Optimized cleanup effect
  useEffect(() => {
    if (!stream) return;

    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };

    // Add event listeners to all tracks
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.addEventListener("ended", handleStreamEnded));

    return () => {
      tracks.forEach((track) => 
        track.removeEventListener("ended", handleStreamEnded)
      );
    };
  }, [stream]);

  // Memoized start function for performance
  const start = useCallback(async (): Promise<MediaStream> => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot access screen capture in server-side rendering');
    }

    try {
      // Request screen capture with optimized settings
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 15, max: 30 }, // Lower framerate for screen sharing
        },
        audio: false // We handle audio separately for performance
      });

      setStream(mediaStream);
      setIsStreaming(true);
      return mediaStream;
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      throw error;
    }
  }, []);

  // Memoized stop function for performance
  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  return {
    type: "screen",
    start,
    stop,
    isStreaming,
    stream,
  };
}
