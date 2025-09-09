'use client';

/**
 * Enhanced AudioStreamer class for handling PCM16 audio streaming with better reliability
 */
export class AudioStreamer {
  private sampleRate: number = 24000;
  private bufferSize: number = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private isStreamComplete: boolean = false;
  private checkInterval: number | null = null;
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1; // 100ms initial buffer
  public gainNode: GainNode;
  private analyserNode: AnalyserNode | null = null;
  private startTime: number = 0;
  private debug: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(public context: AudioContext, debug: boolean = false) {
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    
    // Set up analyser for visualization if needed
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.gainNode.connect(this.analyserNode);
    
    this.addPCM16 = this.addPCM16.bind(this);
    this.debug = debug;
    
    // Set start time
    this.startTime = Date.now();
    
    this.logDebug("AudioStreamer initialized with sample rate:", this.sampleRate);
  }

  /**
   * Add a worklet to the audio context
   */
  async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    try {
      // Create a Blob from the worklet source
      const blob = new Blob([workletSrc], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      
      // Add the worklet module to the context
      await this.context.audioWorklet.addModule(url);
      
      // Create a worklet node
      const worklet = new AudioWorkletNode(this.context, workletName);
      
      // Connect the worklet to our audio graph
      this.gainNode.connect(worklet);
      worklet.connect(this.context.destination);
      
      // Set up message handling
      worklet.port.onmessage = function(ev: MessageEvent) {
        handler(ev);
      };
      
      // Clean up the URL
      URL.revokeObjectURL(url);
      
      this.logDebug("Added worklet:", workletName);
      return this;
    } catch (error) {
      console.error('Failed to add worklet:', error);
      return this;
    }
  }

  /**
   * Convert PCM16 data to Float32Array for Web Audio API
   */
  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        console.error('Error processing PCM chunk:', e);
      }
    }
    return float32Array;
  }

  /**
   * Add PCM16 data to the audio queue
   */
  addPCM16(chunk: Uint8Array) {
    this.logDebug(`Adding PCM16 chunk of size ${chunk.length}`);
    
    // Reset the stream complete flag when a new chunk is added
    this.isStreamComplete = false;
    
    try {
      // Ensure context is resumed
      if (this.context.state === "suspended") {
        this.context.resume()
          .then(() => this.logDebug("AudioContext resumed"))
          .catch(err => console.error("Failed to resume audio context:", err));
      }
      
      // Process the chunk into a Float32Array
      let processingBuffer = this._processPCM16Chunk(chunk);
      
      // Add the processed buffer to the queue
      while (processingBuffer.length >= this.bufferSize) {
        const buffer = processingBuffer.slice(0, this.bufferSize);
        this.audioQueue.push(buffer);
        processingBuffer = processingBuffer.slice(this.bufferSize);
      }
      
      // Add any remaining data
      if (processingBuffer.length > 0) {
        this.audioQueue.push(processingBuffer);
      }
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.scheduledTime = this.context.currentTime + this.initialBufferTime;
        this.scheduleNextBuffer();
      }
    } catch (error) {
      console.error('Error adding PCM16 data:', error);
      // Try to recover if possible
      this.attemptRecovery();
    }
  }

  /**
   * Attempt to recover from an error
   */
  private attemptRecovery() {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      this.logDebug(`Attempting audio recovery (${this.retryCount}/${this.maxRetries})`);
      
      // Reset state
      this.stop();
      
      // Create a new gain node
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      
      // Reconnect analyser if exists
      if (this.analyserNode) {
        this.gainNode.connect(this.analyserNode);
      }
      
      // Resume context if suspended
      if (this.context.state === "suspended") {
        this.context.resume().catch(e => console.error("Error resuming context during recovery:", e));
      }
      
      // Reset playing state
      this.isPlaying = false;
      this.isStreamComplete = false;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      
      // Try to schedule any remaining buffers
      if (this.audioQueue.length > 0) {
        this.isPlaying = true;
        this.scheduleNextBuffer();
      }
    } else {
      console.error("Max recovery attempts reached, audio playback may be unstable");
    }
  }

  /**
   * Create an AudioBuffer from Float32Array data
   */
  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(
      1, // mono
      audioData.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  /**
   * Schedule the next buffer to play
   */
  private scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      // Ensure we never schedule in the past
      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      
      try {
        source.start(startTime);
        this.scheduledTime = startTime + audioBuffer.duration;
      } catch (error) {
        console.error("Error starting audio source:", error);
        // Try to recover by moving ahead in time
        this.scheduledTime = this.context.currentTime + 0.1;
      }
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              this.scheduleNextBuffer();
            }
          }, 100) as unknown as number;
        }
      }
    } else {
      const nextCheckTime =
        (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    }
  }

  /**
   * Stop playing audio
   */
  stop() {
    this.logDebug('Stopping audio streamer');
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Fade out to avoid clicks
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      
      // Reconnect analyser if exists
      if (this.analyserNode) {
        this.gainNode.connect(this.analyserNode);
      }
    }, 200);
  }

  /**
   * Resume playing
   */
  async resume() {
    if (this.context.state === "suspended") {
      try {
        await this.context.resume();
        this.logDebug("AudioContext resumed");
      } catch (error) {
        console.error("Error resuming audio context:", error);
      }
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  /**
   * Get the analyser node for visualizations
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }
  
  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(...args: any[]): void {
    if (this.debug) {
      console.log("[AudioStreamer]", ...args);
    }
  }
}
