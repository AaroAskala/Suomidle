const cache: Record<string, Promise<HTMLAudioElement>> = {};
const sfxImports = import.meta.glob('/assets/sfx/*.mp3');
import { useGameStore } from '../app/store';

export const playSfx = async (
  name: string,
): Promise<HTMLAudioElement | null> => {
  const { soundEnabled, volume } = useGameStore.getState();
  if (!soundEnabled || volume === 0) return null;

  let promise = cache[name];
  if (!promise) {
    const importer = sfxImports[`/assets/sfx/${name}.mp3`];
    if (!importer) {
      return Promise.reject(new Error(`Unknown sfx: ${name}`));
    }
    promise = importer().then((mod) => {
      const { default: url } = mod as { default: string };
      return new Audio(url);
    });
    cache[name] = promise;
  }
  const audio = await promise;
  audio.currentTime = 0;
  audio.volume = volume;
  // Attempt to play; ignore errors (e.g. autoplay restrictions)
  audio.play().catch(() => {});
  return audio;
};
