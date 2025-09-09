/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining class names with Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// A map to store AudioContext instances
const audioContexts: Record<string, AudioContext> = {};

// Create or get an AudioContext with a specific ID
export const audioContext = async ({ id }: { id: string }): Promise<AudioContext> => {
  if (audioContexts[id]) {
    return audioContexts[id];
  }

  // Create a new context if browser supports it
  if (typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported in this browser');
    }
    
    const context = new AudioContextClass();
    audioContexts[id] = context;
    
    // Resume context if possible (needed for some browsers)
    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch (e) {
        console.warn('Could not resume audio context:', e);
      }
    }
    
    return context;
  }
  
  throw new Error('AudioContext is not available in this environment');
};

// Utility to convert float32 array to int16 PCM
export function float32ToPCM16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Convert from [-1.0, 1.0] to [-32768, 32767]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return int16Array;
}

// Utility to convert int16 PCM to float32
export function PCM16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    // Convert from [-32768, 32767] to [-1.0, 1.0]
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 32768 : 32767);
  }
  return float32Array;
}

// Utility to convert sample rate
export function convertSampleRate(
  audioBuffer: AudioBuffer,
  targetSampleRate: number
): Float32Array {
  const sourceSampleRate = audioBuffer.sampleRate;
  const sourceLength = audioBuffer.length;
  
  if (sourceSampleRate === targetSampleRate) {
    return audioBuffer.getChannelData(0);
  }
  
  const targetLength = Math.round(sourceLength * targetSampleRate / sourceSampleRate);
  const result = new Float32Array(targetLength);
  
  const sourceData = audioBuffer.getChannelData(0);
  let resultIndex = 0;
  
  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = Math.floor(i * sourceSampleRate / targetSampleRate);
    result[resultIndex++] = sourceData[sourceIndex];
  }
  
  return result;
}
