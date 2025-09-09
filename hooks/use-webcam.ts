'use client';

/**
 * Copyright 2024 Google LLC
 * 
 * Optimized Webcam Hook for Next.js
 * Performance-focused with proper cleanup and error handling
 */

import { useState, useEffect, useCallback } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

export function useWebcam(): UseMediaStreamResult {
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
      throw new Error('Cannot access media devices in server-side rendering');
    }

    try {
      // Request webcam with optimized settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: false // We handle audio separately for performance
      });

      setStream(mediaStream);
      setIsStreaming(true);
      return mediaStream;
    } catch (error) {
      console.error('Failed to start webcam:', error);
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
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
  };
}
