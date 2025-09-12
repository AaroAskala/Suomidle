import { useGameStore } from '../app/store';

class MusicController {
  private currentTier: number | null = null;
  public audio: HTMLAudioElement | null = null;
  private cache = new Map<number, Promise<HTMLAudioElement>>();

  private loadTrack(tier: number): Promise<HTMLAudioElement> {
    let track = this.cache.get(tier);
    if (!track) {
      track = import(
        /* @vite-ignore */ `${import.meta.env.BASE_URL}assets/music/tier${tier}.mp3`
      ).then((mod) => {
        const { default: src } = mod as { default: string };
        const audio = new Audio(src);
        audio.loop = true;
        return audio;
      });
      this.cache.set(tier, track);
    }
    return track;
  }

  async playForTier(tier: number) {
    if (this.currentTier !== tier) {
      this.currentTier = tier;
      if (this.audio) this.audio.pause();
      this.audio = await this.loadTrack(tier);
      this.audio.currentTime = 0;
    }
    this.applySettings();
  }

  applySettings() {
    if (!this.audio) return;
    const { soundEnabled, volume } = useGameStore.getState();
    this.audio.volume = volume;
    if (!soundEnabled || volume === 0) this.audio.pause();
    else this.audio.play().catch(() => {});
  }
}

const controller = new MusicController();

export const playTierMusic = (tier: number) => controller.playForTier(tier);
export const updateMusicSettings = () => controller.applySettings();
