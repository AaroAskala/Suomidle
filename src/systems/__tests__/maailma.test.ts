import { describe, it, expect, afterEach, vi } from 'vitest';
import Decimal from 'decimal.js';
import {
  canPoltaMaailma,
  canPurchase,
  getNextCost,
  getTuhkaAwardPreview,
  poltaMaailmaConfirm,
  purchase,
} from '../maailma';
import type { GameState, MaailmaState } from '../../state/schema';
import { setTelemetryClient } from '../../telemetry';

type GameStateOverrides = Partial<Omit<GameState, 'maailma' | 'multipliers'>> & {
  multipliers?: Partial<GameState['multipliers']>;
  maailma?: Partial<MaailmaState>;
};

const createGameState = (overrides: GameStateOverrides = {}): GameState => {
  const baseMaailma: MaailmaState = {
    tuhka: '0',
    totalTuhkaEarned: '0',
    purchases: {},
    totalResets: 0,
  };

  const baseState: GameState = {
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
    lastSave: 0,
    lastMajorVersion: 0,
    eraPromptAcknowledged: true,
    maailma: baseMaailma,
  };

  const { maailma: maailmaOverrides, multipliers: multiplierOverrides, ...rest } = overrides;

  const mergedMaailma: MaailmaState = {
    ...baseMaailma,
    ...(maailmaOverrides ?? {}),
    purchases: {
      ...baseMaailma.purchases,
      ...(maailmaOverrides?.purchases ?? {}),
    },
  };

  return {
    ...baseState,
    ...rest,
    multipliers: {
      ...baseState.multipliers,
      ...(multiplierOverrides ?? {}),
    },
    maailma: mergedMaailma,
  };
};

afterEach(() => {
  setTelemetryClient(null);
});

describe('maailma system', () => {
  it('uses logarithmic prestige scaling and tier bonuses for tuhka awards', () => {
    const state = createGameState({
      tierLevel: 13,
      prestigeMult: Number(1.2e24),
    });

    const preview = getTuhkaAwardPreview(state);

    expect(preview.toNumber()).toBe(27);
    expect(canPoltaMaailma(state)).toBe(true);
  });

  it('returns zero tuhka when the prestige multiplier is at the baseline', () => {
    const state = createGameState();

    const preview = getTuhkaAwardPreview(state);

    expect(preview.toNumber()).toBe(0);
    expect(canPoltaMaailma(state)).toBe(false);
  });

  it('resets progress while preserving maailma state', () => {
    const state = createGameState({
      population: 987654,
      totalPopulation: 543210,
      tierLevel: 13,
      buildings: { sauna: 2, kylakauppa: 1 },
      techCounts: { vihta: 3 },
      multipliers: { population_cps: 9 },
      cps: 42,
      prestigePoints: 12,
      prestigeMult: 99,
      eraMult: 7,
      maailma: {
        tuhka: '100',
        totalTuhkaEarned: '150',
        purchases: {
          tuhkan_viisaus: { id: 'tuhkan_viisaus', level: 3 },
        },
      },
    });

    const award = getTuhkaAwardPreview(state).toNumber();
    expect(award).toBeGreaterThan(0);

    const result = poltaMaailmaConfirm(state);

    expect(result.population).toBe(0);
    expect(result.totalPopulation).toBe(0);
    expect(result.buildings).toEqual({});
    expect(result.techCounts).toEqual({});
    expect(result.tierLevel).toBe(1);
    expect(result.cps).toBe(0);
    const expectedTechMultiplier = 1 + 0.5 * 3;
    expect(result.multipliers.population_cps).toBeCloseTo(expectedTechMultiplier, 10);
    expect(result.prestigePoints).toBe(0);
    expect(result.prestigeMult).toBe(1);
    expect(result.eraMult).toBe(1);

    const expectedTuhka = new Decimal('100').add(award).floor().toFixed();
    const expectedTotal = new Decimal('150').add(award).floor().toFixed();
    expect(result.maailma.tuhka).toBe(expectedTuhka);
    expect(result.maailma.totalTuhkaEarned).toBe(expectedTotal);
    expect(result.maailma.purchases).toEqual(state.maailma.purchases);
    expect(result.maailma.purchases).not.toBe(state.maailma.purchases);

    expect(state.population).toBe(987654);
    expect(state.maailma.tuhka).toBe('100');
  });

  it('enforces purchase constraints and floors remaining tuhka', () => {
    const itemId = 'tuhkan_viisaus';

    const poor: MaailmaState = {
      tuhka: '4',
      totalTuhkaEarned: '0',
      purchases: {},
    };

    expect(getNextCost(poor, itemId)?.toNumber()).toBe(5);
    expect(canPurchase(poor, itemId)).toBe(false);

    const rich: MaailmaState = {
      ...poor,
      tuhka: '50.75',
    };

    expect(canPurchase(rich, itemId)).toBe(true);

    const afterFirst = purchase(rich, itemId);
    expect(afterFirst).not.toBe(rich);
    expect(afterFirst.tuhka).toBe('45');
    expect(afterFirst.purchases[itemId]).toEqual({ id: itemId, level: 1 });
    expect(getNextCost(afterFirst, itemId)?.toNumber()).toBe(8);

    const maxed: MaailmaState = {
      tuhka: '100',
      totalTuhkaEarned: '100',
      purchases: {
        feeniks_sauna: { id: 'feeniks_sauna', level: 1 },
      },
    };

    expect(getNextCost(maxed, 'feeniks_sauna')).toBeNull();
    expect(canPurchase(maxed, 'feeniks_sauna')).toBe(false);
    expect(purchase(maxed, 'feeniks_sauna')).toEqual(maxed);
  });

  it('applies additive and multiplicative permanent bonuses together', () => {
    const purchases = {
      tuhkan_viisaus: { id: 'tuhkan_viisaus', level: 2 },
      ikuiset_hiillokset: { id: 'ikuiset_hiillokset', level: 3 },
      tuhkan_riimu: { id: 'tuhkan_riimu', level: 1 },
    } satisfies MaailmaState['purchases'];

    const state = createGameState({
      tierLevel: 10,
      prestigeMult: 1e6,
      maailma: {
        tuhka: '10',
        totalTuhkaEarned: '30',
        purchases,
      },
    });

    const award = getTuhkaAwardPreview(state).toNumber();
    expect(award).toBe(7);

    const result = poltaMaailmaConfirm(state);

    const spentTuhka = Number(state.maailma.totalTuhkaEarned) - Number(state.maailma.tuhka);
    const expectedMultiplier = (1 + 0.5 * 2) * 1.5 ** 3 * (1 + spentTuhka * 0.1);
    expect(result.multipliers.population_cps).toBeCloseTo(expectedMultiplier, 6);
    expect(result.prestigeMult).toBe(1);
    expect(result.maailma.tuhka).toBe(new Decimal('10').add(award).floor().toFixed());
    expect(result.maailma.totalTuhkaEarned).toBe(new Decimal('30').add(award).floor().toFixed());
    expect(result.maailma.purchases).toEqual(state.maailma.purchases);
    expect(result.maailma.purchases).not.toBe(state.maailma.purchases);
  });

  it('reapplies bonuses after saving and loading state', () => {
    const basePurchases = {
      tuhkan_viisaus: { id: 'tuhkan_viisaus', level: 3 },
      ikuiset_hiillokset: { id: 'ikuiset_hiillokset', level: 2 },
      tuhkan_riimu: { id: 'tuhkan_riimu', level: 4 },
      feeniks_sauna: { id: 'feeniks_sauna', level: 1 },
    } satisfies MaailmaState['purchases'];

    const initialState = createGameState({
      tierLevel: 25,
      prestigeMult: 1e12,
      maailma: {
        tuhka: '20',
        totalTuhkaEarned: '120',
        purchases: basePurchases,
      },
    });

    const firstAward = getTuhkaAwardPreview(initialState);
    expect(firstAward.toNumber()).toBeGreaterThan(0);

    const afterFirstReset = poltaMaailmaConfirm(initialState);

    const serialized = JSON.stringify(afterFirstReset);
    const rehydrated = JSON.parse(serialized) as GameState;
    rehydrated.tierLevel = 30;
    rehydrated.prestigeMult = 1e14;
    rehydrated.multipliers.population_cps = 1;

    const secondAward = getTuhkaAwardPreview(rehydrated);
    expect(secondAward.toNumber()).toBeGreaterThan(0);

    const afterSecondReset = poltaMaailmaConfirm(rehydrated);

    expect(afterSecondReset.multipliers.population_cps).toBeCloseTo(
      afterFirstReset.multipliers.population_cps,
      10,
    );
    expect(afterSecondReset.prestigeMult).toBe(afterFirstReset.prestigeMult);

    const expectedTuhka = new Decimal(afterFirstReset.maailma.tuhka)
      .add(secondAward)
      .floor()
      .toFixed();
    const expectedTotal = new Decimal(afterFirstReset.maailma.totalTuhkaEarned)
      .add(secondAward)
      .floor()
      .toFixed();
    expect(afterSecondReset.maailma.tuhka).toBe(expectedTuhka);
    expect(afterSecondReset.maailma.totalTuhkaEarned).toBe(expectedTotal);
    expect(afterSecondReset.maailma.purchases).toEqual(afterFirstReset.maailma.purchases);
    expect(afterSecondReset.maailma.purchases).not.toBe(afterFirstReset.maailma.purchases);
  });

  it('emits telemetry when burning the world', () => {
    const emit = vi.fn();
    setTelemetryClient({ emit });

    const purchases = {
      tuhkan_viisaus: { id: 'tuhkan_viisaus', level: 2 },
      ikuiset_hiillokset: { id: 'ikuiset_hiillokset', level: 1 },
    } satisfies MaailmaState['purchases'];

    const state = createGameState({
      tierLevel: 9,
      prestigeMult: 3,
      maailma: {
        tuhka: '15',
        totalTuhkaEarned: '25',
        totalResets: 2,
        purchases,
      },
    });

    const award = getTuhkaAwardPreview(state);
    expect(award.gt(0)).toBe(true);

    const result = poltaMaailmaConfirm(state);

    expect(result.maailma.totalResets).toBe(3);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      'polta_maailma',
      expect.objectContaining({
        highestTier: 9,
        saunaMultiplier: result.prestigeMult,
        tuhkaAward: award.toFixed(),
        purchases: {
          tuhkan_viisaus: 2,
          ikuiset_hiillokset: 1,
        },
        totalResets: 3,
      }),
    );
  });

  it('emits telemetry when purchasing maailma upgrades', () => {
    const emit = vi.fn();
    setTelemetryClient({ emit });

    const initial: MaailmaState = {
      tuhka: '50',
      totalTuhkaEarned: '0',
      purchases: {},
      totalResets: 0,
    };

    const result = purchase(initial, 'tuhkan_viisaus');

    expect(result.tuhka).toBe('45');
    expect(result.purchases.tuhkan_viisaus?.level).toBe(1);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      'maailma_purchase',
      expect.objectContaining({
        itemId: 'tuhkan_viisaus',
        level: 1,
        cost: '5',
        remainingTuhka: '45',
      }),
    );
  });
});
