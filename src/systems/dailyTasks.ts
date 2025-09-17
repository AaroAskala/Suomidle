import dailyTasksData from '../data/daily_tasks.json' assert { type: 'json' };
import { telemetry } from '../telemetry';

export interface DailyTaskRewardTemplate {
  type: 'temp_gain_mult';
  value: number;
  duration_s: number;
  cooldown_s: number;
}

export type DailyTaskCondition =
  | { type: 'counter'; event: string; target: number }
  | { type: 'threshold'; metric: string; target: number }
  | { type: 'delta_threshold'; metric: string; target: number; delta?: number }
  | { type: 'streak'; event: string; window_s: number; max_gap_s: number }
  | { type: 'streak_rate'; event: string; count: number; max_interval_s: number }
  | { type: 'sequence'; events: string[]; window_s?: number }
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

interface DailyTasksSelectionConfig {
  tasks_per_day: number;
  allow_duplicates_same_day: boolean;
  reroll_cost_population: number;
  reroll_limit_per_day: number;
  selection: {
    use_weights: boolean;
    min_tier: number;
    max_active_per_category: number;
  };
}

interface DailyTasksTelemetryConfig {
  log_task_rolls?: boolean;
  log_completions?: boolean;
  log_claims?: boolean;
  log_buff_start_end?: boolean;
}

export interface DailyTasksConfig {
  version: number;
  reset_timezone: string;
  daily_rotation: DailyTasksSelectionConfig;
  reward_templates: Record<string, DailyTaskRewardTemplate>;
  tasks: DailyTaskDefinition[];
  ui_texts_fi: Record<string, string>;
  telemetry?: DailyTasksTelemetryConfig;
}

export interface DailyTaskCounterState {
  type: 'counter';
  count: number;
  byKey?: Record<string, number>;
}

export interface DailyTaskStreakState {
  type: 'streak';
  events: number[];
}

export interface DailyTaskStreakRateState {
  type: 'streak_rate';
  lastTimestamp: number | null;
  count: number;
}

export interface DailyTaskSequenceState {
  type: 'sequence';
  index: number;
  lastEventTime: number | null;
}

export interface DailyTaskUptimeState {
  type: 'uptime';
}

export type DailyTaskConditionState =
  | DailyTaskCounterState
  | DailyTaskStreakState
  | DailyTaskStreakRateState
  | DailyTaskSequenceState
  | DailyTaskUptimeState;

export interface DailyTaskInstanceState {
  id: string;
  rolledAt: string;
  progress: number;
  completedAt: number | null;
  claimedAt: number | null;
  conditionState?: DailyTaskConditionState;
}

export interface DailyTaskBuff {
  taskId: string;
  rewardId: string;
  type: 'temp_gain_mult';
  value: number;
  endsAt: number;
}

export interface DailyTaskMetricsState {
  baselines: Record<string, number>;
  current: Record<string, number>;
  uptimeSeconds: number;
  lastUptimeUpdate: number | null;
}

export interface DailyTaskToastDetail {
  type: 'complete' | 'claim' | 'buff_expired';
  taskId: string;
  taskTitle: string;
  rewardValue?: number;
  rewardDuration?: number;
}

export const DAILY_TASK_TOAST_EVENT = 'daily-task-toast';

const createToastEvent = (detail: DailyTaskToastDetail) => {
  if (typeof CustomEvent === 'function') {
    return new CustomEvent(DAILY_TASK_TOAST_EVENT, { detail });
  }
  const event = new Event(DAILY_TASK_TOAST_EVENT) as CustomEvent<DailyTaskToastDetail>;
  Object.defineProperty(event, 'detail', { value: detail });
  return event;
};

export const dailyTaskEventTarget = new EventTarget();

const dispatchToast = (detail: DailyTaskToastDetail) => {
  try {
    dailyTaskEventTarget.dispatchEvent(createToastEvent(detail));
  } catch {
    // Ignore errors from dispatching toast events.
  }
};

export interface DailyTasksState {
  rolledDate: string | null;
  taskOrder: string[];
  tasks: Record<string, DailyTaskInstanceState>;
  activeBuffs: DailyTaskBuff[];
  metrics: DailyTaskMetricsState;
  nextResetAt: number | null;
  rerollsUsed: number;
}

export interface DailyTaskPlayerContext {
  tierLevel: number;
  population: number;
  totalPopulation: number;
  prestigeMult: number;
  prestigeUnlocked: boolean;
}

export type DailyTaskEvent =
  | { type: 'loyly_throw' }
  | { type: 'click' }
  | { type: 'building_bought'; buildingId: string }
  | { type: 'building_bought_same_type'; buildingId: string }
  | { type: 'technology_bought'; technologyId: string }
  | { type: 'tier_unlocked'; tierLevel: number }
  | { type: 'prestige' }
  | { type: string; [key: string]: unknown };

interface RollResult {
  taskOrder: string[];
  tasks: Record<string, DailyTaskInstanceState>;
}

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeCondition = (condition: unknown): DailyTaskCondition => {
  if (!condition || typeof condition !== 'object') {
    return { type: 'counter', event: 'noop', target: 1 };
  }
  const source = condition as Record<string, unknown>;
  const type = typeof source.type === 'string' ? source.type : 'counter';
  switch (type) {
    case 'counter': {
      const event = typeof source.event === 'string' ? source.event : 'noop';
      const target = normalizeNumber(source.target, 1);
      return { type: 'counter', event, target };
    }
    case 'threshold': {
      const metric = typeof source.metric === 'string' ? source.metric : 'temperature';
      const target = normalizeNumber(source.target, 0);
      return { type: 'threshold', metric, target };
    }
    case 'delta_threshold': {
      const metric = typeof source.metric === 'string' ? source.metric : 'temperature';
      const target = normalizeNumber(source.target ?? source.delta, 0);
      return { type: 'delta_threshold', metric, target };
    }
    case 'streak': {
      const event = typeof source.event === 'string' ? source.event : 'noop';
      const window_s = normalizeNumber(source.window_s, 1);
      const max_gap_s = normalizeNumber(source.max_gap_s, window_s);
      return { type: 'streak', event, window_s, max_gap_s };
    }
    case 'streak_rate': {
      const event = typeof source.event === 'string' ? source.event : 'noop';
      const count = normalizeNumber(source.count, 1);
      const max_interval_s = normalizeNumber(source.max_interval_s, 1);
      return { type: 'streak_rate', event, count, max_interval_s };
    }
    case 'sequence': {
      const events = Array.isArray(source.events)
        ? source.events.filter((ev): ev is string => typeof ev === 'string')
        : [];
      const window_s = normalizeNumber(source.window_s, 0);
      return { type: 'sequence', events, window_s: window_s > 0 ? window_s : undefined };
    }
    case 'uptime': {
      const target_s = normalizeNumber(source.target_s, 0);
      return { type: 'uptime', target_s };
    }
    default:
      return { type: 'counter', event: 'noop', target: 1 };
  }
};

const normalizeTask = (task: unknown): DailyTaskDefinition | null => {
  if (!task || typeof task !== 'object') return null;
  const source = task as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id : null;
  const title_fi = typeof source.title_fi === 'string' ? source.title_fi : '';
  const desc_fi = typeof source.desc_fi === 'string' ? source.desc_fi : '';
  if (!id || !title_fi) return null;
  const category = typeof source.category === 'string' ? source.category : 'general';
  const reward = typeof source.reward === 'string' ? source.reward : '';
  const weight = normalizeNumber(source.weight, 1);
  const min_tier = normalizeNumber(source.min_tier, 0);
  const max_per_day = Math.max(1, normalizeNumber(source.max_per_day, 1));
  const requires_feature = typeof source.requires_feature === 'string' ? source.requires_feature : undefined;
  const condition = normalizeCondition(source.condition);
  return {
    id,
    title_fi,
    desc_fi,
    category,
    condition,
    reward,
    weight: Math.max(0, weight),
    min_tier: Math.max(0, Math.floor(min_tier)),
    max_per_day,
    requires_feature,
  };
};

const normalizeReward = (reward: unknown): DailyTaskRewardTemplate | null => {
  if (!reward || typeof reward !== 'object') return null;
  const source = reward as Record<string, unknown>;
  const type = source.type === 'temp_gain_mult' ? 'temp_gain_mult' : null;
  if (!type) return null;
  const value = normalizeNumber(source.value, 0);
  const duration_s = Math.max(0, normalizeNumber(source.duration_s, 0));
  const cooldown_s = Math.max(0, normalizeNumber(source.cooldown_s, 0));
  return { type, value, duration_s, cooldown_s };
};

const normalizeConfig = (raw: unknown): DailyTasksConfig => {
  const source = raw as Record<string, unknown> | undefined;
  const version = normalizeNumber(source?.version, 1);
  const reset_timezone = typeof source?.reset_timezone === 'string' ? source?.reset_timezone : 'UTC';
  const rotationRaw = source?.daily_rotation as Record<string, unknown> | undefined;
  const selectionRaw = rotationRaw?.selection as Record<string, unknown> | undefined;
  const rotation: DailyTasksSelectionConfig = {
    tasks_per_day: Math.max(1, normalizeNumber(rotationRaw?.tasks_per_day, 3)),
    allow_duplicates_same_day: rotationRaw?.allow_duplicates_same_day === true,
    reroll_cost_population: Math.max(0, normalizeNumber(rotationRaw?.reroll_cost_population, 0)),
    reroll_limit_per_day: Math.max(0, normalizeNumber(rotationRaw?.reroll_limit_per_day, 0)),
    selection: {
      use_weights: selectionRaw?.use_weights !== false,
      min_tier: Math.max(0, normalizeNumber(selectionRaw?.min_tier, 0)),
      max_active_per_category: Math.max(1, normalizeNumber(selectionRaw?.max_active_per_category, 1)),
    },
  };
  const rewardsRaw = source?.reward_templates as Record<string, unknown> | undefined;
  const reward_templates: Record<string, DailyTaskRewardTemplate> = {};
  if (rewardsRaw) {
    for (const [key, value] of Object.entries(rewardsRaw)) {
      const reward = normalizeReward(value);
      if (reward) reward_templates[key] = reward;
    }
  }
  const tasksRaw = Array.isArray(source?.tasks) ? (source?.tasks as unknown[]) : [];
  const tasks: DailyTaskDefinition[] = [];
  for (const entry of tasksRaw) {
    const task = normalizeTask(entry);
    if (task) tasks.push(task);
  }
  const uiTexts = source?.ui_texts_fi as Record<string, string> | undefined;
  const ui_texts_fi: Record<string, string> = {};
  if (uiTexts) {
    for (const [key, value] of Object.entries(uiTexts)) {
      if (typeof value === 'string') ui_texts_fi[key] = value;
    }
  }
  const telemetryConfig = source?.telemetry as Record<string, unknown> | undefined;
  const telemetryNormalized: DailyTasksTelemetryConfig | undefined = telemetryConfig
    ? {
        log_task_rolls: telemetryConfig.log_task_rolls === true,
        log_completions: telemetryConfig.log_completions === true,
        log_claims: telemetryConfig.log_claims === true,
        log_buff_start_end: telemetryConfig.log_buff_start_end === true,
      }
    : undefined;
  return {
    version,
    reset_timezone,
    daily_rotation: rotation,
    reward_templates,
    tasks,
    ui_texts_fi,
    telemetry: telemetryNormalized,
  };
};

export const dailyTasksConfig: DailyTasksConfig = normalizeConfig(dailyTasksData);

const tasksById = new Map<string, DailyTaskDefinition>();
for (const task of dailyTasksConfig.tasks) {
  tasksById.set(task.id, task);
}

const hasFeature = (context: DailyTaskPlayerContext, feature: string) => {
  if (feature === 'prestige') {
    return context.prestigeUnlocked;
  }
  return true;
};

const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
};

const createSeededRng = (seedValue: string) => {
  let seed = hashString(seedValue) || 1;
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const toDateParts = (timestamp: number, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(timestamp));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '0';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
};

const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) => {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const localeString = utcDate.toLocaleString('en-US', { timeZone });
  const localDate = new Date(localeString);
  const diff = utcDate.getTime() - localDate.getTime();
  return utcDate.getTime() + diff;
};

const getDateKey = (timestamp: number, timeZone: string) => {
  const parts = toDateParts(timestamp, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
};

const getNextResetAt = (timestamp: number, timeZone: string) => {
  const parts = toDateParts(timestamp, timeZone);
  const startUtc = zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, timeZone);
  const nextUtc = new Date(startUtc);
  nextUtc.setUTCDate(nextUtc.getUTCDate() + 1);
  const nextParts = toDateParts(nextUtc.getTime(), timeZone);
  return zonedTimeToUtc(nextParts.year, nextParts.month, nextParts.day, 0, 0, 0, timeZone);
};

export const createInitialDailyTasksState = (): DailyTasksState => ({
  rolledDate: null,
  taskOrder: [],
  tasks: {},
  activeBuffs: [],
  metrics: {
    baselines: {},
    current: {},
    uptimeSeconds: 0,
    lastUptimeUpdate: null,
  },
  nextResetAt: null,
  rerollsUsed: 0,
});

const cloneConditionState = (
  state?: DailyTaskConditionState,
): DailyTaskConditionState | undefined => {
  if (!state) return undefined;
  switch (state.type) {
    case 'counter':
      return {
        type: 'counter',
        count: state.count,
        byKey: state.byKey ? { ...state.byKey } : undefined,
      };
    case 'streak':
      return { type: 'streak', events: [...state.events] };
    case 'streak_rate':
      return { type: 'streak_rate', count: state.count, lastTimestamp: state.lastTimestamp };
    case 'sequence':
      return { type: 'sequence', index: state.index, lastEventTime: state.lastEventTime };
    case 'uptime':
      return { type: 'uptime' };
    default:
      return undefined;
  }
};

const cloneTasks = (tasks: Record<string, DailyTaskInstanceState>) => {
  const next: Record<string, DailyTaskInstanceState> = {};
  for (const [id, task] of Object.entries(tasks)) {
    next[id] = { ...task, conditionState: cloneConditionState(task.conditionState) };
  }
  return next;
};

const pruneExpiredBuffs = (state: DailyTasksState, now: number): DailyTasksState => {
  if (!state.activeBuffs.length) return state;
  const active: DailyTaskBuff[] = [];
  let changed = false;
  for (const buff of state.activeBuffs) {
    if (buff.endsAt > now) {
      active.push(buff);
    } else {
      changed = true;
      dispatchToast({
        type: 'buff_expired',
        taskId: buff.taskId,
        taskTitle: tasksById.get(buff.taskId)?.title_fi ?? buff.taskId,
      });
      if (dailyTasksConfig.telemetry?.log_buff_start_end) {
        telemetry.emit('daily_task_buff_end', {
          taskId: buff.taskId,
          rewardId: buff.rewardId,
          endedAt: now,
        });
      }
    }
  }
  if (!changed) return state;
  return { ...state, activeBuffs: active };
};

const createConditionState = (
  definition: DailyTaskDefinition,
): DailyTaskConditionState | undefined => {
  const { condition } = definition;
  switch (condition.type) {
    case 'counter':
      return { type: 'counter', count: 0 };
    case 'streak':
      return { type: 'streak', events: [] };
    case 'streak_rate':
      return { type: 'streak_rate', count: 0, lastTimestamp: null };
    case 'sequence':
      return { type: 'sequence', index: 0, lastEventTime: null };
    case 'uptime':
      return { type: 'uptime' };
    default:
      return undefined;
  }
};

const buildInitialTasks = (
  dateKey: string,
  selection: DailyTaskDefinition[],
): RollResult => {
  const tasks: Record<string, DailyTaskInstanceState> = {};
  const taskOrder = selection.map((task) => task.id);
  for (const task of selection) {
    tasks[task.id] = {
      id: task.id,
      rolledAt: dateKey,
      progress: 0,
      completedAt: null,
      claimedAt: null,
      conditionState: createConditionState(task),
    };
  }
  return { taskOrder, tasks };
};

const buildInitialMetrics = (
  context: DailyTaskPlayerContext,
  now: number,
): DailyTaskMetricsState => ({
  baselines: {
    temperature: context.population,
    population_earned_today: context.population,
    prestige_multiplier: context.prestigeMult,
  },
  current: {
    temperature: context.population,
    population_earned_today: context.population,
    prestige_multiplier: context.prestigeMult,
  },
  uptimeSeconds: 0,
  lastUptimeUpdate: now,
});

const resolveMetricValue = (
  metric: string,
  context: DailyTaskPlayerContext,
  metrics: DailyTaskMetricsState,
): number => {
  switch (metric) {
    case 'temperature':
      return context.population;
    case 'prestige_multiplier':
      return context.prestigeMult;
    case 'population_earned_today':
      return context.population;
    default:
      return metrics.current[metric] ?? 0;
  }
};

const resolveMetricDelta = (
  metric: string,
  context: DailyTaskPlayerContext,
  metrics: DailyTaskMetricsState,
): number => {
  const current = resolveMetricValue(metric, context, metrics);
  const baseline = metrics.baselines[metric];
  if (!Number.isFinite(baseline)) {
    metrics.baselines[metric] = current;
    return 0;
  }
  return current - baseline;
};

const getConditionTarget = (condition: DailyTaskCondition): number => {
  switch (condition.type) {
    case 'counter':
      return condition.target;
    case 'threshold':
      return condition.target;
    case 'delta_threshold':
      return condition.target;
    case 'streak':
      return condition.window_s;
    case 'streak_rate':
      return condition.count;
    case 'sequence':
      return condition.events.length;
    case 'uptime':
      return condition.target_s;
    default:
      return 0;
  }
};

const applyProgressUpdate = (
  task: DailyTaskInstanceState,
  definition: DailyTaskDefinition,
  rawProgress: number,
  now: number,
): DailyTaskInstanceState => {
  const target = getConditionTarget(definition.condition);
  const safeProgress = Number.isFinite(rawProgress) ? rawProgress : 0;
  const clamped = target > 0 ? Math.min(safeProgress, target) : safeProgress;
  let changed = task.progress !== clamped;
  let completedAt = task.completedAt;
  if (completedAt === null && target > 0 && safeProgress >= target) {
    completedAt = now;
    changed = true;
    dispatchToast({
      type: 'complete',
      taskId: task.id,
      taskTitle: definition.title_fi,
    });
    if (dailyTasksConfig.telemetry?.log_completions) {
      telemetry.emit('daily_task_complete', {
        taskId: task.id,
        completedAt: now,
        date: task.rolledAt,
      });
    }
  }
  if (!changed) return task;
  return { ...task, progress: clamped, completedAt };
};

export const updateDailyTaskMetrics = (
  state: DailyTasksState,
  context: DailyTaskPlayerContext,
  now: number,
): DailyTasksState => {
  const metrics: DailyTaskMetricsState = {
    baselines: { ...state.metrics.baselines },
    current: { ...state.metrics.current },
    uptimeSeconds: state.metrics.uptimeSeconds,
    lastUptimeUpdate: state.metrics.lastUptimeUpdate,
  };
  metrics.current.temperature = context.population;
  metrics.current.prestige_multiplier = context.prestigeMult;
  metrics.current.population_earned_today = context.population;
  if (!state.taskOrder.length) {
    return { ...state, metrics };
  }
  let changed = false;
  const tasks = cloneTasks(state.tasks);
  for (const taskId of state.taskOrder) {
    const definition = tasksById.get(taskId);
    if (!definition) continue;
    const task = tasks[taskId];
    if (!task) continue;
    let progress = task.progress;
    switch (definition.condition.type) {
      case 'threshold': {
        progress = resolveMetricValue(definition.condition.metric, context, metrics);
        break;
      }
      case 'delta_threshold': {
        progress = resolveMetricDelta(definition.condition.metric, context, metrics);
        break;
      }
      case 'uptime': {
        progress = metrics.uptimeSeconds;
        break;
      }
      default:
        continue;
    }
    const updated = applyProgressUpdate(task, definition, progress, now);
    if (updated !== task) {
      tasks[taskId] = updated;
      changed = true;
    }
  }
  if (!changed) return { ...state, metrics };
  return { ...state, tasks, metrics };
};

const handleCounterTask = (
  task: DailyTaskInstanceState,
  definition: DailyTaskDefinition,
  event: DailyTaskEvent,
  now: number,
): DailyTaskInstanceState => {
  if (definition.condition.type !== 'counter') return task;
  if (definition.condition.event !== event.type) return task;
  const conditionState: DailyTaskCounterState =
    task.conditionState?.type === 'counter'
      ? { ...task.conditionState, byKey: task.conditionState.byKey ? { ...task.conditionState.byKey } : undefined }
      : { type: 'counter', count: 0 };
  let progress = conditionState.count;
  if (event.type === 'building_bought_same_type') {
    const key = typeof event.buildingId === 'string' ? event.buildingId : 'default';
    const current = conditionState.byKey?.[key] ?? 0;
    const next = current + 1;
    conditionState.byKey = { ...(conditionState.byKey ?? {}), [key]: next };
    conditionState.count = Math.max(conditionState.count, next);
    progress = conditionState.count;
  } else {
    conditionState.count += 1;
    progress = conditionState.count;
  }
  const baseTask: DailyTaskInstanceState = { ...task, conditionState };
  return applyProgressUpdate(baseTask, definition, progress, now);
};

const handleStreakTask = (
  task: DailyTaskInstanceState,
  definition: DailyTaskDefinition,
  event: DailyTaskEvent,
  now: number,
): DailyTaskInstanceState => {
  if (definition.condition.type !== 'streak') return task;
  if (definition.condition.event !== event.type) return task;
  const conditionState: DailyTaskStreakState =
    task.conditionState?.type === 'streak'
      ? { type: 'streak', events: [...task.conditionState.events] }
      : { type: 'streak', events: [] };
  const events = conditionState.events;
  events.push(now);
  const windowMs = Math.max(0, definition.condition.window_s * 1000);
  const maxGapMs = Math.max(0, definition.condition.max_gap_s * 1000);
  while (events.length > 0 && now - events[0] > windowMs) {
    events.shift();
  }
  if (events.length > 1 && maxGapMs > 0) {
    for (let i = events.length - 1; i > 0; i -= 1) {
      if (events[i] - events[i - 1] > maxGapMs) {
        events.splice(0, i);
        break;
      }
    }
  }
  let progress = 0;
  if (events.length >= 2) {
    progress = (events[events.length - 1] - events[0]) / 1000;
  }
  progress = Math.max(0, progress);
  const baseTask: DailyTaskInstanceState = { ...task, conditionState };
  return applyProgressUpdate(baseTask, definition, progress, now);
};

const handleStreakRateTask = (
  task: DailyTaskInstanceState,
  definition: DailyTaskDefinition,
  event: DailyTaskEvent,
  now: number,
): DailyTaskInstanceState => {
  if (definition.condition.type !== 'streak_rate') return task;
  if (definition.condition.event !== event.type) return task;
  const conditionState: DailyTaskStreakRateState =
    task.conditionState?.type === 'streak_rate'
      ? { ...task.conditionState }
      : { type: 'streak_rate', count: 0, lastTimestamp: null };
  const maxIntervalMs = Math.max(0, definition.condition.max_interval_s * 1000);
  if (
    conditionState.lastTimestamp !== null &&
    now - conditionState.lastTimestamp <= maxIntervalMs
  ) {
    conditionState.count += 1;
  } else {
    conditionState.count = 1;
  }
  conditionState.lastTimestamp = now;
  const baseTask: DailyTaskInstanceState = { ...task, conditionState };
  return applyProgressUpdate(baseTask, definition, conditionState.count, now);
};

const handleSequenceTask = (
  task: DailyTaskInstanceState,
  definition: DailyTaskDefinition,
  event: DailyTaskEvent,
  now: number,
): DailyTaskInstanceState => {
  if (definition.condition.type !== 'sequence') return task;
  const steps = definition.condition.events;
  if (!steps.length) return task;
  const conditionState: DailyTaskSequenceState =
    task.conditionState?.type === 'sequence'
      ? { ...task.conditionState }
      : { type: 'sequence', index: 0, lastEventTime: null };
  const windowMs = (definition.condition.window_s ?? 0) * 1000;
  if (
    windowMs > 0 &&
    conditionState.lastEventTime !== null &&
    now - conditionState.lastEventTime > windowMs
  ) {
    conditionState.index = 0;
    conditionState.lastEventTime = null;
  }
  const eventType = event.type;
  let index = conditionState.index;
  let lastEventTime = conditionState.lastEventTime;
  if (eventType === steps[index]) {
    if (index === 0) lastEventTime = now;
    index += 1;
    if (index >= steps.length) {
      index = steps.length;
    }
  } else if (eventType === steps[0]) {
    index = 1;
    lastEventTime = now;
  }
  conditionState.index = index;
  conditionState.lastEventTime = lastEventTime;
  const progress = Math.min(index, steps.length);
  const baseTask: DailyTaskInstanceState = { ...task, conditionState };
  return applyProgressUpdate(baseTask, definition, progress, now);
};

export const handleDailyTaskEvent = (
  state: DailyTasksState,
  event: DailyTaskEvent,
  context: DailyTaskPlayerContext,
  now: number,
): DailyTasksState => {
  if (!state.taskOrder.length) return state;
  const tasks = cloneTasks(state.tasks);
  let changed = false;
  for (const taskId of state.taskOrder) {
    const definition = tasksById.get(taskId);
    if (!definition) continue;
    const task = tasks[taskId];
    if (!task) continue;
    let updated = task;
    switch (definition.condition.type) {
      case 'counter':
        updated = handleCounterTask(task, definition, event, now);
        break;
      case 'streak':
        updated = handleStreakTask(task, definition, event, now);
        break;
      case 'streak_rate':
        updated = handleStreakRateTask(task, definition, event, now);
        break;
      case 'sequence':
        updated = handleSequenceTask(task, definition, event, now);
        break;
      default:
        break;
    }
    if (updated !== task) {
      tasks[taskId] = updated;
      changed = true;
    }
  }
  if (!changed) return state;
  const nextState = { ...state, tasks };
  return updateDailyTaskMetrics(nextState, context, now);
};

export const applyUptimeProgress = (
  state: DailyTasksState,
  context: DailyTaskPlayerContext,
  deltaSeconds: number,
  now: number,
  options?: { offline?: boolean },
): DailyTasksState => {
  if (options?.offline) {
    return updateDailyTaskMetrics(state, context, now);
  }
  const metrics: DailyTaskMetricsState = {
    ...state.metrics,
    uptimeSeconds: Math.max(0, state.metrics.uptimeSeconds + deltaSeconds),
    lastUptimeUpdate: now,
  };
  const nextState = { ...state, metrics };
  return updateDailyTaskMetrics(nextState, context, now);
};

export const getTemperatureGainMultiplier = (state: DailyTasksState): number => {
  if (!state.activeBuffs.length) return 1;
  return state.activeBuffs.reduce((multiplier, buff) => multiplier * (1 + buff.value), 1);
};

export const refreshBuffs = (
  state: DailyTasksState,
  now: number,
): DailyTasksState => pruneExpiredBuffs(state, now);

export const getEffectiveTemperatureMultiplier = (
  state: DailyTasksState,
  now: number,
): { state: DailyTasksState; multiplier: number } => {
  const cleaned = refreshBuffs(state, now);
  return { state: cleaned, multiplier: getTemperatureGainMultiplier(cleaned) };
};

export const claimDailyTaskReward = (
  state: DailyTasksState,
  taskId: string,
  now: number,
): { state: DailyTasksState; buff: DailyTaskBuff | null } => {
  const task = state.tasks[taskId];
  const definition = tasksById.get(taskId);
  if (!task || !definition) return { state, buff: null };
  if (!task.completedAt || task.claimedAt) return { state, buff: null };
  const reward = dailyTasksConfig.reward_templates[definition.reward];
  const nextTask: DailyTaskInstanceState = { ...task, claimedAt: now };
  const tasks = { ...state.tasks, [taskId]: nextTask };
  let activeBuffs = state.activeBuffs.filter((buff) => buff.taskId !== taskId || buff.endsAt > now);
  let buff: DailyTaskBuff | null = null;
  if (reward && reward.type === 'temp_gain_mult') {
    const endsAt = now + reward.duration_s * 1000;
    buff = {
      taskId,
      rewardId: definition.reward,
      type: 'temp_gain_mult',
      value: reward.value,
      endsAt,
    };
    activeBuffs = [...activeBuffs, buff];
    dispatchToast({
      type: 'claim',
      taskId,
      taskTitle: definition.title_fi,
      rewardValue: reward.value,
      rewardDuration: reward.duration_s,
    });
    if (dailyTasksConfig.telemetry?.log_buff_start_end) {
      telemetry.emit('daily_task_buff_start', {
        taskId,
        rewardId: definition.reward,
        value: reward.value,
        duration_s: reward.duration_s,
        startedAt: now,
      });
    }
  }
  if (dailyTasksConfig.telemetry?.log_claims) {
    telemetry.emit('daily_task_claim', {
      taskId,
      rewardId: definition.reward,
      claimedAt: now,
    });
  }
  const nextState = { ...state, tasks, activeBuffs };
  return { state: nextState, buff };
};

export const syncDailyTasksState = (
  state: DailyTasksState,
  context: DailyTaskPlayerContext,
  now: number,
): DailyTasksState => {
  const ensured = ensureDailyTasksForToday(state, context, now);
  return updateDailyTaskMetrics(ensured, context, now);
};

export const getDailyTaskDefinition = (id: string) => tasksById.get(id);

export const getRewardTemplate = (id: string) => dailyTasksConfig.reward_templates[id];

export const getTaskTarget = (definition: DailyTaskDefinition) =>
  Math.max(0, getConditionTarget(definition.condition));

const pickTasks = (
  context: DailyTaskPlayerContext,
  dateKey: string,
  rng: () => number,
): DailyTaskDefinition[] => {
  void dateKey;
  const { daily_rotation } = dailyTasksConfig;
  const results: DailyTaskDefinition[] = [];
  const usedCategories = new Map<string, number>();
  const allowDuplicates = daily_rotation.allow_duplicates_same_day;
  const maxPerCategory = Math.max(1, daily_rotation.selection.max_active_per_category);
  const selectionMinTier = Math.max(0, daily_rotation.selection.min_tier);
  const tierIndex = Math.max(0, Math.floor(context.tierLevel) - 1);
  const available = dailyTasksConfig.tasks.filter((task) => {
    if (task.weight <= 0) return false;
    if (tierIndex < task.min_tier) return false;
    if (task.min_tier < selectionMinTier) return false;
    if (task.requires_feature && !hasFeature(context, task.requires_feature)) return false;
    return true;
  });
  const pool: DailyTaskDefinition[] = [...available];
  while (results.length < daily_rotation.tasks_per_day && pool.length > 0) {
    const eligible = pool.filter((task) => {
      const used = usedCategories.get(task.category) ?? 0;
      return used < maxPerCategory;
    });
    if (eligible.length === 0) break;
    const totalWeight = eligible.reduce((sum, task) => {
      if (!daily_rotation.selection.use_weights) return sum + 1;
      return sum + task.weight;
    }, 0);
    if (totalWeight <= 0) break;
    let roll = rng() * totalWeight;
    let chosen: DailyTaskDefinition | null = null;
    for (const task of eligible) {
      const weight = daily_rotation.selection.use_weights ? task.weight : 1;
      if (roll < weight) {
        chosen = task;
        break;
      }
      roll -= weight;
    }
    if (!chosen) {
      chosen = eligible[eligible.length - 1];
    }
    results.push(chosen);
    usedCategories.set(chosen.category, (usedCategories.get(chosen.category) ?? 0) + 1);
    if (!allowDuplicates) {
      const index = pool.findIndex((task) => task.id === chosen?.id);
      if (index >= 0) pool.splice(index, 1);
    }
  }
  return results;
};

export const ensureDailyTasksForToday = (
  state: DailyTasksState,
  context: DailyTaskPlayerContext,
  now: number,
  rngFactory?: (seed: string) => () => number,
): DailyTasksState => {
  const cleaned = pruneExpiredBuffs(state, now);
  const dateKey = getDateKey(now, dailyTasksConfig.reset_timezone);
  const nextResetAt = getNextResetAt(now, dailyTasksConfig.reset_timezone);
  if (cleaned.rolledDate === dateKey) {
    if (cleaned.nextResetAt !== nextResetAt) {
      return { ...cleaned, nextResetAt };
    }
    return cleaned;
  }
  const seed = `${dateKey}:${context.tierLevel}:${Math.floor(context.prestigeMult * 1000)}`;
  const rng = rngFactory ? rngFactory(seed) : createSeededRng(seed);
  const selection = pickTasks(context, dateKey, rng);
  const { taskOrder, tasks } = buildInitialTasks(dateKey, selection);
  const metrics = buildInitialMetrics(context, now);
  const nextState: DailyTasksState = {
    ...cleaned,
    rolledDate: dateKey,
    taskOrder,
    tasks,
    metrics,
    nextResetAt,
    rerollsUsed: 0,
  };
  if (dailyTasksConfig.telemetry?.log_task_rolls) {
    telemetry.emit('daily_task_roll', {
      date: dateKey,
      taskIds: taskOrder,
      rolledAt: now,
    });
  }
  return nextState;
};
