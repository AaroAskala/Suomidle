import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../content', () => {
  const dailyTasks = {
    version: 1,
    reset_timezone: 'UTC',
    daily_rotation: {
      tasks_per_day: 3,
      allow_duplicates_same_day: false,
      reroll_cost_population: 0,
      reroll_limit_per_day: 2,
      selection: {
        use_weights: true,
        min_tier: 0,
        max_active_per_category: 1,
      },
    },
    reward_templates: {
      base_reward: {
        type: 'temp_gain_mult' as const,
        value: 0.5,
        duration_s: 600,
        cooldown_s: 0,
      },
    },
    tasks: [
      {
        id: 'crafting-mastery',
        title_fi: 'Crafting Mastery',
        desc_fi: 'Complete crafting challenges.',
        category: 'craft',
        condition: { type: 'counter', event: 'click', target: 10 } as const,
        reward: 'base_reward',
        weight: 100,
        min_tier: 1,
        max_per_day: 1,
      },
      {
        id: 'combat-drill',
        title_fi: 'Combat Drill',
        desc_fi: 'Win combat rounds.',
        category: 'combat',
        condition: { type: 'counter', event: 'click', target: 5 } as const,
        reward: 'base_reward',
        weight: 60,
        min_tier: 1,
        max_per_day: 1,
      },
      {
        id: 'explore-the-world',
        title_fi: 'Explore the World',
        desc_fi: 'Discover areas.',
        category: 'explore',
        condition: { type: 'counter', event: 'click', target: 3 } as const,
        reward: 'base_reward',
        weight: 40,
        min_tier: 1,
        max_per_day: 1,
      },
      {
        id: 'combat-sparring',
        title_fi: 'Combat Sparring',
        desc_fi: 'Practice combat.',
        category: 'combat',
        condition: { type: 'counter', event: 'click', target: 7 } as const,
        reward: 'base_reward',
        weight: 50,
        min_tier: 1,
        max_per_day: 1,
      },
      {
        id: 'elite-challenge',
        title_fi: 'Elite Challenge',
        desc_fi: 'Unlocked for elite players.',
        category: 'elite',
        condition: { type: 'counter', event: 'click', target: 1 } as const,
        reward: 'base_reward',
        weight: 200,
        min_tier: 5,
        max_per_day: 1,
      },
      {
        id: 'loyly-streak',
        title_fi: 'Steam Throw Streak',
        desc_fi: 'Maintain consistent löyly throws.',
        category: 'ritual',
        condition: {
          type: 'streak',
          event: 'loyly_throw',
          window_s: 30,
          max_gap_s: 10,
        } as const,
        reward: 'base_reward',
        weight: 10,
        min_tier: 1,
        max_per_day: 1,
      },
      {
        id: 'click-rate',
        title_fi: 'Rapid Clicker',
        desc_fi: 'Click rapidly.',
        category: 'ritual',
        condition: {
          type: 'streak_rate',
          event: 'click',
          count: 3,
          max_interval_s: 5,
        } as const,
        reward: 'base_reward',
        weight: 10,
        min_tier: 1,
        max_per_day: 1,
      },
    ],
    ui_texts_fi: {},
  };
  return { dailyTasks };
});

import {
  claimTaskReward,
  createInitialDailyTaskState,
  dailyTaskConfig,
  handleGameEvent,
  rollDailyTasks,
} from '../app/dailyTasks';
import type {
  DailyTaskPlayerContext,
  DailyTaskRuntimeState,
  StreakProgressState,
  StreakRateProgressState,
} from '../app/dailyTasks';

const baseNow = Date.UTC(2024, 0, 1, 12, 0, 0);
const BASE_SEED = 0x1;

const createContext = (overrides: Partial<DailyTaskPlayerContext> = {}): DailyTaskPlayerContext => ({
  now: baseNow,
  tierLevel: 2,
  prestigeMultiplier: 1,
  features: new Set<string>(),
  currentPopulation: 0,
  totalPopulation: 0,
  ...overrides,
});

describe('daily task selection', () => {
  let state: DailyTaskRuntimeState;
  let context: DailyTaskPlayerContext;

  beforeEach(() => {
    state = {
      ...createInitialDailyTaskState(),
      baseSeed: BASE_SEED,
      seed: 0,
      activeTaskIds: [],
      progress: {},
      completedAt: {},
      claimedAt: {},
      activeBuffs: {},
    };
    context = createContext();
  });

  it('respects weights, tier limits, and category caps when rolling tasks', () => {
    const weightedRoll = rollDailyTasks(state, context, baseNow, { force: true });

    expect(weightedRoll.activeTaskIds).toHaveLength(dailyTaskConfig.daily_rotation.tasks_per_day);
    expect(new Set(weightedRoll.activeTaskIds).size).toBe(weightedRoll.activeTaskIds.length);
    expect(weightedRoll.activeTaskIds).not.toContain('elite-challenge');

    const categories = weightedRoll.activeTaskIds.map(
      (taskId) => dailyTaskConfig.tasks.find((task) => task.id === taskId)?.category ?? 'unknown',
    );
    const categoryCounts = new Map<string, number>();
    for (const category of categories) {
      const next = (categoryCounts.get(category) ?? 0) + 1;
      categoryCounts.set(category, next);
      expect(next).toBeLessThanOrEqual(
        dailyTaskConfig.daily_rotation.selection.max_active_per_category ?? Number.POSITIVE_INFINITY,
      );
    }

    const selection = dailyTaskConfig.daily_rotation.selection;
    const originalUseWeights = selection.use_weights;
    selection.use_weights = false;
    const stateNoWeights: DailyTaskRuntimeState = {
      ...createInitialDailyTaskState(),
      baseSeed: BASE_SEED,
      seed: 0,
      activeTaskIds: [],
      progress: {},
      completedAt: {},
      claimedAt: {},
      activeBuffs: {},
    };
    const unweightedRoll = rollDailyTasks(stateNoWeights, context, baseNow, { force: true });
    selection.use_weights = originalUseWeights;

    expect(unweightedRoll.activeTaskIds).not.toEqual(weightedRoll.activeTaskIds);
  });
});

describe('streak evaluators', () => {
  let context: DailyTaskPlayerContext;

  beforeEach(() => {
    context = createContext();
  });

  it('tracks streaks with gap resets and marks completion when the window is met', () => {
    let state: DailyTaskRuntimeState = {
      ...createInitialDailyTaskState(),
      activeTaskIds: ['loyly-streak'],
      progress: {},
      completedAt: {},
      claimedAt: {},
      activeBuffs: {},
    };

    const emit = (timestampOffsetMs: number) => {
      state = handleGameEvent(state, context, 'loyly_throw', {
        amount: 1,
        timestamp: baseNow + timestampOffsetMs,
        source: 'system',
      });
    };

    emit(0);
    let progress = state.progress['loyly-streak'] as StreakProgressState;
    expect(progress.streakStartAt).toBe(baseNow);
    expect(progress.durationMs).toBe(0);
    expect(progress.reached).toBe(false);

    emit(5000);
    progress = state.progress['loyly-streak'] as StreakProgressState;
    expect(progress.durationMs).toBe(5000);
    expect(progress.reached).toBe(false);

    emit(40000);
    progress = state.progress['loyly-streak'] as StreakProgressState;
    expect(progress.streakStartAt).toBe(baseNow + 40000);
    expect(progress.durationMs).toBe(0);

    for (const offset of [46000, 52000, 58000, 64000, 70000]) {
      emit(offset);
    }
    progress = state.progress['loyly-streak'] as StreakProgressState;
    expect(progress.reached).toBe(true);
    expect(progress.durationMs).toBeGreaterThanOrEqual(30000);
    expect(state.completedAt['loyly-streak']).toBe(baseNow + 70000);
  });

  it('counts events within the allowed interval and resets when gaps exceed it', () => {
    let state: DailyTaskRuntimeState = {
      ...createInitialDailyTaskState(),
      activeTaskIds: ['click-rate'],
      progress: {},
      completedAt: {},
      claimedAt: {},
      activeBuffs: {},
    };

    const emit = (timestampOffsetMs: number) => {
      state = handleGameEvent(state, context, 'click', {
        amount: 1,
        timestamp: baseNow + timestampOffsetMs,
        source: 'click',
      });
    };

    emit(0);
    let progress = state.progress['click-rate'] as StreakRateProgressState;
    expect(progress.count).toBe(1);
    expect(progress.reached).toBe(false);

    emit(2000);
    progress = state.progress['click-rate'] as StreakRateProgressState;
    expect(progress.count).toBe(2);
    expect(progress.reached).toBe(false);

    emit(9000);
    progress = state.progress['click-rate'] as StreakRateProgressState;
    expect(progress.count).toBe(1);

    emit(13000);
    progress = state.progress['click-rate'] as StreakRateProgressState;
    expect(progress.count).toBe(2);

    emit(17000);
    progress = state.progress['click-rate'] as StreakRateProgressState;
    expect(progress.count).toBe(3);
    expect(progress.reached).toBe(true);
    expect(state.completedAt['click-rate']).toBe(baseNow + 17000);
  });
});

describe('reward claiming', () => {
  let state: DailyTaskRuntimeState;

  beforeEach(() => {
    state = {
      ...createInitialDailyTaskState(),
      activeTaskIds: ['crafting-mastery'],
      progress: {},
      completedAt: { 'crafting-mastery': baseNow },
      claimedAt: {},
      activeBuffs: {},
      buffMultiplier: 1,
    };
  });

  it('is idempotent and does not duplicate rewards on repeated claims', () => {
    const firstClaim = claimTaskReward(state, 'crafting-mastery', baseNow);
    expect(firstClaim.success).toBe(true);
    expect(firstClaim.buff).toBeDefined();
    expect(firstClaim.state.claimedAt['crafting-mastery']).toBe(baseNow);
    expect(firstClaim.state.buffMultiplier).toBeCloseTo(1.5);

    const secondClaim = claimTaskReward(firstClaim.state, 'crafting-mastery', baseNow + 1000);
    expect(secondClaim.success).toBe(false);
    expect(secondClaim.buff).toBeUndefined();
    expect(secondClaim.state).toBe(firstClaim.state);
    expect(secondClaim.state.activeBuffs['crafting-mastery']).toBeDefined();
    expect(secondClaim.state.claimedAt['crafting-mastery']).toBe(baseNow);
  });
});
