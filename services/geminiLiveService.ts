import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AudioStreamer } from '../utils/audioStreamer';
import { LogMessage, ConnectionState } from '../types';

export class GeminiLiveService {
  private client: GoogleGenAI;
  private audioStreamer: AudioStreamer;
  private session: any = null;
  
  // Buffers for accumulating transcriptions before finalizing
  private userTranscriptBuffer: string = "";
  private modelTranscriptBuffer: string = "";

  // Callbacks
  public onConnectionStateChange: (state: ConnectionState) => void = () => {};
  public onLog: (log: LogMessage) => void = () => {};
  public onInterimUser: (text: string) => void = () => {};
  public onInterimModel: (text: string) => void = () => {};

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.audioStreamer = new AudioStreamer();
    
    this.audioStreamer.onData = (base64) => this.sendAudioChunk(base64);
  }

  public setVolumeCallback(cb: (vol: number) => void) {
    this.audioStreamer.onVolume = cb;
  }

  async connect() {
    this.onConnectionStateChange(ConnectionState.CONNECTING);
    
    try {
      await this.audioStreamer.start();
      
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a highly intelligent, professional AI assistant. Your responses are concise, insightful, and maintain a calm, authoritative tone suitable for professional investigation and legal context. You are always on, always listening, and ready to analyze.",
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            this.onConnectionStateChange(ConnectionState.CONNECTED);
            this.log('Session connected. Listening...', 'system');
          },
          onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
          onclose: () => {
            this.onConnectionStateChange(ConnectionState.DISCONNECTED);
            this.log('Session closed', 'system');
            this.disconnect();
          },
          onerror: (err) => {
            console.error(err);
            this.onConnectionStateChange(ConnectionState.ERROR);
            this.log(`Error: ${err.message}`, 'error');
          }
        }
      });

      this.session = await sessionPromise;

    } catch (error: any) {
      this.onConnectionStateChange(ConnectionState.ERROR);
      this.log(`Connection failed: ${error.message}`, 'error');
      this.disconnect();
    }
  }

  private handleMessage(message: LiveServerMessage) {
    // 1. Handle Audio
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      this.audioStreamer.playChunk(audioData);
    }

    // 2. Handle Transcription (User)
    const userTranscript = message.serverContent?.inputTranscription?.text;
    if (userTranscript) {
       this.userTranscriptBuffer += userTranscript;
       this.onInterimUser(this.userTranscriptBuffer);
    }

    // 3. Handle Transcription (Model)
    const modelTranscript = message.serverContent?.outputTranscription?.text;
    if (modelTranscript) {
       this.modelTranscriptBuffer += modelTranscript;
       this.onInterimModel(this.modelTranscriptBuffer);
    }
    
    // 4. Handle Turn Complete
    // When turn completes, we commit the buffers to the main log and clear them.
    if (message.serverContent?.turnComplete) {
      if (this.userTranscriptBuffer.trim()) {
        this.log(this.userTranscriptBuffer, 'user');
        this.userTranscriptBuffer = "";
        this.onInterimUser("");
      }
      
      if (this.modelTranscriptBuffer.trim()) {
        this.log(this.modelTranscriptBuffer, 'ai');
        this.modelTranscriptBuffer = "";
        this.onInterimModel("");
      }
    }
  }

  private sendAudioChunk(base64: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }
      });
    }
  }

  disconnect() {
    this.audioStreamer.stop();
    if (this.session) {
        try {
            // this.session.close(); 
        } catch (e) { console.log("Session close not supported or failed", e); }
        this.session = null;
    }
    
    // Flush any remaining buffers on disconnect
    if (this.userTranscriptBuffer.trim()) this.log(this.userTranscriptBuffer, 'user');
    if (this.modelTranscriptBuffer.trim()) this.log(this.modelTranscriptBuffer, 'ai');
    
    this.userTranscriptBuffer = "";
    this.modelTranscriptBuffer = "";
    this.onInterimUser("");
    this.onInterimModel("");
    
    this.onConnectionStateChange(ConnectionState.DISCONNECTED);
  }

  private log(text: string, sender: 'user' | 'system' | 'ai' | 'error') {
    const type = sender === 'error' ? 'error' : sender === 'system' ? 'info' : 'transcription';
    this.onLog({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sender: sender === 'error' ? 'system' : sender,
      text,
      type
    });
  }
}