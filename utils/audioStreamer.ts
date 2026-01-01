import { floatTo16BitPCM, arrayBufferToBase64, base64ToUint8Array, pcmToAudioBuffer } from './audioUtils';

export class AudioStreamer {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private isRecording: boolean = false;
  
  // Callback for sending audio chunks to the websocket
  public onData: (base64: string) => void = () => {};
  
  // Callback for visualizer
  public onVolume: (volume: number) => void = () => {};

  constructor() {
    // We defer initialization to start() to adhere to browser autoplay policies
  }

  /**
   * Initialize audio contexts and start recording from microphone.
   */
  async start(): Promise<void> {
    if (this.isRecording) return;

    // 1. Setup Input Context (16kHz for Gemini)
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });

    // 2. Setup Output Context (24kHz for Gemini response usually)
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.inputSource = this.inputContext.createMediaStreamSource(this.mediaStream);
      
      // Buffer size 4096 is a good balance for latency vs stability
      this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        this.onVolume(rms);

        // Convert and send
        const int16Data = floatTo16BitPCM(inputData);
        const base64Str = arrayBufferToBase64(int16Data.buffer);
        this.onData(base64Str);
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputContext.destination);
      
      this.isRecording = true;
      this.nextStartTime = this.outputContext.currentTime;

    } catch (error) {
      console.error("Error starting audio streamer:", error);
      throw error;
    }
  }

  /**
   * Stop recording and close contexts.
   */
  stop(): void {
    this.isRecording = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.inputContext) {
      this.inputContext.close();
      this.inputContext = null;
    }

    if (this.outputContext) {
      this.outputContext.close();
      this.outputContext = null;
    }
  }

  /**
   * Queue a raw PCM chunk from the server for playback.
   */
  playChunk(base64Chunk: string): void {
    if (!this.outputContext) return;

    const uint8Data = base64ToUint8Array(base64Chunk);
    const audioBuffer = pcmToAudioBuffer(uint8Data, this.outputContext, 24000);
    
    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputContext.destination);

    // Schedule playback ensuring no overlaps or gaps
    // If nextStartTime is in the past, reset it to now
    if (this.nextStartTime < this.outputContext.currentTime) {
      this.nextStartTime = this.outputContext.currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }
}