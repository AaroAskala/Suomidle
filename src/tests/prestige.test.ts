import { describe, it, expect, beforeEach } from 'vitest';
import {
  useGameStore,
  computePrestigePoints,
  computePrestigeMult,
  poltaMaailmaConfirm,
} from '../app/store';

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
      maailma: {
        tuhka: '0',
        purchases: [],
        totalTuhkaEarned: '0',
        totalResets: 0,
        era: 0,
      },
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
    expect(s.eraMult).toBe(2);
  });

  it('era multiplier stacks additively', () => {
    useGameStore.getState().changeEra();
    useGameStore.getState().changeEra();
    const s = useGameStore.getState();
    expect(s.eraMult).toBe(3);
  });

  it('polta maailma keeps era multiplier but clears progress', () => {
    useGameStore.setState({
      population: 12345,
      totalPopulation: 987654,
      tierLevel: 5,
      buildings: { sauna: 3 },
      techCounts: { vihta: 2 },
      multipliers: { population_cps: 2 },
      cps: 50,
      prestigePoints: 4,
      prestigeMult: 2.5,
      eraMult: 3,
      maailma: {
        tuhka: '10',
        purchases: [],
        totalTuhkaEarned: '10',
        totalResets: 0,
        era: 0,
      },
    });

    const result = poltaMaailmaConfirm();
    const s = useGameStore.getState();

    expect(result.awarded > 0n).toBe(true);
    expect(s.population).toBe(0);
    expect(s.totalPopulation).toBe(0);
    expect(s.tierLevel).toBe(1);
    expect(s.buildings.sauna).toBeUndefined();
    expect(Object.keys(s.techCounts)).toHaveLength(0);
    expect(s.prestigeMult).toBe(1);
    expect(s.eraMult).toBe(3);
    expect(s.maailma.tuhka).toBe(result.availableTuhka.toString());
    expect(s.maailma.totalTuhkaEarned).toBe(result.totalTuhkaEarned.toString());
    expect(s.maailma.totalResets).toBe(1);
  });

  it('polta maailma reapplies permanent bonuses after reset', () => {
    const initialMaailma = useGameStore.getState().maailma;
    useGameStore.setState({
      prestigePoints: 9,
      prestigeMult: 3.5,
      maailma: {
        ...initialMaailma,
        tuhka: '200',
        purchases: [],
        totalTuhkaEarned: '200',
        totalResets: 0,
        era: 0,
      },
    });

    expect(useGameStore.getState().purchaseMaailmaUpgrade('feeniks_sauna')).toBe(true);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('alkulampo')).toBe(true);

    useGameStore.setState({ prestigePoints: 12, prestigeMult: 5 });

    poltaMaailmaConfirm();
    const s = useGameStore.getState();

    expect(s.prestigePoints).toBe(0);
    expect(s.prestigeMult).toBeCloseTo(2);
    expect(s.modifiers.permanent.saunaPrestigeBaseMultiplierMin).toBeCloseTo(2);
    expect(s.lampotilaRate).toBeCloseTo(1.05);
    expect(s.modifiers.permanent.lampotilaRateMult).toBeCloseTo(1.05);
    expect(s.maailma.purchases.filter((id) => id === 'feeniks_sauna')).toHaveLength(1);
    expect(s.maailma.purchases.filter((id) => id === 'alkulampo')).toHaveLength(1);
  });
});
