/**
 * Simplified LiveAPIContext - Removes circular dependencies and excessive complexity
 * FIXED: All TypeScript errors resolved
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { GenAILiveClient } from '@/lib/genai-live-client';
import { AudioRecorder } from '@/lib/audio-recorder';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/audio-utils';
import { Modality } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

// Import onboarding system
import { onboardingManager } from '@/lib/onboarding/onboarding-manager';
import { 
  OnboardingProduct, 
  OnboardingFlow, 
  OnboardingProgress, 
  ConversationContext as OnboardingContext 
} from '@/lib/types/onboarding.types';

// Simplified types
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  data?: any;
}

interface LiveAPIState {
  // Connection
  isConnected: boolean;
  sessionId: string;
  selectedModel: string;
  apiKey: string;
  
  // Audio
  isRecording: boolean;
  audioEnabled: boolean;
  inputVolume: number;
  outputVolume: number;
  
  // Video
  isCameraOn: boolean;
  isScreenSharing: boolean;
  activeVideoStream: MediaStream | null;
  
  // UI
  logs: LogEntry[];
  transcript: string;
  message: string;
  systemInstruction: string;
  autoReconnect: boolean;
  
  // Onboarding Integration
  onboardingMode: boolean;
  selectedProduct: OnboardingProduct | null;
  currentFlow: OnboardingFlow | null;
  onboardingProgress: OnboardingProgress | null;
  onboardingContext: OnboardingContext | null;
  isOnboardingPaused: boolean;
}

type LiveAPIAction = 
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_AUDIO_ENABLED'; payload: boolean }
  | { type: 'SET_INPUT_VOLUME'; payload: number }
  | { type: 'SET_OUTPUT_VOLUME'; payload: number }
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'SET_MESSAGE'; payload: string }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_SYSTEM_INSTRUCTION'; payload: string }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_CAMERA'; payload: boolean }
  | { type: 'SET_SCREEN_SHARE'; payload: boolean }
  | { type: 'SET_VIDEO_STREAM'; payload: MediaStream | null }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_ONBOARDING_MODE'; payload: boolean }
  | { type: 'SET_SELECTED_PRODUCT'; payload: OnboardingProduct | null }
  | { type: 'SET_CURRENT_FLOW'; payload: OnboardingFlow | null }
  | { type: 'SET_ONBOARDING_PROGRESS'; payload: OnboardingProgress | null }
  | { type: 'SET_ONBOARDING_CONTEXT'; payload: OnboardingContext | null }
  | { type: 'SET_ONBOARDING_PAUSED'; payload: boolean };

function liveAPIReducer(state: LiveAPIState, action: LiveAPIAction): LiveAPIState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_AUDIO_ENABLED':
      return { ...state, audioEnabled: action.payload };
    case 'SET_INPUT_VOLUME':
      return { ...state, inputVolume: action.payload };
    case 'SET_OUTPUT_VOLUME':
      return { ...state, outputVolume: action.payload };
    case 'ADD_LOG':
      const newLogs = [...state.logs, action.payload];
      return { 
        ...state, 
        logs: newLogs.length > 50 ? newLogs.slice(-50) : newLogs // Reduced from 100 to 50
      };
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_SYSTEM_INSTRUCTION':
      return { ...state, systemInstruction: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_CAMERA':
      return { ...state, isCameraOn: action.payload };
    case 'SET_SCREEN_SHARE':
      return { ...state, isScreenSharing: action.payload };
    case 'SET_VIDEO_STREAM':
      return { ...state, activeVideoStream: action.payload };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    case 'SET_ONBOARDING_MODE':
      return { ...state, onboardingMode: action.payload };
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload };
    case 'SET_CURRENT_FLOW':
      return { ...state, currentFlow: action.payload };
    case 'SET_ONBOARDING_PROGRESS':
      return { ...state, onboardingProgress: action.payload };
    case 'SET_ONBOARDING_CONTEXT':
      return { ...state, onboardingContext: action.payload };
    case 'SET_ONBOARDING_PAUSED':
      return { ...state, isOnboardingPaused: action.payload };
    default:
      return state;
  }
}

const initialState: LiveAPIState = {
  isConnected: false,
  sessionId: '',
  selectedModel: 'models/gemini-2.0-flash-exp',
  apiKey: '',
  isRecording: false,
  audioEnabled: true,
  inputVolume: 0,
  outputVolume: 0,
  isCameraOn: false,
  isScreenSharing: false,
  activeVideoStream: null,
  logs: [],
  transcript: '',
  message: '',
  systemInstruction: 'You are a helpful AI assistant.',
  autoReconnect: true,
  onboardingMode: false,
  selectedProduct: null,
  currentFlow: null,
  onboardingProgress: null,
  onboardingContext: null,
  isOnboardingPaused: false,
};

interface LiveAPIContextType {
  state: LiveAPIState;
  setConnected: (connected: boolean) => void;
  setRecording: (recording: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  addLog: (type: LogEntry['type'], message: string, data?: any) => void;
  setTranscript: (transcript: string | ((prev: string) => string)) => void;
  setMessage: (message: string) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setSystemInstruction: (instruction: string) => void;
  setSessionId: (id: string) => void;
  setCamera: (enabled: boolean) => void;
  setScreenShare: (enabled: boolean) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  clearLogs: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleRecording: () => Promise<void>;
  sendMessage: (text: string) => void;
  startCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopVideo: () => void;
  getAvailableProducts: () => OnboardingProduct[];
  selectProduct: (productId: string) => Promise<{ success: boolean; message: string }>;
  startOnboarding: () => Promise<void>;
  pauseOnboarding: () => void;
  resumeOnboarding: () => void;
  restartOnboarding: () => void;
  processOnboardingInput: (input: string, audioTranscript?: string) => Promise<void>;
  getEstimatedTimeRemaining: () => number;
  getCurrentStepGuidance: () => string;
  clientRef: React.MutableRefObject<GenAILiveClient | null>;
  audioRecorderRef: React.MutableRefObject<AudioRecorder | null>;
  audioStreamerRef: React.MutableRefObject<AudioStreamer | null>;
}

const LiveAPIContext = createContext<LiveAPIContextType | null>(null);

export function LiveAPIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(liveAPIReducer, initialState);
  
  // Performance-optimized refs
  const clientRef = useRef<GenAILiveClient | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  // Basic action creators (simplified)
  const setConnected = useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  }, []);

  const setRecording = useCallback((recording: boolean) => {
    dispatch({ type: 'SET_RECORDING', payload: recording });
  }, []);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_AUDIO_ENABLED', payload: enabled });
  }, []);

  const setInputVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_INPUT_VOLUME', payload: volume });
  }, []);

  const setOutputVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_OUTPUT_VOLUME', payload: volume });
  }, []);

  // Simplified logging (reduced verbosity)
  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    // Only log errors and critical info to reduce noise
    if (type === 'error' || (type === 'success' && message.includes('Connected'))) {
      const logEntry: LogEntry = {
        id: uuidv4(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        data,
      };
      dispatch({ type: 'ADD_LOG', payload: logEntry });
      console.log({ type, message, data });
    }
  }, []);

  // FIXED: Updated setTranscript to handle both direct values and updater functions
  const setTranscript = useCallback((transcript: string | ((prev: string) => string)) => {
    if (typeof transcript === 'string') {
      dispatch({ type: 'SET_TRANSCRIPT', payload: transcript });
    } else {
      dispatch({ type: 'SET_TRANSCRIPT', payload: transcript(state.transcript) });
    }
  }, [state.transcript]);

  const setMessage = useCallback((message: string) => {
    dispatch({ type: 'SET_MESSAGE', payload: message });
  }, []);

  const setApiKey = useCallback((key: string) => {
    dispatch({ type: 'SET_API_KEY', payload: key });
  }, []);

  const setModel = useCallback((model: string) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  }, []);

  const setSystemInstruction = useCallback((instruction: string) => {
    dispatch({ type: 'SET_SYSTEM_INSTRUCTION', payload: instruction });
  }, []);

  const setSessionId = useCallback((id: string) => {
    dispatch({ type: 'SET_SESSION_ID', payload: id });
  }, []);

  const setCamera = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_CAMERA', payload: enabled });
  }, []);

  const setScreenShare = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_SCREEN_SHARE', payload: enabled });
  }, []);

  const setVideoStream = useCallback((stream: MediaStream | null) => {
    dispatch({ type: 'SET_VIDEO_STREAM', payload: stream });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);

  // FIXED: Removed circular dependency refs - direct implementation
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setConnected(false);
      setSessionId('');
      setRecording(false);
      
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
      
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
        setCamera(false);
        setScreenShare(false);
      }
      
      addLog('info', 'Disconnected');
    }
  }, [setConnected, setSessionId, setRecording, setVideoStream, setCamera, setScreenShare, state.activeVideoStream, addLog]);

  const connect = useCallback(async () => {
    const key = state.apiKey || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!key) {
      addLog('error', 'API key is required');
      return;
    }

    try {
      const connectionConfig = {
        apiKey: key,
        debug: false,
        maxReconnects: state.autoReconnect ? 20 : 0,
        maxAttempts: 15,
      };

      clientRef.current = new GenAILiveClient(connectionConfig);
      
      // Event handlers
      clientRef.current.on('open', () => {
        setConnected(true);
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        addLog('success', `Connected - Session: ${newSessionId}`);
      });

      clientRef.current.on('close', () => {
        setConnected(false);
        setRecording(false);
        addLog('error', 'Connection closed');
      });

      clientRef.current.on('audio', (audioData: ArrayBuffer) => {
        if (audioStreamerRef.current) {
          audioStreamerRef.current.addPCM16(new Uint8Array(audioData));
        }
      });

      clientRef.current.on('setupcomplete', async () => {
        // Send onboarding messages if in onboarding mode
        if (state.onboardingMode && state.currentFlow) {
          const welcomeMessage = state.currentFlow.welcomeMessage;
          const firstStep = state.currentFlow.steps[0];
          const firstStepGuidance = onboardingManager.generateStepGuidance(firstStep);
          
          if (welcomeMessage && clientRef.current) {
            setTimeout(() => {
              if (clientRef.current) {
                clientRef.current.send([{ text: welcomeMessage }], false);
                
                setTimeout(() => {
                  if (clientRef.current) {
                    clientRef.current.send([{ text: firstStepGuidance }], false);
                  }
                }, 2000);
              }
            }, 1000);
          }
        }
        
        if (state.audioEnabled && audioRecorderRef.current) {
          try {
            setRecording(true);
            await audioRecorderRef.current.start();
          } catch (error) {
            addLog('error', 'Failed to auto-start recording');
            setRecording(false);
          }
        }
      });

      // FIXED: Correct content handling for LiveServerContent type
      clientRef.current.on('content', (content) => {
        // Handle the proper structure of LiveServerContent
        if ('modelTurn' in content && content.modelTurn?.parts) {
          const textContent = content.modelTurn.parts
            .filter(part => part.text)
            .map(part => part.text)
            .join(' ');
          
          if (textContent.trim()) {
            setTranscript((prev: string) => prev + `\nAssistant: ${textContent}\n`);
          }
        }
      });

      // Connect with current system instruction
      const config = {
        systemInstruction: {
          parts: [{ text: state.systemInstruction }],
        },
        responseModalities: [state.audioEnabled ? Modality.AUDIO : Modality.TEXT],
        ...(state.audioEnabled && {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              },
            },
          },
        }),
      };

      await clientRef.current.connect(state.selectedModel, config);
      
    } catch (error) {
      addLog('error', 'Failed to connect');
    }
  }, [
    state.apiKey, 
    state.selectedModel, 
    state.systemInstruction, 
    state.audioEnabled, 
    state.autoReconnect,
    state.onboardingMode,
    state.currentFlow,
    addLog, 
    setConnected, 
    setSessionId, 
    setRecording,
    setTranscript
  ]);

  // Onboarding functions (simplified)
  const getAvailableProducts = useCallback((): OnboardingProduct[] => {
    return onboardingManager.getAvailableProducts();
  }, []);

  const selectProduct = useCallback(async (productId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = onboardingManager.selectProduct(productId);
      
      if (result.success && result.flow) {
        const product = getAvailableProducts().find(p => p.id === productId);
        
        dispatch({ type: 'SET_SELECTED_PRODUCT', payload: product || null });
        dispatch({ type: 'SET_CURRENT_FLOW', payload: result.flow });
        dispatch({ type: 'SET_ONBOARDING_MODE', payload: true });
        
        if (result.flow.systemPrompt) {
          setSystemInstruction(result.flow.systemPrompt);
        }
        
        const initialProgress = onboardingManager.getCurrentProgress();
        const initialContext = onboardingManager.getCurrentContext();
        
        if (initialProgress) {
          dispatch({ type: 'SET_ONBOARDING_PROGRESS', payload: initialProgress });
        }
        
        if (initialContext) {
          dispatch({ type: 'SET_ONBOARDING_CONTEXT', payload: initialContext });
        }
      }
      
      return result;
    } catch (error) {
      addLog('error', 'Failed to select product');
      return { success: false, message: 'Failed to select product' };
    }
  }, [getAvailableProducts, setSystemInstruction, addLog]);

  const startOnboarding = useCallback(async (): Promise<void> => {
    if (!state.currentFlow) {
      addLog('error', 'No flow selected');
      return;
    }

    try {
      const onboardingPrompt = state.currentFlow.systemPrompt;
      setSystemInstruction(onboardingPrompt);
      
      // Brief delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If already connected, disconnect and reconnect with new prompt
      if (state.isConnected) {
        disconnect();
        setTimeout(async () => {
          await connect();
        }, 1500);
      }
      
      const progress = onboardingManager.getCurrentProgress();
      const context = onboardingManager.getCurrentContext();
      
      dispatch({ type: 'SET_ONBOARDING_PROGRESS', payload: progress });
      dispatch({ type: 'SET_ONBOARDING_CONTEXT', payload: context });
      
    } catch (error) {
      addLog('error', 'Failed to start onboarding');
    }
  }, [state.currentFlow, state.isConnected, setSystemInstruction, disconnect, connect, addLog]);

  const restartOnboarding = useCallback((): void => {
    if (state.isConnected) {
      disconnect();
    }
    
    onboardingManager.resetSession();
    
    dispatch({ type: 'SET_ONBOARDING_MODE', payload: false });
    dispatch({ type: 'SET_SELECTED_PRODUCT', payload: null });
    dispatch({ type: 'SET_CURRENT_FLOW', payload: null });
    dispatch({ type: 'SET_ONBOARDING_PROGRESS', payload: null });
    dispatch({ type: 'SET_ONBOARDING_CONTEXT', payload: null });
    dispatch({ type: 'SET_ONBOARDING_PAUSED', payload: false });
    
    setSystemInstruction('You are a helpful AI assistant.');
    setTranscript('');
  }, [disconnect, setSystemInstruction, setTranscript, state.isConnected]);

  const pauseOnboarding = useCallback((): void => {
    onboardingManager.pauseSession();
    dispatch({ type: 'SET_ONBOARDING_PAUSED', payload: true });
  }, []);

  const resumeOnboarding = useCallback((): void => {
    onboardingManager.resumeSession();
    dispatch({ type: 'SET_ONBOARDING_PAUSED', payload: false });
  }, []);

  const processOnboardingInput = useCallback(async (input: string, audioTranscript?: string): Promise<void> => {
    if (!state.onboardingMode) {
      return;
    }

    try {
      const result = await onboardingManager.processUserInput(input, audioTranscript);
      
      if (result.success) {
        if (result.progress) {
          dispatch({ type: 'SET_ONBOARDING_PROGRESS', payload: result.progress });
        }
        if (result.context) {
          dispatch({ type: 'SET_ONBOARDING_CONTEXT', payload: result.context });
        }
        if (result.systemPrompt) {
          setSystemInstruction(result.systemPrompt);
        }
        
        // Send step guidance as AI message
        if (result.stepGuidance && clientRef.current && state.isConnected) {
          setTimeout(() => {
            if (clientRef.current) {
              clientRef.current.send([{ text: result.stepGuidance }], false);
            }
          }, 800);
        }
        
        if (result.completed) {
          if (state.currentFlow && clientRef.current) {
            setTimeout(() => {
              if (clientRef.current && state.currentFlow) {
                clientRef.current.send([{ text: state.currentFlow.completionMessage }], false);
              }
            }, 1200);
          }
          
          setTimeout(() => {
            dispatch({ type: 'SET_ONBOARDING_MODE', payload: false });
          }, 5000);
        }
      }
    } catch (error) {
      addLog('error', 'Failed to process onboarding input');
    }
  }, [state.onboardingMode, state.isConnected, state.currentFlow, setSystemInstruction, addLog]);

  const getEstimatedTimeRemaining = useCallback((): number => {
    return onboardingManager.getEstimatedTimeRemaining();
  }, []);

  const getCurrentStepGuidance = useCallback((): string => {
    if (!state.onboardingContext?.currentStep) return '';
    return onboardingManager.generateStepGuidance(state.onboardingContext.currentStep);
  }, [state.onboardingContext]);

  // Recording toggle (simplified)
  const toggleRecording = useCallback(async () => {
    if (!audioRecorderRef.current || !state.isConnected) {
      addLog('error', 'Must be connected to start recording');
      return;
    }

    try {
      if (!state.isRecording) {
        await audioRecorderRef.current.start();
        setRecording(true);
      } else {
        audioRecorderRef.current.stop();
        setRecording(false);
      }
    } catch (error) {
      addLog('error', 'Recording toggle failed');
      setRecording(false);
    }
  }, [state.isRecording, state.isConnected, addLog, setRecording]);

  const sendMessage = useCallback((text: string) => {
    if (!clientRef.current || !state.isConnected || !text.trim()) {
      return;
    }

    try {
      clientRef.current.send([{ text }], true);
      setTranscript((prev: string) => prev + `\nUser: ${text}\n`);
      setMessage('');
      
      if (state.onboardingMode) {
        processOnboardingInput(text).catch(() => {
          addLog('error', 'Failed to process onboarding input');
        });
      }
    } catch (error) {
      addLog('error', 'Failed to send message');
    }
  }, [state.onboardingMode, state.isConnected, setTranscript, setMessage, addLog, processOnboardingInput]);

  // Video functionality (simplified)
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
      }
      
      setVideoStream(stream);
      setCamera(true);
      setScreenShare(false);
    } catch (error) {
      addLog('error', 'Failed to start camera');
      setCamera(false);
    }
  }, [state.activeVideoStream, setVideoStream, setCamera, setScreenShare, addLog]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      });
      
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
      }
      
      setVideoStream(stream);
      setScreenShare(true);
      setCamera(false);
      
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          setVideoStream(null);
          setScreenShare(false);
        });
      });
    } catch (error) {
      addLog('error', 'Failed to start screen sharing');
      setScreenShare(false);
    }
  }, [state.activeVideoStream, setVideoStream, setScreenShare, setCamera, addLog]);

  const stopVideo = useCallback(() => {
    if (state.activeVideoStream) {
      state.activeVideoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
      setCamera(false);
      setScreenShare(false);
    }
  }, [state.activeVideoStream, setVideoStream, setCamera, setScreenShare]);

  // Initialize audio components
  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      try {
        audioRecorderRef.current = new AudioRecorder(16000);
        const audioCtx = await audioContext({ id: 'audio-out' });
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        
        if (isMounted) {
          addLog('success', 'Audio components initialized');
        }
      } catch (error) {
        if (isMounted) {
          addLog('error', 'Failed to initialize audio components');
        }
      }
    };

    initAudio();

    return () => {
      isMounted = false;
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };
  }, [addLog]);

  // Audio recording event handlers (fixed memory leak)
  useEffect(() => {
    const audioRecorder = audioRecorderRef.current;
    if (!audioRecorder) return;

    const handleAudioData = (base64Data: string) => {
      if (state.isConnected && state.isRecording && clientRef.current) {
        try {
          clientRef.current.sendRealtimeInput([{
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data,
          }]);
        } catch (error) {
          addLog('error', 'Failed to send audio');
        }
      }
    };

    const handleVolumeChange = (volume: number) => {
      setInputVolume(volume * 100);
    };

    audioRecorder.on('data', handleAudioData);
    audioRecorder.on('volume', handleVolumeChange);

    return () => {
      audioRecorder.off('data', handleAudioData);
      audioRecorder.off('volume', handleVolumeChange);
    };
  }, [state.isConnected, state.isRecording, addLog, setInputVolume]);

  const contextValue: LiveAPIContextType = {
    state,
    setConnected,
    setRecording,
    setAudioEnabled,
    setInputVolume,
    setOutputVolume,
    addLog,
    setTranscript,
    setMessage,
    setApiKey,
    setModel,
    setSystemInstruction,
    setSessionId,
    setCamera,
    setScreenShare,
    setVideoStream,
    clearLogs,
    connect,
    disconnect,
    toggleRecording,
    sendMessage,
    startCamera,
    startScreenShare,
    stopVideo,
    getAvailableProducts,
    selectProduct,
    startOnboarding,
    pauseOnboarding,
    resumeOnboarding,
    restartOnboarding,
    processOnboardingInput,
    getEstimatedTimeRemaining,
    getCurrentStepGuidance,
    clientRef,
    audioRecorderRef,
    audioStreamerRef,
  };

  return (
    <LiveAPIContext.Provider value={contextValue}>
      {children}
    </LiveAPIContext.Provider>
  );
}

export function useLiveAPI() {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error('useLiveAPI must be used within LiveAPIProvider');
  }
  return context;
}
