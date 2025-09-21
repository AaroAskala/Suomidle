import { describe, expect, it } from 'vitest';
import { generateDailyTaskBadge, generateTierBackground } from './generatedSvg';

describe('generatedSvg', () => {
  it('produces deterministic tier backgrounds for the same sauna name', () => {
    const first = generateTierBackground('Nuotio', 1);
    const second = generateTierBackground('Nuotio', 1);
    expect(second).toBe(first);
    expect(first.startsWith('data:image/svg+xml,')).toBe(true);
  });

  it('varies tier backgrounds when the sauna name changes', () => {
    const nuotio = generateTierBackground('Nuotio', 1);
    const savusauna = generateTierBackground('Savusauna', 5);
    expect(nuotio).not.toBe(savusauna);
  });

  it('produces deterministic task badges by id and category', () => {
    const first = generateDailyTaskBadge('loyly_100', 'Heitä löylyä 100 kertaa', 'actions');
    const second = generateDailyTaskBadge('loyly_100', 'Heitä löylyä 100 kertaa', 'actions');
    expect(first).toBe(second);
    expect(first.startsWith('data:image/svg+xml,')).toBe(true);
  });

  it('changes task badges across categories', () => {
    const economyBadge = generateDailyTaskBadge('buy_building_1', 'Osta 1 uusi rakennus', 'economy');
    const techBadge = generateDailyTaskBadge('buy_building_1', 'Osta 1 uusi rakennus', 'tech');
    expect(economyBadge).not.toBe(techBadge);
  });
});
