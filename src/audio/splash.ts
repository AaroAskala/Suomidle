import { useSettingsStore } from '../app/settingsStore';

const SPLASH_SAMPLE_RATE = 44100;
const SPLASH_DURATION_SECONDS = 0.45;
const SPLASH_HEADER_SIZE = 44;

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Encode binary data without relying on platform-specific helpers so the
// output stays consistent during server-side rendering and tests.
function encodeBase64(bytes: Uint8Array): string {
  let output = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];
    output += base64Alphabet[byte1 >> 2];
    output += base64Alphabet[((byte1 & 0x03) << 4) | (byte2 >> 4)];
    output += base64Alphabet[((byte2 & 0x0f) << 2) | (byte3 >> 6)];
    output += base64Alphabet[byte3 & 0x3f];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const byte1 = bytes[i];
    output += base64Alphabet[byte1 >> 2];
    output += base64Alphabet[(byte1 & 0x03) << 4];
    output += '==';
  } else if (remaining === 2) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    output += base64Alphabet[byte1 >> 2];
    output += base64Alphabet[((byte1 & 0x03) << 4) | (byte2 >> 4)];
    output += base64Alphabet[(byte2 & 0x0f) << 2];
    output += '=';
  }
  return output;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

// Build a tiny, decaying splash waveform procedurally so we do not need to
// ship an additional binary asset for the löyly sound effect.
function createSplashDataUri(): string {
  const sampleCount = Math.floor(SPLASH_SAMPLE_RATE * SPLASH_DURATION_SECONDS);
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(SPLASH_HEADER_SIZE + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, SPLASH_HEADER_SIZE - 8 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SPLASH_SAMPLE_RATE, true);
  view.setUint32(28, SPLASH_SAMPLE_RATE * 2, true); // sampleRate * numChannels * bytesPerSample
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / SPLASH_SAMPLE_RATE;
    const envelope = Math.pow(1 - time / SPLASH_DURATION_SECONDS, 3);
    const ripple = Math.sin(2 * Math.PI * 180 * time);
    const drop = Math.sin(2 * Math.PI * (520 + 60 * Math.sin(2 * Math.PI * time * 3)) * time);
    const noise = (Math.random() * 2 - 1) * 0.55;
    const value = (drop * 0.35 + ripple * 0.25 + noise * 0.4) * envelope;
    const clamped = Math.max(-1, Math.min(1, value));
    view.setInt16(SPLASH_HEADER_SIZE + i * 2, Math.round(clamped * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  const base64 = encodeBase64(bytes);
  return `data:audio/wav;base64,${base64}`;
}

let cachedAudioPromise: Promise<HTMLAudioElement | null> | undefined;

async function ensureSplashAudio(): Promise<HTMLAudioElement | null> {
  if (typeof Audio === 'undefined') {
    return null;
  }
  if (!cachedAudioPromise) {
    cachedAudioPromise = Promise.resolve().then(() => {
      const uri = createSplashDataUri();
      const audio = new Audio(uri);
      audio.preload = 'auto';
      return audio;
    });
  }
  return cachedAudioPromise;
}

export async function playSplashSound(): Promise<HTMLAudioElement | null> {
  const audio = await ensureSplashAudio();
  if (!audio) {
    return null;
  }
  audio.currentTime = 0;
  // Reuse the shared audio queue so volume and mute settings are respected.
  useSettingsStore.getState().enqueueAudio(audio);
  return audio;
}
