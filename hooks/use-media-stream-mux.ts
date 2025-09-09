'use client';

/**
 * Copyright 2024 Google LLC
 * 
 * Optimized Media Stream interface for Next.js
 * Performance-focused with proper cleanup
 */

export type UseMediaStreamResult = {
  type: "webcam" | "screen";
  start: () => Promise<MediaStream>;
  stop: () => void;
  isStreaming: boolean;
  stream: MediaStream | null;
};

export type VideoStreamType = "webcam" | "screen" | null;
