/**
 * Converts a Float32Array of audio data to an Int16Array (PCM).
 * Gemini expects raw PCM 16-bit integer data.
 */
export const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

/**
 * Encodes a Uint8Array (representing the Int16 PCM data) to a base64 string.
 * This manual implementation is safer/faster for large binary chunks than some built-ins.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Decodes a base64 string back into a Uint8Array.
 */
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Converts raw PCM Int16 bytes (from Gemini) into an AudioBuffer for playback.
 */
export const pcmToAudioBuffer = (
  pcmData: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number = 24000,
  channels: number = 1
): AudioBuffer => {
  const dataInt16 = new Int16Array(pcmData.buffer);
  const frameCount = dataInt16.length / channels;
  const buffer = audioContext.createBuffer(channels, frameCount, sampleRate);

  for (let channel = 0; channel < channels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * channels + channel] / 32768.0;
    }
  }
  return buffer;
};

/**
 * Creates a blob for sending to the API (if using Blob input instead of base64 in some contexts)
 */
export const createPcmBlob = (data: Float32Array, sampleRate: number = 16000): { data: string; mimeType: string } => {
    const int16 = floatTo16BitPCM(data);
    const base64 = arrayBufferToBase64(int16.buffer);
    return {
        data: base64,
        mimeType: `audio/pcm;rate=${sampleRate}`
    };
};