import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../app/store';
import { applyPermanentBonuses } from '../effects/applyPermanentBonuses';

const resetStoreState = () => {
  useGameStore.persist.clearStorage();
  useGameStore.setState((state) => {
    const baseMaailma = {
      ...state.maailma,
      tuhka: '0',
      totalTuhkaEarned: '0',
      purchases: [],
      totalResets: 0,
    };
    const permanent = applyPermanentBonuses({ maailma: baseMaailma } as Parameters<
      typeof applyPermanentBonuses
    >[0]);
    return {
      ...state,
      population: 0,
      totalPopulation: 0,
      tierLevel: 1,
      buildings: {},
      techCounts: {},
      multipliers: { population_cps: 1 },
      modifiers: { permanent },
      cps: 0,
      clickPower: 1,
      prestigePoints: 0,
      prestigeMult: Math.max(1, permanent.saunaPrestigeBaseMultiplierMin),
      eraMult: 1,
      lampotilaRate: Math.max(0, permanent.lampotilaRateMult),
      maailma: baseMaailma,
    };
  });
  useGameStore.getState().recompute();
};

describe('Maailma upgrades via store actions', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('updates cps and permanent modifiers immediately after purchases', () => {
    useGameStore.setState((state) => ({
      ...state,
      tierLevel: 10,
      buildings: { sauna: 10 },
      maailma: { ...state.maailma, tuhka: '500' },
    }));
    useGameStore.getState().recompute();

    expect(useGameStore.getState().purchaseMaailmaUpgrade('ikuiset_hiillokset')).toBe(true);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('tuhkan_viisaus')).toBe(true);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('tuhkan_riimu')).toBe(true);

    const state = useGameStore.getState();
    expect(state.maailma.tuhka).toBe('475');
    expect(state.modifiers.permanent.baseProdMult).toBeCloseTo(1.2, 6);
    expect(state.modifiers.permanent.techMultiplierBonusAdd).toBeCloseTo(0.1, 6);
    expect(state.modifiers.permanent.globalCpsAddFromTuhkaSpent).toBeCloseTo(0.0125, 6);
    expect(state.modifiers.permanent.totalTuhkaSpent).toBe(25);
    expect(state.cps).toBeCloseTo(13.365, 3);
    expect(state.clickPower).toBe(1);
  });

  it('allows early tier unlocks to bypass building requirements', () => {
    useGameStore.setState((state) => ({
      ...state,
      population: 100000,
      tierLevel: 1,
      buildings: {},
      maailma: { ...state.maailma, tuhka: '100' },
    }));
    useGameStore.getState().recompute();

    useGameStore.getState().purchaseBuilding('ensiapu');
    const intermediate = useGameStore.getState();
    expect(intermediate.buildings.ensiapu).toBeUndefined();
    expect(intermediate.population).toBeCloseTo(100000, 6);

    expect(useGameStore.getState().purchaseMaailmaUpgrade('maailmankivi')).toBe(true);
    useGameStore.getState().purchaseBuilding('ensiapu');
    const after = useGameStore.getState();
    expect(after.buildings.ensiapu).toBe(1);
    expect(after.population).toBeCloseTo(90000, 6);
  });

  it('scales offline gains with the permanent multiplier', () => {
    useGameStore.setState((state) => ({
      ...state,
      buildings: { sauna: 4 },
      maailma: { ...state.maailma, tuhka: '100' },
    }));
    useGameStore.getState().recompute();

    expect(useGameStore.getState().purchaseMaailmaUpgrade('kosminen_karsivallisyys')).toBe(true);
    const beforeTick = useGameStore.getState();
    expect(beforeTick.modifiers.permanent.offlineProdMult).toBeCloseTo(1.5, 6);

    useGameStore.setState({ population: 0, totalPopulation: 0 });
    useGameStore.getState().recompute();
    const cps = useGameStore.getState().cps;
    expect(cps).toBeGreaterThan(0);

    useGameStore.getState().tick(10, { offline: true });
    const afterTick = useGameStore.getState();
    expect(afterTick.population).toBeCloseTo(cps * 10 * 1.5, 6);
    expect(afterTick.totalPopulation).toBeCloseTo(cps * 10 * 1.5, 6);
  });

  it('honours the prestige base minimum from permanent bonuses', () => {
    useGameStore.setState((state) => ({
      ...state,
      totalPopulation: 100000,
      maailma: { ...state.maailma, tuhka: '200' },
    }));
    useGameStore.getState().recompute();

    expect(useGameStore.getState().purchaseMaailmaUpgrade('feeniks_sauna')).toBe(true);
    const canPrestige = useGameStore.getState().canPrestige();
    expect(canPrestige).toBe(true);

    const ok = useGameStore.getState().prestige();
    expect(ok).toBe(true);
    expect(useGameStore.getState().prestigeMult).toBeCloseTo(2, 6);
  });

  it('updates lämpötila rate multiplier immediately after purchase', () => {
    useGameStore.setState((state) => ({
      ...state,
      maailma: { ...state.maailma, tuhka: '200' },
    }));
    useGameStore.getState().recompute();

    expect(useGameStore.getState().lampotilaRate).toBeCloseTo(1, 6);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('alkulampo')).toBe(true);
    expect(useGameStore.getState().lampotilaRate).toBeCloseTo(1.05, 6);
  });
});
