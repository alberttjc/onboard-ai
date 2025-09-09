'use client';

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

import { audioContext } from "./audio-utils";
import VolMeterWorket from "./worklets/vol-meter";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Create a blob URL for the worklet
function createWorketFromSrc(name: string, src: string) {
  const blob = new Blob([src], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

// Audio processing worklet code
const AudioRecordingWorklet = `
class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffers = [];
    this._frameCount = 0;
    this._dropped = 0;
    this._isRecording = true; // Start recording immediately
  }

  _isRecording = true; // Always record when worklet is active
  _dropped = 0;

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input.length) return true; // Removed _isRecording check

    const buffer = input[0];
    if (!buffer) return true;

    this._buffers.push(Float32Array.from(buffer));
    this._frameCount += buffer.length;

    if (this._frameCount >= 1600) {
      const mergedBuffer = new Float32Array(this._frameCount);
      let offset = 0;
      for (const buffer of this._buffers) {
        mergedBuffer.set(buffer, offset);
        offset += buffer.length;
      }

      const int16Buffer = this._convertToInt16(mergedBuffer);
      this.port.postMessage({
        eventType: 'data',
        data: {
          int16arrayBuffer: int16Buffer.buffer,
          dropped: this._dropped,
        },
      });

      this._buffers = [];
      this._frameCount = 0;
      this._dropped = 0;
    }
    return true;
  }

  _convertToInt16(float32Buffer) {
    const int16Buffer = new Int16Array(float32Buffer.length);
    for (let i = 0; i < float32Buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Buffer[i]));
      int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Buffer;
  }
}

registerProcessor('audio-recorder-worklet', AudioRecorderProcessor);
`;

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (typeof window === 'undefined') {
      throw new Error('Cannot access media devices in server-side rendering');
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName,
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = "vumeter-in";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket),
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        this.starting = null;
      }
    });
    
    return this.starting;
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };
    
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    
    handleStop();
  }
}
