import { DateTime } from 'luxon';
import { dailyTasks as rawDailyTasks } from '../content';
import type { GameEventMap, GameEventType } from './events';

export interface DailyTaskRewardTemplate {
  type: 'temp_gain_mult';
  value: number;
  duration_s: number;
  cooldown_s: number;
}

export type DailyTaskCondition =
  | { type: 'counter'; event: keyof GameEventMap; target: number }
  | { type: 'threshold'; metric: 'temperature'; target: number | string }
  | { type: 'delta_threshold'; metric: 'prestige_multiplier' | 'population_earned_today'; target?: number | string; delta?: number }
  | { type: 'streak'; event: keyof GameEventMap; window_s: number; max_gap_s: number }
  | { type: 'streak_rate'; event: keyof GameEventMap; count: number; max_interval_s: number }
  | { type: 'uptime'; target_s: number };

export interface DailyTaskDefinition {
  id: string;
  title_fi: string;
  desc_fi: string;
  category: string;
  condition: DailyTaskCondition;
  reward: string;
  weight: number;
  min_tier: number;
  max_per_day: number;
  requires_feature?: string;
}

export interface DailyTaskConfig {
  version: number;
  reset_timezone: string;
  daily_rotation: {
    tasks_per_day: number;
    allow_duplicates_same_day: boolean;
    reroll_cost_population: number;
    reroll_limit_per_day: number;
    selection: {
      use_weights: boolean;
      min_tier: number;
      max_active_per_category: number;
    };
  };
  reward_templates: Record<string, DailyTaskRewardTemplate>;
  tasks: DailyTaskDefinition[];
  ui_texts_fi: Record<string, string>;
  telemetry?: {
    log_task_rolls?: boolean;
    log_claims?: boolean;
    log_buff_start_end?: boolean;
  };
}

const config = rawDailyTasks as DailyTaskConfig;
export const dailyTaskConfig = config;

const tasksById = new Map(config.tasks.map((task) => [task.id, task] as const));

const rngHash = (seed: number, value: string) => {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < value.length; i += 1) {
    h = Math.imul(h ^ value.charCodeAt(i), 0x85ebca6b);
    h = (h ^ (h >>> 13)) >>> 0;
  }
  return h >>> 0;
};

const createRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};

const parseTarget = (value: number | string | undefined) => {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const trimmed = value.trim();
  const parsed = Number(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  if (/^\d+e\d+$/i.test(trimmed)) {
    const [base, exp] = trimmed.toLowerCase().split('e');
    return Number(base) * 10 ** Number(exp);
  }
  return 0;
};

export interface CounterProgressState {
  type: 'counter';
  value: number;
  counts?: Record<string, number>;
}

export interface ThresholdProgressState {
  type: 'threshold';
  value: number;
  reached: boolean;
}

export interface DeltaThresholdProgressState {
  type: 'delta_threshold';
  value: number;
  baseline: number;
  reached: boolean;
}

export interface StreakProgressState {
  type: 'streak';
  lastEventAt: number | null;
  streakStartAt: number | null;
  durationMs: number;
  reached: boolean;
}

export interface StreakRateProgressState {
  type: 'streak_rate';
  lastEventAt: number | null;
  count: number;
  reached: boolean;
}

export interface UptimeProgressState {
  type: 'uptime';
  value: number;
  reached: boolean;
}

export type DailyTaskProgressState =
  | CounterProgressState
  | ThresholdProgressState
  | DeltaThresholdProgressState
  | StreakProgressState
  | StreakRateProgressState
  | UptimeProgressState;

export interface ActiveBuffState {
  id: string;
  sourceTaskId: string;
  rewardId: string;
  type: 'temp_gain_mult';
  value: number;
  startedAt: number;
  expiresAt: number;
}

export interface TempGainBuffSnapshot {
  id: string;
  value: number;
  endsAt: number;
}

export interface DailyTaskRuntimeState {
  baseSeed: number;
  seed: number;
  dayKey: string;
  rolledAt: number;
  rerollsUsed: number;
  activeTaskIds: string[];
  progress: Record<string, DailyTaskProgressState>;
  completedAt: Record<string, number>;
  claimedAt: Record<string, number>;
  activeBuffs: Record<string, ActiveBuffState>;
  populationEarnedToday: number;
  uptimeSeconds: number;
  baselines: {
    prestigeMultiplier: number;
  };
  buffMultiplier: number;
}

export interface DailyTaskPlayerContext {
  now: number;
  tierLevel: number;
  prestigeMultiplier: number;
  features: Set<string>;
  currentPopulation: number;
  totalPopulation: number;
}

const ensureBaseSeed = (value: number | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value >>> 0;
  return Math.floor(Math.random() * 0x100000000) >>> 0;
};

export const createInitialDailyTaskState = (): DailyTaskRuntimeState => ({
  baseSeed: ensureBaseSeed(undefined),
  seed: 0,
  dayKey: '',
  rolledAt: 0,
  rerollsUsed: 0,
  activeTaskIds: [],
  progress: {},
  completedAt: {},
  claimedAt: {},
  activeBuffs: {},
  populationEarnedToday: 0,
  uptimeSeconds: 0,
  baselines: {
    prestigeMultiplier: 1,
  },
  buffMultiplier: 1,
});

const getDayInfo = (now: number) => {
  const zoned = DateTime.fromMillis(now, { zone: config.reset_timezone });
  const start = zoned.startOf('day');
  const next = start.plus({ days: 1 });
  return {
    dayKey: start.toFormat('yyyy-LL-dd'),
    startMs: start.toMillis(),
    nextStartMs: next.toMillis(),
  };
};

const computeSeed = (baseSeed: number, dayKey: string, rerollIndex: number) =>
  rngHash(baseSeed, `${dayKey}:${rerollIndex}`);

const telemetryLog = (
  type: 'roll' | 'claim' | 'buff-start' | 'buff-end',
  message: string,
  detail?: Record<string, unknown>,
) => {
  const { telemetry } = config;
  if (!telemetry) return;
  if (type === 'roll' && !telemetry.log_task_rolls) return;
  if (type === 'claim' && !telemetry.log_claims) return;
  if ((type === 'buff-start' || type === 'buff-end') && !telemetry.log_buff_start_end) return;
  const data = detail ? ` ${JSON.stringify(detail)}` : '';
  console.info(`[DailyTasks] ${message}${data}`);
};

const filterRecords = <T>(
  source: Record<string, T>,
  predicate: (taskId: string) => boolean,
): Record<string, T> => {
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(source)) {
    if (predicate(key)) next[key] = value;
  }
  return next;
};

const computeBuffMultiplier = (buffs: Record<string, ActiveBuffState>) => {
  let mult = 1;
  for (const buff of Object.values(buffs)) {
    if (buff.type === 'temp_gain_mult') {
      mult *= 1 + buff.value;
    }
  }
  return mult;
};

const createTempGainBuffSnapshot = (buff: ActiveBuffState): TempGainBuffSnapshot => ({
  id: buff.id,
  value: 1 + buff.value,
  endsAt: buff.expiresAt,
});

export const getTempGainBuffSnapshots = (
  state: DailyTaskRuntimeState,
): TempGainBuffSnapshot[] =>
  Object.values(state.activeBuffs)
    .filter((buff) => buff.type === 'temp_gain_mult')
    .map(createTempGainBuffSnapshot)
    .sort((a, b) => {
      if (a.endsAt === b.endsAt) return a.id.localeCompare(b.id);
      return a.endsAt - b.endsAt;
    });

const withUpdatedProgress = (
  state: DailyTaskRuntimeState,
  taskId: string,
  progress: DailyTaskProgressState,
): DailyTaskRuntimeState => {
  const nextProgress = { ...state.progress, [taskId]: progress };
  return { ...state, progress: nextProgress };
};

const setCompletionIfNeeded = (
  state: DailyTaskRuntimeState,
  taskId: string,
  condition: DailyTaskCondition,
  progress: DailyTaskProgressState,
  now: number,
): DailyTaskRuntimeState => {
  const def = tasksById.get(taskId);
  if (!def) return state;
  let completed = false;
  if (condition.type === 'counter') {
    completed = progress.type === 'counter' && progress.value >= condition.target;
  } else if (condition.type === 'threshold') {
    const target = parseTarget(condition.target);
    completed = progress.type === 'threshold' && progress.value >= target;
  } else if (condition.type === 'delta_threshold') {
    const target = parseTarget(condition.target ?? condition.delta ?? 0);
    completed = progress.type === 'delta_threshold' && progress.value >= target;
  } else if (condition.type === 'streak') {
    const target = condition.window_s;
    completed =
      progress.type === 'streak' && progress.reached && progress.durationMs >= target * 1000;
  } else if (condition.type === 'streak_rate') {
    completed = progress.type === 'streak_rate' && progress.count >= condition.count;
  } else if (condition.type === 'uptime') {
    completed = progress.type === 'uptime' && progress.value >= condition.target_s;
  }
  if (!completed || state.completedAt[taskId]) return state;
  const completedAt = { ...state.completedAt, [taskId]: now };
  return { ...state, completedAt };
};

export interface RollOptions {
  force?: boolean;
  reroll?: boolean;
}

export const rollDailyTasks = (
  state: DailyTaskRuntimeState,
  context: DailyTaskPlayerContext,
  now: number,
  options: RollOptions = {},
): DailyTaskRuntimeState => {
  const { dayKey } = getDayInfo(now);
  const isNewDay = dayKey !== state.dayKey;
  const reroll = !!options.reroll;
  let next: DailyTaskRuntimeState = state;

  if (isNewDay || options.force) {
    const baseSeed = ensureBaseSeed(state.baseSeed);
    const seed = computeSeed(baseSeed, dayKey, 0);
    next = {
      ...state,
      baseSeed,
      seed,
      dayKey,
      rolledAt: now,
      rerollsUsed: 0,
      activeTaskIds: [],
      progress: {},
      completedAt: {},
      claimedAt: {},
      populationEarnedToday: 0,
      uptimeSeconds: 0,
      baselines: {
        prestigeMultiplier: context.prestigeMultiplier,
      },
    };
  }

  if (reroll && !isNewDay) {
    const nextReroll = state.rerollsUsed + 1;
    const maxReroll = config.daily_rotation.reroll_limit_per_day;
    if (nextReroll > maxReroll) return next;
    const seed = computeSeed(next.baseSeed, next.dayKey, nextReroll);
    next = {
      ...next,
      seed,
      rerollsUsed: nextReroll,
      activeTaskIds: [],
      progress: {},
      completedAt: {},
      claimedAt: {},
    };
  }

  const { tasks_per_day, allow_duplicates_same_day, selection } = config.daily_rotation;
  const rng = createRng(next.seed || computeSeed(next.baseSeed, dayKey, next.rerollsUsed));

  const available = config.tasks.filter((task) => {
    if (selection.min_tier > context.tierLevel) return false;
    if (task.min_tier > context.tierLevel) return false;
    if (task.requires_feature && !context.features.has(task.requires_feature)) return false;
    return true;
  });

  const chosen: DailyTaskDefinition[] = [];
  const categoryCounts = new Map<string, number>();
  let pool = [...available];

  while (chosen.length < tasks_per_day && pool.length > 0) {
    const totalWeight = pool.reduce((sum, task) => sum + (selection.use_weights ? task.weight : 1), 0);
    let roll = rng() * totalWeight;
    let pickedIndex = 0;
    for (let i = 0; i < pool.length; i += 1) {
      const weight = selection.use_weights ? pool[i].weight : 1;
      roll -= weight;
      if (roll <= 0) {
        pickedIndex = i;
        break;
      }
    }
    const [picked] = pool.splice(pickedIndex, 1);
    if (!picked) break;
    chosen.push(picked);
    const count = (categoryCounts.get(picked.category) ?? 0) + 1;
    categoryCounts.set(picked.category, count);
    if (!allow_duplicates_same_day) {
      pool = pool.filter((task) => task.id !== picked.id);
    }
    if (selection.max_active_per_category && count >= selection.max_active_per_category) {
      pool = pool.filter((task) => task.category !== picked.category);
    }
  }

  const activeTaskIds = chosen.map((task) => task.id);
  const nextProgress = filterRecords(next.progress, (taskId) => activeTaskIds.includes(taskId));
  const nextCompleted = filterRecords(next.completedAt, (taskId) => activeTaskIds.includes(taskId));
  const nextClaimed = filterRecords(next.claimedAt, (taskId) => activeTaskIds.includes(taskId));

  telemetryLog('roll', 'Rolled daily tasks', {
    day: dayKey,
    rerollsUsed: next.rerollsUsed,
    tasks: activeTaskIds,
  });

  const buffMultiplier = computeBuffMultiplier(next.activeBuffs);

  let result: DailyTaskRuntimeState = {
    ...next,
    seed: computeSeed(next.baseSeed, dayKey, next.rerollsUsed),
    dayKey,
    rolledAt: now,
    activeTaskIds,
    progress: nextProgress,
    completedAt: nextCompleted,
    claimedAt: nextClaimed,
    buffMultiplier,
  };

  result = updateMetricProgress(result, 'temperature', context.currentPopulation, now);
  result = updateMetricProgress(result, 'prestige_multiplier', context.prestigeMultiplier, now);
  result = updateMetricProgress(result, 'population_earned_today', result.populationEarnedToday, now);
  result = syncUptimeProgress(result, result.uptimeSeconds, now);

  return result;
};

const updateCounterProgress = (
  state: DailyTaskRuntimeState,
  task: DailyTaskDefinition,
  now: number,
  increment: number,
  key?: string,
): DailyTaskRuntimeState => {
  const prev = state.progress[task.id];
  const counts = prev?.type === 'counter' && prev.counts ? { ...prev.counts } : undefined;
  let value = prev?.type === 'counter' ? prev.value : 0;
  if (counts && key) {
    const current = counts[key] ?? 0;
    const nextCount = current + increment;
    counts[key] = nextCount;
    value = Math.max(value, nextCount);
  } else if (key) {
    const nextCounts: Record<string, number> = counts ?? {};
    const current = nextCounts[key] ?? 0;
    const nextCount = current + increment;
    nextCounts[key] = nextCount;
    value = Math.max(value, nextCount);
    const progress: CounterProgressState = {
      type: 'counter',
      value,
      counts: nextCounts,
    };
    const withProgress = withUpdatedProgress(state, task.id, progress);
    return setCompletionIfNeeded(withProgress, task.id, task.condition, progress, now);
  } else {
    value += increment;
  }

  const progress: CounterProgressState = {
    type: 'counter',
    value,
    counts,
  };
  const withProgress = withUpdatedProgress(state, task.id, progress);
  return setCompletionIfNeeded(withProgress, task.id, task.condition, progress, now);
};

export const handleGameEvent = <K extends GameEventType>(
  state: DailyTaskRuntimeState,
  context: DailyTaskPlayerContext,
  type: K,
  payload: GameEventMap[K],
): DailyTaskRuntimeState => {
  if (state.activeTaskIds.length === 0) return state;
  let next = state;
  const now = (payload as { timestamp?: number }).timestamp ?? context.now;

  for (const taskId of state.activeTaskIds) {
    const task = tasksById.get(taskId);
    if (!task) continue;
    const condition = task.condition;
    if (condition.type === 'counter' && condition.event === type) {
      if (condition.event === 'building_bought_same_type' && type === 'building_bought_same_type') {
        const key = (payload as GameEventMap['building_bought_same_type']).buildingId;
        next = updateCounterProgress(next, task, now, 1, key);
      } else {
        next = updateCounterProgress(next, task, now, 1);
      }
    } else if (condition.type === 'streak' && condition.event === type) {
      const prev = next.progress[task.id];
      const streak = prev?.type === 'streak'
        ? { ...prev }
        : ({
            type: 'streak',
            lastEventAt: null,
            streakStartAt: null,
            durationMs: 0,
            reached: false,
          } as StreakProgressState);
      const maxGap = condition.max_gap_s * 1000;
      if (streak.lastEventAt && now - streak.lastEventAt <= maxGap) {
        streak.lastEventAt = now;
        streak.durationMs = streak.streakStartAt ? now - streak.streakStartAt : 0;
      } else {
        streak.streakStartAt = now;
        streak.lastEventAt = now;
        streak.durationMs = 0;
      }
      if (streak.streakStartAt) {
        streak.durationMs = now - streak.streakStartAt;
      }
      if (streak.durationMs >= condition.window_s * 1000) {
        streak.reached = true;
      }
      const withProgress = withUpdatedProgress(next, task.id, streak);
      next = setCompletionIfNeeded(withProgress, task.id, condition, streak, now);
    } else if (condition.type === 'streak_rate' && condition.event === type) {
      const prev = next.progress[task.id];
      const streakRate = prev?.type === 'streak_rate'
        ? { ...prev }
        : ({ type: 'streak_rate', lastEventAt: null, count: 0, reached: false } as StreakRateProgressState);
      const maxInterval = condition.max_interval_s * 1000;
      if (streakRate.lastEventAt && now - streakRate.lastEventAt <= maxInterval) {
        streakRate.count += 1;
      } else {
        streakRate.count = 1;
      }
      streakRate.lastEventAt = now;
      if (streakRate.count >= condition.count) streakRate.reached = true;
      const withProgress = withUpdatedProgress(next, task.id, streakRate);
      next = setCompletionIfNeeded(withProgress, task.id, condition, streakRate, now);
    }
  }

  return next;
};

export const updateMetricProgress = (
  state: DailyTaskRuntimeState,
  metric: 'temperature' | 'prestige_multiplier' | 'population_earned_today',
  value: number,
  now: number,
): DailyTaskRuntimeState => {
  if (state.activeTaskIds.length === 0) return state;
  let next = state;
  for (const taskId of state.activeTaskIds) {
    const task = tasksById.get(taskId);
    if (!task) continue;
    const condition = task.condition;
    if (condition.type === 'threshold' && condition.metric === metric) {
      const progress: ThresholdProgressState = {
        type: 'threshold',
        value,
        reached: value >= parseTarget(condition.target),
      };
      const withProgress = withUpdatedProgress(next, taskId, progress);
      next = setCompletionIfNeeded(withProgress, taskId, condition, progress, now);
    } else if (condition.type === 'delta_threshold' && condition.metric === metric) {
      const baseline =
        metric === 'prestige_multiplier'
          ? state.baselines.prestigeMultiplier
          : 0;
      const delta = metric === 'prestige_multiplier' ? value - baseline : value;
      const progress: DeltaThresholdProgressState = {
        type: 'delta_threshold',
        value: Math.max(delta, 0),
        baseline,
        reached: Math.max(delta, 0) >= parseTarget(condition.target ?? condition.delta ?? 0),
      };
      const withProgress = withUpdatedProgress(next, taskId, progress);
      next = setCompletionIfNeeded(withProgress, taskId, condition, progress, now);
    }
  }
  return next;
};

export const addPopulationEarned = (
  state: DailyTaskRuntimeState,
  amount: number,
  now: number,
): DailyTaskRuntimeState => {
  if (amount <= 0) return state;
  const populationEarnedToday = state.populationEarnedToday + amount;
  const next = { ...state, populationEarnedToday };
  return updateMetricProgress(next, 'population_earned_today', populationEarnedToday, now);
};

export const addUptime = (
  state: DailyTaskRuntimeState,
  delta: number,
  now: number,
): DailyTaskRuntimeState => {
  if (delta <= 0) return state;
  const uptimeSeconds = state.uptimeSeconds + delta;
  let next: DailyTaskRuntimeState = { ...state, uptimeSeconds };
  for (const taskId of state.activeTaskIds) {
    const task = tasksById.get(taskId);
    if (!task) continue;
    if (task.condition.type !== 'uptime') continue;
    const prev = state.progress[taskId];
    const current = prev?.type === 'uptime' ? prev.value : uptimeSeconds - delta;
    const value = current + delta;
    const progress: UptimeProgressState = {
      type: 'uptime',
      value,
      reached: value >= task.condition.target_s,
    };
    const withProgress = withUpdatedProgress(next, taskId, progress);
    next = setCompletionIfNeeded(withProgress, taskId, task.condition, progress, now);
  }
  return next;
};

const syncUptimeProgress = (
  state: DailyTaskRuntimeState,
  value: number,
  now: number,
): DailyTaskRuntimeState => {
  if (state.activeTaskIds.length === 0) return state;
  let next = state;
  for (const taskId of state.activeTaskIds) {
    const task = tasksById.get(taskId);
    if (!task || task.condition.type !== 'uptime') continue;
    const progress: UptimeProgressState = {
      type: 'uptime',
      value,
      reached: value >= task.condition.target_s,
    };
    const withProgress = withUpdatedProgress(next, taskId, progress);
    next = setCompletionIfNeeded(withProgress, taskId, task.condition, progress, now);
  }
  return next;
};

export interface BuffExpiryResult {
  state: DailyTaskRuntimeState;
  expired: ActiveBuffState[];
}

export const expireBuffs = (
  state: DailyTaskRuntimeState,
  now: number,
): BuffExpiryResult => {
  let changed = false;
  const activeBuffs: Record<string, ActiveBuffState> = {};
  const expired: ActiveBuffState[] = [];
  for (const [id, buff] of Object.entries(state.activeBuffs)) {
    if (buff.expiresAt > now) {
      activeBuffs[id] = buff;
    } else {
      telemetryLog('buff-end', 'Buff expired', { id, reward: buff.rewardId });
      expired.push(buff);
      changed = true;
    }
  }
  if (!changed) return { state, expired };
  return {
    state: { ...state, activeBuffs, buffMultiplier: computeBuffMultiplier(activeBuffs) },
    expired,
  };
};

interface BuffActivationResult {
  activeBuffs: Record<string, ActiveBuffState>;
  buff: ActiveBuffState;
  refreshed: boolean;
}

const startOrRefreshTempGainBuff = (
  activeBuffs: Record<string, ActiveBuffState>,
  taskId: string,
  rewardId: string,
  template: DailyTaskRewardTemplate,
  now: number,
): BuffActivationResult => {
  const previous = activeBuffs[taskId];
  const buff: ActiveBuffState = {
    id: taskId,
    sourceTaskId: taskId,
    rewardId,
    type: 'temp_gain_mult',
    value: template.value,
    startedAt: now,
    expiresAt: now + template.duration_s * 1000,
  };
  const nextBuffs = { ...activeBuffs, [taskId]: buff };
  telemetryLog('buff-start', previous ? 'Buff refreshed' : 'Buff started', {
    id: buff.id,
    reward: buff.rewardId,
  });
  return { activeBuffs: nextBuffs, buff, refreshed: !!previous };
};

export interface ClaimResult {
  state: DailyTaskRuntimeState;
  buff?: ActiveBuffState;
  success: boolean;
  refreshed?: boolean;
}

export const claimTaskReward = (
  state: DailyTaskRuntimeState,
  taskId: string,
  now: number,
): ClaimResult => {
  if (!state.activeTaskIds.includes(taskId)) return { state, success: false };
  if (!state.completedAt[taskId] || state.claimedAt[taskId]) return { state, success: false };
  const def = tasksById.get(taskId);
  if (!def) return { state, success: false };
  const rewardTemplate = config.reward_templates[def.reward];
  if (!rewardTemplate) return { state, success: false };

  const claimedAt = { ...state.claimedAt, [taskId]: now };
  let activeBuffs = state.activeBuffs;
  let buff: ActiveBuffState | undefined;
  let refreshed: boolean | undefined;

  if (rewardTemplate.type === 'temp_gain_mult') {
    const activation = startOrRefreshTempGainBuff(
      activeBuffs,
      taskId,
      def.reward,
      rewardTemplate,
      now,
    );
    activeBuffs = activation.activeBuffs;
    buff = activation.buff;
    refreshed = activation.refreshed;
  }

  telemetryLog('claim', 'Reward claimed', { taskId, reward: def.reward });

  return {
    state: {
      ...state,
      claimedAt,
      activeBuffs,
      buffMultiplier: computeBuffMultiplier(activeBuffs),
    },
    buff,
    refreshed,
    success: true,
  };
};

export interface DailyTaskStatus {
  id: string;
  definition: DailyTaskDefinition;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: number;
  claimedAt?: number;
}

export const getTaskStatus = (
  state: DailyTaskRuntimeState,
  taskId: string,
): DailyTaskStatus | null => {
  const def = tasksById.get(taskId);
  if (!def) return null;
  const progressState = state.progress[taskId];
  const completedAt = state.completedAt[taskId];
  const claimedAt = state.claimedAt[taskId];
  let progressValue = 0;
  let target = 0;
  if (def.condition.type === 'counter') {
    progressValue = progressState?.type === 'counter' ? progressState.value : 0;
    target = def.condition.target;
  } else if (def.condition.type === 'threshold') {
    progressValue = progressState?.type === 'threshold' ? progressState.value : 0;
    target = parseTarget(def.condition.target);
  } else if (def.condition.type === 'delta_threshold') {
    progressValue = progressState?.type === 'delta_threshold' ? progressState.value : 0;
    target = parseTarget(def.condition.target ?? def.condition.delta ?? 0);
  } else if (def.condition.type === 'streak') {
    progressValue = progressState?.type === 'streak' ? progressState.durationMs / 1000 : 0;
    target = def.condition.window_s;
  } else if (def.condition.type === 'streak_rate') {
    progressValue = progressState?.type === 'streak_rate' ? progressState.count : 0;
    target = def.condition.count;
  } else if (def.condition.type === 'uptime') {
    progressValue = progressState?.type === 'uptime' ? progressState.value : 0;
    target = def.condition.target_s;
  }
  return {
    id: taskId,
    definition: def,
    progress: progressValue,
    target,
    completed: !!completedAt,
    claimed: !!claimedAt,
    completedAt,
    claimedAt,
  };
};

export const ensureDailyTasks = (
  state: DailyTaskRuntimeState,
  context: DailyTaskPlayerContext,
  now: number,
): DailyTaskRuntimeState => {
  const { dayKey } = getDayInfo(now);
  if (state.dayKey !== dayKey || state.activeTaskIds.length === 0) {
    return rollDailyTasks(state, context, now, { force: true });
  }
  return state;
};

