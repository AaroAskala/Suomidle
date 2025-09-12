// Import all tier music tracks from the public assets directory so Vite
// bundles them and makes them available at runtime.
const trackImports = import.meta.glob('/public/assets/music/tier*.mp3');

class MusicController {
  private currentTier: number | null = null;
  private audio: HTMLAudioElement | null = null;
  private cache = new Map<number, Promise<HTMLAudioElement>>();

  private loadTrack(tier: number): Promise<HTMLAudioElement> {
    let track = this.cache.get(tier);
    if (!track) {
      // Use the same key format as the glob above when selecting the importer
      const importer = trackImports[`/public/assets/music/tier${tier}.mp3`];
      if (!importer) {
        return Promise.reject(new Error(`Unknown track for tier ${tier}`));
      }
      track = importer().then((mod) => {
        const { default: url } = mod as { default: string };
        const audio = new Audio(url);
        audio.loop = true;
        return audio;
      });
      this.cache.set(tier, track);
    }
    return track;
  }

  async playForTier(tier: number) {
    if (this.currentTier === tier) return;
    this.currentTier = tier;

    if (this.audio) {
      this.audio.pause();
    }

    this.audio = await this.loadTrack(tier);
    this.audio.currentTime = 0;
    // Attempt to play; ignore errors (e.g. autoplay restrictions)
    this.audio.play().catch(() => {});
  }
}

const controller = new MusicController();

export const playTierMusic = (tier: number) => controller.playForTier(tier);
