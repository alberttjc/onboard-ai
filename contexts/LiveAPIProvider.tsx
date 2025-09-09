'use client';

/**
 * Optimized LiveAPIContext - Performance-focused state management
 * Replaces 15+ useState hooks with centralized context
 */

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { GenAILiveClient } from '@/lib/genai-live-client';
import { AudioRecorder } from '@/lib/audio-recorder';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/audio-utils';
import { Modality } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

// Types
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
  | { type: 'CLEAR_LOGS' };

// Optimized reducer with batched updates
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
      // Limit logs to prevent memory issues - performance optimization
      const newLogs = [...state.logs, action.payload];
      return { 
        ...state, 
        logs: newLogs.length > 100 ? newLogs.slice(-100) : newLogs 
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
  systemInstruction: 'You are a helpful AI assistant with auto-recording enabled. Users can speak immediately when connected without clicking any buttons. Respond naturally with conversational audio. Keep responses concise and friendly.',
  autoReconnect: true,
};

interface LiveAPIContextType {
  state: LiveAPIState;
  
  // Optimized actions
  setConnected: (connected: boolean) => void;
  setRecording: (recording: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  addLog: (type: LogEntry['type'], message: string, data?: any) => void;
  setTranscript: (transcript: string) => void;
  setMessage: (message: string) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setSystemInstruction: (instruction: string) => void;
  setSessionId: (id: string) => void;
  setCamera: (enabled: boolean) => void;
  setScreenShare: (enabled: boolean) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  clearLogs: () => void;
  
  // Core functionality
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleRecording: () => Promise<void>;
  sendMessage: (text: string) => void;
  
  // Video functionality
  startCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopVideo: () => void;
  
  // Refs for performance
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
  const isConnectedRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Memoized action creators - prevent re-renders
  const setConnected = useCallback((connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
    isConnectedRef.current = connected;
  }, []);

  const setRecording = useCallback((recording: boolean) => {
    dispatch({ type: 'SET_RECORDING', payload: recording });
    isRecordingRef.current = recording;
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

  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    dispatch({ type: 'ADD_LOG', payload: logEntry });
    console.log({ type, message, data });
  }, []);

  const setTranscript = useCallback((transcript: string) => {
    dispatch({ type: 'SET_TRANSCRIPT', payload: transcript });
  }, []);

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

  // Initialize audio components - Performance optimized
  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      try {
        // Initialize AudioRecorder
        audioRecorderRef.current = new AudioRecorder(16000);
        
        // Initialize AudioStreamer
        const audioCtx = await audioContext({ id: 'audio-out' });
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        
        if (isMounted) {
          addLog('success', 'Audio components initialized successfully');
        }
      } catch (error) {
        if (isMounted) {
          addLog('error', 'Failed to initialize audio components', error);
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

  // Connect function - Optimized
  const connect = useCallback(async () => {
    const key = state.apiKey || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!key) {
      addLog('error', 'API key is required');
      return;
    }

    try {
      addLog('info', `Connecting to ${state.selectedModel}...`);
      
      // Create client with optimized config
      const connectionConfig = {
        apiKey: key,
        debug: false, // Disable debug in production for performance
        maxReconnects: state.autoReconnect ? 20 : 0,
        maxAttempts: 15,
      };

      clientRef.current = new GenAILiveClient(connectionConfig);
      
      // Optimized event handlers
      clientRef.current.on('open', () => {
        setConnected(true);
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        addLog('success', `Connected - Session: ${newSessionId}`);
      });

      clientRef.current.on('close', () => {
        setConnected(false);
        if (state.isRecording) {
          setRecording(false);
        }
        addLog('warning', 'Connection closed');
      });

      clientRef.current.on('audio', (audioData: ArrayBuffer) => {
        if (audioStreamerRef.current) {
          audioStreamerRef.current.addPCM16(new Uint8Array(audioData));
        }
      });

      clientRef.current.on('setupcomplete', async () => {
        addLog('success', 'Setup completed');
        if (state.audioEnabled && audioRecorderRef.current) {
          try {
            setRecording(true);
            await audioRecorderRef.current.start();
            addLog('success', 'Auto-started recording');
          } catch (error) {
            addLog('error', 'Failed to auto-start recording', error);
            setRecording(false);
          }
        }
      });

      // Connect with optimized config
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
      addLog('error', 'Failed to connect', error);
    }
  }, [state.apiKey, state.selectedModel, state.systemInstruction, state.audioEnabled, state.autoReconnect, addLog, setConnected, setSessionId, setRecording]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setConnected(false);
      setSessionId('');
      setRecording(false);
      
      // Stop audio recorder when disconnecting
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        addLog('info', '🎤 Audio recorder stopped');
      }
      
      // Stop video streams when disconnecting
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
        setCamera(false);
        setScreenShare(false);
      }
      
      addLog('info', 'Disconnected - all streams stopped');
    }
  }, [setConnected, setSessionId, setRecording, setVideoStream, setCamera, setScreenShare, state.activeVideoStream, addLog]);

  // Optimized recording toggle
  const toggleRecording = useCallback(async () => {
    if (!audioRecorderRef.current || !isConnectedRef.current) {
      addLog('error', 'Must be connected to start recording');
      return;
    }

    try {
      if (!state.isRecording) {
        await audioRecorderRef.current.start();
        setRecording(true);
        addLog('success', 'Recording started');
      } else {
        audioRecorderRef.current.stop();
        setRecording(false);
        addLog('info', 'Recording stopped');
      }
    } catch (error) {
      addLog('error', 'Recording toggle failed', error);
      setRecording(false);
    }
  }, [state.isRecording, addLog, setRecording]);

  // Send message function
  const sendMessage = useCallback((text: string) => {
    if (!clientRef.current || !isConnectedRef.current || !text.trim()) {
      return;
    }

    try {
      clientRef.current.send([{ text }], true);
      // Fix TypeScript error: use current state value instead of callback
      setTranscript(state.transcript + `\nUser: ${text}\n`);
      setMessage('');
      addLog('info', 'Message sent');
    } catch (error) {
      addLog('error', 'Failed to send message', error);
    }
  }, [state.transcript, setTranscript, setMessage, addLog]);

  // Video functionality implementations
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
      
      // Stop any existing streams
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
      }
      
      setVideoStream(stream);
      setCamera(true);
      setScreenShare(false);
      addLog('success', '📹 Camera started successfully');
    } catch (error) {
      addLog('error', 'Failed to start camera', error);
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
      
      // Stop any existing streams
      if (state.activeVideoStream) {
        state.activeVideoStream.getTracks().forEach(track => track.stop());
      }
      
      setVideoStream(stream);
      setScreenShare(true);
      setCamera(false);
      addLog('success', '🖥️ Screen sharing started successfully');
      
      // Handle when user stops sharing via browser UI
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          setVideoStream(null);
          setScreenShare(false);
          addLog('info', 'Screen sharing ended by user');
        });
      });
    } catch (error) {
      addLog('error', 'Failed to start screen sharing', error);
      setScreenShare(false);
    }
  }, [state.activeVideoStream, setVideoStream, setScreenShare, setCamera, addLog]);

  const stopVideo = useCallback(() => {
    if (state.activeVideoStream) {
      state.activeVideoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
      setCamera(false);
      setScreenShare(false);
      addLog('info', '📹 Video stopped');
    }
  }, [state.activeVideoStream, setVideoStream, setCamera, setScreenShare, addLog]);

  // Set up audio recording event handlers - Performance optimized
  useEffect(() => {
    const audioRecorder = audioRecorderRef.current;
    if (!audioRecorder) return;

    const handleAudioData = (base64Data: string) => {
      if (isConnectedRef.current && isRecordingRef.current && clientRef.current) {
        try {
          clientRef.current.sendRealtimeInput([{
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data,
          }]);
        } catch (error) {
          addLog('error', 'Failed to send audio', error);
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
  }, [addLog, setInputVolume]);

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
