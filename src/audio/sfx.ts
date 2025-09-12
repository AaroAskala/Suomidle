const cache: Record<string, Promise<HTMLAudioElement>> = {};
const sfxImports = import.meta.glob('/assets/sfx/*.mp3');
import { useSettingsStore } from '../app/settingsStore';

export const playSfx = async (name: string): Promise<HTMLAudioElement> => {
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
  useSettingsStore.getState().enqueueAudio(audio);
  return audio;
};
