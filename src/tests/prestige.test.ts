import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, computePrestigePoints, computePrestigeMult } from '../app/store';

describe('polta sauna', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState({
      population: 0,
      totalPopulation: 0,
      tierLevel: 1,
      buildings: {},
      techCounts: {},
      multipliers: { population_cps: 1 },
      cps: 0,
      clickPower: 1,
      prestigePoints: 0,
      prestigeMult: 1,
      eraMult: 1,
    });
    useGameStore.getState().recompute();
  });

  it('cannot polta sauna below minimum lämpötila', () => {
    useGameStore.setState({ totalPopulation: 9999 });
    expect(useGameStore.getState().canPrestige()).toBe(false);
  });

  it('computes points and multiplier at 100k lämpötila', () => {
    expect(computePrestigePoints(100000)).toBe(1);
    expect(computePrestigeMult(1)).toBeCloseTo(1.1);
  });

  it('polta sauna resets progress and keeps lifetime stats', () => {
    useGameStore.setState({
      population: 500,
      totalPopulation: 100000,
      buildings: { sauna: 2 },
      techCounts: { vihta: 1 },
      tierLevel: 2,
      multipliers: { population_cps: 1.25 },
      cps: 10,
      prestigePoints: 0,
      prestigeMult: 1,
    });
    const ok = useGameStore.getState().prestige();
    const s = useGameStore.getState();
    expect(ok).toBe(true);
    expect(s.population).toBe(0);
    expect(s.buildings.sauna).toBeUndefined();
    expect(Object.keys(s.techCounts).length).toBe(0);
    expect(s.tierLevel).toBe(1);
    expect(s.totalPopulation).toBe(100000);
    expect(s.prestigePoints).toBe(1);
    expect(s.prestigeMult).toBeCloseTo(1.1);
  });

  it('era reset wipes progress and increases era multiplier', () => {
    useGameStore.setState({
      population: 500,
      totalPopulation: 12345,
      prestigePoints: 3,
      prestigeMult: 1.3,
      eraMult: 1,
    });
    useGameStore.getState().changeEra();
    const s = useGameStore.getState();
    expect(s.population).toBe(0);
    expect(s.totalPopulation).toBe(0);
    expect(s.prestigePoints).toBe(0);
    expect(s.prestigeMult).toBe(1);
    expect(s.eraMult).toBe(11);
  });
});
