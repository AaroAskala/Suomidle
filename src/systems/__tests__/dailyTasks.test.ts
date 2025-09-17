import { describe, it, expect } from 'vitest';
import {
  createInitialDailyTasksState,
  ensureDailyTasksForToday,
  getDailyTaskDefinition,
  updateDailyTaskMetrics,
  handleDailyTaskEvent,
  claimDailyTaskReward as claimDailyTaskRewardEffect,
  type DailyTasksState,
  type DailyTaskPlayerContext,
} from '../dailyTasks';

const mockContext = (overrides?: Partial<DailyTaskPlayerContext>): DailyTaskPlayerContext => ({
  tierLevel: 1,
  population: 0,
  totalPopulation: 0,
  prestigeMult: 1,
  prestigeUnlocked: false,
  ...overrides,
});

describe('dailyTasks selection', () => {
  it('filters tasks by tier and feature availability', () => {
    const now = Date.UTC(2024, 0, 1);
    const initial = createInitialDailyTasksState();
    const context = mockContext();
    const state = ensureDailyTasksForToday(initial, context, now, () => () => 0);
    expect(state.taskOrder.length).toBeGreaterThan(0);
    for (const id of state.taskOrder) {
      const definition = getDailyTaskDefinition(id);
      expect(definition).toBeDefined();
      if (!definition) continue;
      expect(definition.min_tier).toBeLessThanOrEqual(context.tierLevel - 1);
      expect(definition.requires_feature).not.toBe('prestige');
    }
  });

  it('respects category cap when rolling tasks', () => {
    const now = Date.UTC(2024, 0, 2);
    const context = mockContext({ tierLevel: 5, prestigeUnlocked: true });
    const state = ensureDailyTasksForToday(createInitialDailyTasksState(), context, now, () => () => 0.1);
    const categories = state.taskOrder
      .map((id) => getDailyTaskDefinition(id)?.category)
      .filter((value): value is string => typeof value === 'string');
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });
});

describe('dailyTasks progression', () => {
  it('completes streak tasks when conditions are met', () => {
    const now = Date.now();
    const state: DailyTasksState = {
      ...createInitialDailyTasksState(),
      rolledDate: '2024-01-01',
      nextResetAt: now + 86_400_000,
      taskOrder: ['combo_streak_60s'],
      tasks: {
        combo_streak_60s: {
          id: 'combo_streak_60s',
          rolledAt: '2024-01-01',
          progress: 0,
          completedAt: null,
          claimedAt: null,
          conditionState: { type: 'streak', events: [] },
        },
      },
      metrics: {
        baselines: { temperature: 0, population_earned_today: 0, prestige_multiplier: 1 },
        current: { temperature: 0, population_earned_today: 0, prestige_multiplier: 1 },
        uptimeSeconds: 0,
        lastUptimeUpdate: null,
      },
      activeBuffs: [],
      rerollsUsed: 0,
    };
    const context = mockContext({ tierLevel: 3, prestigeUnlocked: true });
    let nextState = updateDailyTaskMetrics(state, context, now);
    for (let i = 0; i <= 60; i += 1) {
      nextState = handleDailyTaskEvent(nextState, { type: 'loyly_throw' }, context, now + i * 1000);
    }
    const task = nextState.tasks['combo_streak_60s'];
    expect(task.completedAt).not.toBeNull();
    expect(task.progress).toBeGreaterThanOrEqual(60);
  });

  it('only claims reward once', () => {
    const now = Date.now();
    const state: DailyTasksState = {
      ...createInitialDailyTasksState(),
      rolledDate: '2024-01-01',
      nextResetAt: now + 86_400_000,
      taskOrder: ['loyly_100'],
      tasks: {
        loyly_100: {
          id: 'loyly_100',
          rolledAt: '2024-01-01',
          progress: 100,
          completedAt: now - 1000,
          claimedAt: null,
          conditionState: { type: 'counter', count: 100 },
        },
      },
      metrics: {
        baselines: { temperature: 0, population_earned_today: 0, prestige_multiplier: 1 },
        current: { temperature: 0, population_earned_today: 0, prestige_multiplier: 1 },
        uptimeSeconds: 0,
        lastUptimeUpdate: null,
      },
      activeBuffs: [],
      rerollsUsed: 0,
    };
    const context = mockContext({ tierLevel: 2 });
    const prepared = updateDailyTaskMetrics(state, context, now);
    const first = claimDailyTaskRewardEffect(prepared, 'loyly_100', now);
    expect(first.buff).not.toBeNull();
    expect(first.state.tasks['loyly_100'].claimedAt).not.toBeNull();
    const second = claimDailyTaskRewardEffect(first.state, 'loyly_100', now + 1000);
    expect(second.buff).toBeNull();
    expect(second.state.tasks['loyly_100'].claimedAt).toEqual(
      first.state.tasks['loyly_100'].claimedAt,
    );
  });
});
