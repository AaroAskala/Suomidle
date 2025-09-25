import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore, MAAILMA_BUFF_REWARD_PREFIX, getTuhkaAwardPreview } from '../app/store';
import { applyPermanentBonuses } from '../effects/applyPermanentBonuses';
import { createInitialDailyTasksState, getTemperatureGainMultiplier } from '../systems/dailyTasks';

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
      dailyTasks: createInitialDailyTasksState(),
    };
  });
  useGameStore.getState().recompute();
};

describe('Maailma upgrades via store actions', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('shows zero tuhka award when prestige multiplier is at baseline', () => {
    useGameStore.setState((state) => ({
      ...state,
      tierLevel: 1,
      prestigeMult: 1,
      maailma: {
        ...state.maailma,
        tuhka: '0',
        totalTuhkaEarned: '0',
      },
    }));

    const preview = getTuhkaAwardPreview();

    expect(preview.award).toBe(0n);
    expect(preview.availableAfter).toBe(preview.current);
    expect(preview.totalEarnedAfter).toBe(preview.totalEarned);
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
    expect(state.modifiers.permanent.baseProdMult).toBeCloseTo(1.5, 6);
    expect(state.modifiers.permanent.techMultiplierBonusAdd).toBeCloseTo(0.5, 6);
    expect(state.modifiers.permanent.globalCpsAddFromTuhkaSpent).toBeCloseTo(2.5, 6);
    expect(state.modifiers.permanent.totalTuhkaSpent).toBe(25);
    expect(state.cps).toBeCloseTo(78.75, 2);
    expect(state.clickPower).toBe(1);
  });

  it('applies the per-building Maailma multiplier from Rakennuksen siunaus', () => {
    useGameStore.setState((state) => ({
      ...state,
      buildings: { sauna: 10 },
      multipliers: { population_cps: 1 },
      prestigeMult: 1,
      eraMult: 1,
      maailma: { ...state.maailma, tuhka: '100' },
    }));
    useGameStore.getState().recompute();

    const before = useGameStore.getState().cps;
    expect(before).toBeGreaterThan(0);

    expect(useGameStore.getState().purchaseMaailmaUpgrade('rakennuksen_siunaus')).toBe(true);

    const after = useGameStore.getState().cps;
    expect(after / before).toBeCloseTo(1.01, 6);
    expect(useGameStore.getState().modifiers.permanent.globalMultPerBuilding).toBeCloseTo(0.001, 6);
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
    expect(useGameStore.getState().prestigeMult).toBeCloseTo(10, 6);
  });

  it('updates lämpötila rate multiplier immediately after purchase', () => {
    useGameStore.setState((state) => ({
      ...state,
      maailma: { ...state.maailma, tuhka: '200' },
    }));
    useGameStore.getState().recompute();

    expect(useGameStore.getState().lampotilaRate).toBeCloseTo(1, 6);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('alkulampo')).toBe(true);
    expect(useGameStore.getState().lampotilaRate).toBeCloseTo(1.2, 6);
  });

  it('applies Löylyn voima as a persistent lämpötila multiplier buff', () => {
    useGameStore.setState((state) => ({
      ...state,
      maailma: { ...state.maailma, tuhka: '10' },
      dailyTasks: createInitialDailyTasksState(),
    }));
    useGameStore.getState().recompute();

    expect(getTemperatureGainMultiplier(useGameStore.getState().dailyTasks)).toBeCloseTo(1, 6);
    expect(useGameStore.getState().purchaseMaailmaUpgrade('loylyn_voima')).toBe(true);

    const state = useGameStore.getState();
    expect(state.maailma.tuhka).toBe('9');
    const rewardKey = `${MAAILMA_BUFF_REWARD_PREFIX}loylyn_voima`;
    const buff = state.dailyTasks.activeBuffs.find((entry) => entry.rewardId === rewardKey);
    expect(buff?.value).toBeCloseTo(4, 6);
    expect(buff?.endsAt).toBe(Number.MAX_SAFE_INTEGER);
    expect(getTemperatureGainMultiplier(state.dailyTasks)).toBeCloseTo(5, 6);
  });
});
