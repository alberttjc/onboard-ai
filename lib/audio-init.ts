'use client';

/**
 * Helper functions to initialize audio context for browser compatibility
 */

// Flag to track if audio has been initialized
let audioInitialized = false;

/**
 * Initialize audio context to work around browser autoplay policy restrictions
 * This should be called in response to a user gesture (click, tap, etc.)
 */
export const initializeAudio = async (): Promise<boolean> => {
  if (audioInitialized) {
    console.log('Audio already initialized');
    return true;
  }

  if (typeof window === 'undefined') {
    console.warn('Cannot initialize audio on server side');
    return false;
  }

  try {
    // Create a temporary audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      console.error('AudioContext not supported in this browser');
      return false;
    }

    const audioCtx = new AudioContext();
    
    // Create a silent audio buffer and play it
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    // Start and immediately stop the source
    source.start(0);
    source.stop(0.001);
    
    // If the context is in suspended state, try to resume it
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    // Mark as initialized
    audioInitialized = true;
    console.log('Audio context initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Error initializing audio:', error);
    return false;
  }
};

/**
 * Check if audio is allowed in the current browser
 */
export const isAudioSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check for AudioContext support
  const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
  
  // Check for MediaDevices API and getUserMedia support
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  return hasAudioContext && hasMediaDevices;
};

/**
 * Register event handlers to initialize audio on first user interaction
 */
export const setupAutoAudioInit = (): void => {
  if (typeof window === 'undefined' || audioInitialized) {
    return;
  }
  
  const initOnUserAction = () => {
    initializeAudio().then(success => {
      if (success) {
        // Remove event listeners once initialized
        ['click', 'touchstart', 'keydown'].forEach(event => {
          document.removeEventListener(event, initOnUserAction);
        });
      }
    });
  };
  
  // Listen for user interactions
  ['click', 'touchstart', 'keydown'].forEach(event => {
    document.addEventListener(event, initOnUserAction, { once: false });
  });
  
  console.log('Auto audio initialization handlers registered');
};
