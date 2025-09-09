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

import {
  GoogleGenAIOptions,
  LiveClientToolResponse,
  LiveServerMessage,
  Part,
} from "@google/genai";

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};

// Keep additional useful types for the Next.js project
export interface Log {
  id: string;
  time: Date;
  type: "incoming" | "outgoing" | "message";
  payload: any;
}

export interface ModelTurn {
  parts: Part[];
}

export interface ToolCall {
  functionCalls: FunctionCall[];
  googleSearchCalls?: any[];
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface ServerContent {
  modelTurn?: ModelTurn;
  inputTranscription?: {
    text: string;
    isFinal: boolean;
  };
  outputTranscription?: {
    text: string;
    isFinal: boolean;
  };
  turnComplete?: boolean;
  interrupted?: boolean;
}

export interface SystemInstruction {
  parts: SystemInstructionPart[];
}

export interface SystemInstructionPart {
  text: string;
}

export interface AddLogPayload {
  payload: any;
  type: "incoming" | "outgoing" | "message";
}

export interface ClientContent {
  turns: ClientTurn[];
  turnComplete: boolean;
}

export interface ClientTurn {
  role: "user";
  parts: ClientPart[];
}

export interface ClientPart {
  text?: string;
  videoData?: Uint8Array;
  audioData?: Uint8Array;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}
