'use client';

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

// Map to store audio contexts by ID
const audioContextMap: Map<string, AudioContext> = new Map();

/**
 * Get or create an AudioContext with the given options
 * Handles browser restrictions on audio context creation
 */
export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext> = (() => {
  // Promise that resolves when user interacts with the page
  const didInteract = new Promise<void>((resolve) => {
    if (typeof window !== 'undefined') {
      window.addEventListener("pointerdown", () => resolve(), { once: true });
      window.addEventListener("keydown", () => resolve(), { once: true });
    }
  });

  return async (options?: GetAudioContextOptions) => {
    if (typeof window === 'undefined') {
      throw new Error("audioContext cannot be used on the server side");
    }
    
    try {
      // Try to unlock audio by playing a silent sound
      const unlockAudio = async () => {
        const audioElement = new Audio();
        audioElement.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        try {
          await audioElement.play();
          console.log("Audio context unlocked via silent audio");
        } catch (e) {
          console.warn("Could not unlock audio automatically, waiting for user interaction", e);
          await didInteract;
        }
      };
      
      await unlockAudio();
      
      // Check if we already have a context with this ID
      if (options?.id && audioContextMap.has(options.id)) {
        const existingContext = audioContextMap.get(options.id);
        if (existingContext) {
          // Resume the context if it's suspended
          if (existingContext.state === "suspended") {
            try {
              await existingContext.resume();
              console.log(`Resumed existing audio context with ID ${options.id}`);
            } catch (e) {
              console.warn(`Could not resume audio context with ID ${options.id}`, e);
            }
          }
          return existingContext;
        }
      }
      
      // Create a new context
      console.log("Creating new AudioContext", options);
      const newContext = new AudioContext(options);
      
      // Store it in the map if it has an ID
      if (options?.id) {
        audioContextMap.set(options.id, newContext);
        console.log(`Stored audio context with ID ${options.id}`);
      }
      
      return newContext;
    } catch (e) {
      console.error("Error creating AudioContext:", e);
      throw e;
    }
  };
})();

/**
 * Convert a base64 string to an ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error("Error converting base64 to ArrayBuffer:", error);
    return new ArrayBuffer(0);
  }
}

/**
 * Create a WAV header for PCM16 audio data
 */
export function createWavHeader(
  pcmDataLength: number,
  sampleRate: number = 16000, 
  numChannels: number = 1,
  bitsPerSample: number = 16
): Uint8Array {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const totalDataLength = 36 + pcmDataLength;
  
  const header = new Uint8Array(44);
  
  // RIFF chunk descriptor
  writeString(header, 0, 'RIFF');
  writeInt32(header, 4, totalDataLength);
  writeString(header, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(header, 12, 'fmt ');
  writeInt32(header, 16, 16); // subchunk1Size - 16 for PCM
  writeInt16(header, 20, 1); // PCM format = 1
  writeInt16(header, 22, numChannels);
  writeInt32(header, 24, sampleRate);
  writeInt32(header, 28, byteRate);
  writeInt16(header, 32, blockAlign);
  writeInt16(header, 34, bitsPerSample);
  
  // data sub-chunk
  writeString(header, 36, 'data');
  writeInt32(header, 40, pcmDataLength);
  
  return header;
}

/**
 * Helper functions for WAV header creation
 */
function writeString(dataView: Uint8Array, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    dataView[offset + i] = string.charCodeAt(i);
  }
}

function writeInt16(dataView: Uint8Array, offset: number, value: number): void {
  dataView[offset] = value & 0xff;
  dataView[offset + 1] = (value >> 8) & 0xff;
}

function writeInt32(dataView: Uint8Array, offset: number, value: number): void {
  dataView[offset] = value & 0xff;
  dataView[offset + 1] = (value >> 8) & 0xff;
  dataView[offset + 2] = (value >> 16) & 0xff;
  dataView[offset + 3] = (value >> 24) & 0xff;
}
