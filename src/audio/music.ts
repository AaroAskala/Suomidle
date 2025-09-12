class MusicController {
  private currentTier: number | null = null;
  private audio: HTMLAudioElement | null = null;

  playForTier(tier: number) {
    if (this.currentTier === tier) return;
    this.currentTier = tier;

    const src = `${import.meta.env.BASE_URL}assets/music/tier${tier}.mp3`;

    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio(src);
    this.audio.loop = true;
    // Attempt to play; ignore errors (e.g. autoplay restrictions)
    this.audio.play().catch(() => {});
  }
}

const controller = new MusicController();

export const playTierMusic = (tier: number) => controller.playForTier(tier);
