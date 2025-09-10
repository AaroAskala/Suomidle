import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, computePrestigePoints, computePrestigeMult } from '../app/store';

describe('prestige', () => {
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
    });
    useGameStore.getState().recompute();
  });

  it('cannot prestige below minimum population', () => {
    useGameStore.setState({ totalPopulation: 9999 });
    expect(useGameStore.getState().canPrestige()).toBe(false);
  });

  it('computes points and multiplier at 100k population', () => {
    expect(computePrestigePoints(100000)).toBe(1);
    expect(computePrestigeMult(1)).toBeCloseTo(1.1);
  });

  it('prestige resets progress and keeps lifetime stats', () => {
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
});
