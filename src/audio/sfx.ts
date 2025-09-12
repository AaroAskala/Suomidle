import { useGameStore } from '../app/store';

const cache: Record<string, Promise<HTMLAudioElement>> = {};

export const playSfx = async (name: string) => {
  const { soundEnabled, volume } = useGameStore.getState();
  if (!soundEnabled || volume === 0) return;
  let promise = cache[name];
  if (!promise) {
    promise = import(
      /* @vite-ignore */ `${import.meta.env.BASE_URL}assets/sfx/${name}.mp3`
    ).then((mod) => {
      const { default: src } = mod as { default: string };
      return new Audio(src);
    });
    cache[name] = promise;
  }
  const audio = await promise;
  audio.currentTime = 0;
  audio.volume = volume;
  // Attempt to play; ignore errors (e.g. autoplay restrictions)
  audio.play().catch(() => {});
};
