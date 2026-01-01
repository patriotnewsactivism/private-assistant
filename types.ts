export interface LogMessage {
  id: string;
  timestamp: Date;
  sender: 'user' | 'system' | 'ai';
  text: string;
  type: 'info' | 'error' | 'transcription';
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface AudioVisualizerState {
  volume: number; // 0.0 to 1.0
  isActive: boolean;
}

export interface Keyword {
  id: string;
  text: string;
  sensitivity: number;
  trained: boolean;
}

export interface InterimState {
  user: string;
  model: string;
}