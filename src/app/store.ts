import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from 'zustand/middleware';
import {
  buildings,
  getBuilding,
  getTech,
  getTier,
  getBuildingCost,
  prestige as prestigeData,
} from '../content';
import {
  addPopulationEarned,
  addUptime,
  claimTaskReward,
  createInitialDailyTaskState,
  ensureDailyTasks,
  expireBuffs as expireDailyBuffs,
  getTaskStatus,
  handleGameEvent,
  rollDailyTasks as rollTasks,
  updateMetricProgress,
  type DailyTaskRuntimeState,
  type DailyTaskPlayerContext,
  type DailyTaskStatus,
} from './dailyTasks';
import { gameEvents, type EventSource } from './events';

export const BigBeautifulBalancePath = 7;
let needsEraPrompt = false;

interface Multipliers {
  population_cps: number;
}

interface State {
  population: number;
  totalPopulation: number;
  tierLevel: number;
  buildings: Record<string, number>;
  techCounts: Record<string, number>;
  multipliers: Multipliers;
  cps: number;
  clickPower: number;
  prestigePoints: number;
  prestigeMult: number;
  eraMult: number;
  lastSave: number;
  lastMajorVersion: number;
  eraPromptAcknowledged: boolean;
  addPopulation: (amount: number) => void;
  purchaseBuilding: (id: string) => void;
  purchaseTech: (id: string) => void;
  recompute: () => void;
  tick: (delta: number, source?: EventSource) => void;
  canAdvanceTier: () => boolean;
  advanceTier: () => void;
  canPrestige: () => boolean;
  projectPrestigeGain: () => {
    pointsNow: number;
    multNow: number;
    pointsAfter: number;
    multAfter: number;
    deltaMult: number;
  };
  prestige: () => boolean;
  changeEra: () => void;
  daily: DailyTaskRuntimeState;
  rollDailyTasksForToday: () => void;
  rerollDailyTasks: () => void;
  getDailyTaskStatuses: () => DailyTaskStatus[];
  claimDailyTaskReward: (taskId: string) => void;
}

const initialState = {
  population: 0,
  totalPopulation: 0,
  tierLevel: 1,
  buildings: {} as Record<string, number>,
  techCounts: {} as Record<string, number>,
  multipliers: { population_cps: 1 },
  cps: 0,
  clickPower: 1,
  prestigePoints: 0,
  prestigeMult: 1,
  eraMult: 1,
  lastSave: Date.now(),
  lastMajorVersion: BigBeautifulBalancePath,
  eraPromptAcknowledged: true,
  daily: createInitialDailyTaskState(),
};

const computeDailyFeatures = (state: State) => {
  const features = new Set<string>();
  if (
    state.totalPopulation >= prestigeData.minPopulation ||
    state.prestigePoints > 0 ||
    state.prestigeMult > 1
  ) {
    features.add('prestige');
  }
  return features;
};

const buildDailyContext = (state: State, now: number): DailyTaskPlayerContext => ({
  now,
  tierLevel: state.tierLevel,
  prestigeMultiplier: state.prestigeMult,
  features: computeDailyFeatures(state),
  currentPopulation: state.population,
  totalPopulation: state.totalPopulation,
});

export const computePrestigePoints = (totalPop: number) => {
  if (prestigeData.formula.type === 'sqrt') {
    return Math.floor(Math.sqrt(totalPop / prestigeData.formula.k));
  }
  return 0;
};

export const computePrestigeMult = (points: number) => {
  if (prestigeData.formula.stacking === 'add') {
    return prestigeData.formula.base + points * prestigeData.formula.multPerPoint;
  }
  return 1;
};

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      addPopulation: (amount) => {
        const now = Date.now();
        set((s) => ({
          population: s.population + amount,
          totalPopulation: s.totalPopulation + amount,
        }));
        const updated = get();
        gameEvents.emit('loyly_throw', { amount, timestamp: now, source: 'click' });
        gameEvents.emit('click', { amount, timestamp: now, source: 'click' });
        gameEvents.emit('population_gain', {
          amount,
          timestamp: now,
          source: 'click',
          currentPopulation: updated.population,
          totalPopulation: updated.totalPopulation,
        });
      },
      purchaseBuilding: (id) => {
        const b = getBuilding(id);
        if (!b) return;
        const s = get();
        if (b.unlock?.tier && s.tierLevel < b.unlock.tier) return;
        const count = s.buildings[id] || 0;
        const price = getBuildingCost(b, count);
        if (s.population < price) return;
        const now = Date.now();
        set({
          population: s.population - price,
          buildings: { ...s.buildings, [id]: count + 1 },
        });
        get().recompute();
        const updated = get();
        gameEvents.emit('building_bought', {
          buildingId: id,
          amount: 1,
          price,
          totalOwned: (updated.buildings[id] ?? 0),
          timestamp: now,
        });
        gameEvents.emit('building_bought_same_type', {
          buildingId: id,
          totalOwned: updated.buildings[id] ?? 0,
          timestamp: now,
        });
        gameEvents.emit('population_gain', {
          amount: 0,
          timestamp: now,
          source: 'system',
          currentPopulation: updated.population,
          totalPopulation: updated.totalPopulation,
        });
      },
      purchaseTech: (id) => {
        const t = getTech(id);
        if (!t) return;
        const s = get();
        const count = s.techCounts[id] || 0;
        const limit = t.limit ?? 1;
        if (count >= limit) return;
        if (t.unlock?.tier && s.tierLevel < t.unlock.tier) return;
        if (s.population < t.cost) return;
        const nextCounts = { ...s.techCounts, [id]: count + 1 };
        const multipliers = { ...s.multipliers };
        for (const eff of t.effects) {
          if (eff.target === 'population_cps') {
            if (eff.type === 'mult') multipliers.population_cps *= eff.value;
            else multipliers.population_cps += eff.value;
          }
        }
        const now = Date.now();
        set({
          population: s.population - t.cost,
          techCounts: nextCounts,
          multipliers,
        });
        get().recompute();
        const updated = get();
        gameEvents.emit('technology_bought', {
          techId: id,
          cost: t.cost,
          count: updated.techCounts[id] ?? 0,
          timestamp: now,
        });
        gameEvents.emit('population_gain', {
          amount: 0,
          timestamp: now,
          source: 'system',
          currentPopulation: updated.population,
          totalPopulation: updated.totalPopulation,
        });
      },
      recompute: () => {
        const s = get();
        let cps = 0;
        for (const b of buildings) {
          const count = s.buildings[b.id] || 0;
          cps += b.baseProd * count;
        }
        const buffMult = s.daily?.buffMultiplier ?? 1;
        cps *= s.prestigeMult * s.multipliers.population_cps * s.eraMult * buffMult;
        const clickPower = Math.max(1, Math.round(cps / 100));
        set({ cps, clickPower });
      },
      tick: (delta, source = 'tick') => {
        const now = Date.now();
        gameEvents.emit('tick', { timestamp: now, delta, source });
        const gain = get().cps * delta;
        if (gain > 0) {
          set((s) => ({
            population: s.population + gain,
            totalPopulation: s.totalPopulation + gain,
          }));
          const updated = get();
          gameEvents.emit('population_gain', {
            amount: gain,
            timestamp: now,
            source,
            currentPopulation: updated.population,
            totalPopulation: updated.totalPopulation,
          });
        }
      },
      canAdvanceTier: () => {
        const s = get();
        const next = getTier(s.tierLevel + 1);
        return !!next && s.population >= next.population;
      },
      advanceTier: () => {
        if (!get().canAdvanceTier()) return;
        const now = Date.now();
        set((s) => ({ tierLevel: s.tierLevel + 1 }));
        const updated = get();
        gameEvents.emit('tier_unlocked', {
          tier: updated.tierLevel,
          timestamp: now,
        });
      },
      canPrestige: () => get().totalPopulation >= prestigeData.minPopulation,
      projectPrestigeGain: () => {
        const s = get();
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const multAfter = computePrestigeMult(pointsAfter);
        return {
          pointsNow: s.prestigePoints,
          multNow: s.prestigeMult,
          pointsAfter,
          multAfter,
          deltaMult: multAfter - s.prestigeMult,
        };
      },
      prestige: () => {
        if (!get().canPrestige()) return false;
        const s = get();
        const pointsAfter = computePrestigePoints(s.totalPopulation);
        const multAfter = computePrestigeMult(pointsAfter);
        const now = Date.now();
        set({
          ...initialState,
          eraMult: s.eraMult,
          totalPopulation: s.totalPopulation,
          prestigePoints: pointsAfter,
          prestigeMult: multAfter,
        });
        get().recompute();
        gameEvents.emit('prestige', {
          timestamp: now,
          newMultiplier: multAfter,
          newPoints: pointsAfter,
        });
        saveGame();
        return true;
      },
      changeEra: () => {
        const s = get();
        set({
          ...initialState,
          eraMult: s.eraMult + 1,
        });
        get().recompute();
        saveGame();
      },
      rollDailyTasksForToday: () => {
        const now = Date.now();
        set((s) => {
          const context = buildDailyContext(s, now);
          const daily = rollTasks(s.daily, context, now, { force: true });
          return { daily };
        });
      },
      rerollDailyTasks: () => {
        const now = Date.now();
        set((s) => {
          const context = buildDailyContext(s, now);
          const daily = rollTasks(s.daily, context, now, { reroll: true });
          return { daily };
        });
      },
      getDailyTaskStatuses: () => {
        const state = get();
        return state.daily.activeTaskIds
          .map((taskId) => getTaskStatus(state.daily, taskId))
          .filter((status): status is DailyTaskStatus => status !== null);
      },
      claimDailyTaskReward: (taskId) => {
        const now = Date.now();
        let shouldRecompute = false;
        set((s) => {
          const context = buildDailyContext(s, now);
          const ensured = ensureDailyTasks(s.daily, context, now);
          const result = claimTaskReward(ensured, taskId, now);
          if (!result.success) return { daily: ensured };
          if (result.state.buffMultiplier !== ensured.buffMultiplier) shouldRecompute = true;
          return { daily: result.state };
        });
        if (shouldRecompute) get().recompute();
      },
    }),
    {
      name: 'suomidle',
      version: BigBeautifulBalancePath,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number): Partial<State> => {
        const old = persistedState as Record<string, unknown> | undefined;
        const acknowledged = old?.eraPromptAcknowledged === true;
        let lastMajorVersion =
          typeof old?.lastMajorVersion === 'number' ? (old.lastMajorVersion as number) : 0;
        if (!acknowledged) lastMajorVersion = BigBeautifulBalancePath - 1;
        if (lastMajorVersion < BigBeautifulBalancePath) needsEraPrompt = true;
        if (version >= BigBeautifulBalancePath) {
          return {
            ...(old as Partial<State>),
            totalPopulation:
              typeof old?.totalPopulation === 'number'
                ? (old.totalPopulation as number)
                : Math.max(
                    typeof old?.population === 'number' ? (old.population as number) : 0,
                    0,
                  ),
            prestigePoints:
              typeof old?.prestigePoints === 'number' ? (old.prestigePoints as number) : 0,
            prestigeMult:
              typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1,
            eraMult: typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
            eraPromptAcknowledged: acknowledged,
            daily:
              (old?.daily as DailyTaskRuntimeState | undefined) ?? createInitialDailyTaskState(),
          };
        }

        needsEraPrompt = true;
        if (version >= 3) {
          return {
            ...(old as Partial<State>),
            totalPopulation:
              typeof old?.totalPopulation === 'number'
                ? (old.totalPopulation as number)
                : Math.max(
                    typeof old?.population === 'number' ? (old.population as number) : 0,
                    0,
                  ),
            prestigePoints:
              typeof old?.prestigePoints === 'number' ? (old.prestigePoints as number) : 0,
            prestigeMult:
              typeof old?.prestigeMult === 'number' ? (old.prestigeMult as number) : 1,
            eraMult:
              typeof old?.eraMult === 'number' ? (old.eraMult as number) : 1,
            lastSave:
              typeof old?.lastSave === 'number' ? (old.lastSave as number) : Date.now(),
            lastMajorVersion,
            eraPromptAcknowledged: acknowledged,
            daily:
              (old?.daily as DailyTaskRuntimeState | undefined) ?? createInitialDailyTaskState(),
          };
        }

        const counts: Record<string, number> = {};
        const raw =
          (old?.techCounts as unknown) !== undefined
            ? (old?.techCounts as unknown)
            : old?.techOwned;

        if (raw instanceof Set) {
          for (const id of raw) counts[id] = 1;
        } else if (Array.isArray(raw)) {
          for (const id of raw) counts[id] = 1;
        } else if (raw && typeof raw === 'object') {
          for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
            const n = typeof value === 'number' ? value : 1;
            counts[id] = n;
          }
        }

        if (Object.values(counts).some((n) => n > 1)) {
          return { ...initialState };
        }

        const multipliers: Multipliers = { population_cps: 1 };
        for (const [id, n] of Object.entries(counts)) {
          const t = getTech(id);
          if (!t) continue;
          for (const eff of t.effects) {
            if (eff.target === 'population_cps') {
              if (eff.type === 'mult') multipliers.population_cps *= eff.value ** n;
              else multipliers.population_cps += eff.value * n;
            }
          }
        }

        return {
          population: typeof old?.population === 'number' ? (old.population as number) : 0,
          totalPopulation: Math.max(
            typeof old?.population === 'number' ? (old.population as number) : 0,
            0,
          ),
          tierLevel: typeof old?.tierLevel === 'number' ? (old.tierLevel as number) : 1,
          buildings: (old?.buildings as Record<string, number>) ?? {},
          techCounts: counts,
          multipliers,
          cps: 0,
          clickPower: 1,
          prestigePoints: 0,
          prestigeMult: 1,
          eraMult: 1,
          lastSave: Date.now(),
          lastMajorVersion,
          eraPromptAcknowledged: acknowledged,
          daily: createInitialDailyTaskState(),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const now = Date.now();
        const last = state.lastSave ?? now;
        state.recompute();
        const delta = Math.max(0, Math.floor((now - last) / 1000));
        state.tick(delta, 'offline');
        useGameStore.setState((s) => {
          const context = buildDailyContext(s, now);
          let daily = ensureDailyTasks(s.daily, context, now);
          daily = expireDailyBuffs(daily, now);
          daily = updateMetricProgress(daily, 'temperature', s.population, now);
          daily = updateMetricProgress(daily, 'prestige_multiplier', s.prestigeMult, now);
          daily = updateMetricProgress(daily, 'population_earned_today', daily.populationEarnedToday, now);
          return { lastSave: now, daily };
        });
        let acknowledged = state.eraPromptAcknowledged;
        try {
          const raw = localStorage.getItem('suomidle');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!('eraPromptAcknowledged' in (parsed.state ?? {}))) acknowledged = false;
          }
        } catch {
          acknowledged = false;
        }
        if (state.lastMajorVersion < BigBeautifulBalancePath || !acknowledged)
          needsEraPrompt = true;
        if (needsEraPrompt) {
          const next = state.eraMult + 1;
          const isJsDom =
            typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
          if (!isJsDom) {
            if (
              confirm(
                [
                  'Suomen sauna maailma on muuttunut täysin, haluatko polttaa koko maailman, ja aloittaa alusta?',
                  `Uudessa maailmassa saat ${next}× bonuksen lämpötilaan!`,
                  '',
                  'OK: Haluan nähdä kun maailma palaa',
                  'Cancel: Haluan jatkaa nykyisillä',
                ].join('\n'),
              )
            ) {
              state.changeEra();
            }
          }
          useGameStore.setState({
            lastMajorVersion: BigBeautifulBalancePath,
            eraPromptAcknowledged: true,
          });
          needsEraPrompt = false;
        }
        saveGame();
      },
    } as PersistOptions<State, Partial<State>>,
  ),
);

export const saveGame = () => {
  const now = Date.now();
  useGameStore.setState({ lastSave: now });
  const state = useGameStore.getState();
  const rest = { ...state } as Record<string, unknown>;
  delete rest.addPopulation;
  delete rest.purchaseBuilding;
  delete rest.purchaseTech;
  delete rest.recompute;
  delete rest.tick;
  delete rest.canAdvanceTier;
  delete rest.advanceTier;
  delete rest.canPrestige;
  delete rest.projectPrestigeGain;
  delete rest.prestige;
  delete rest.changeEra;
  delete rest.rollDailyTasksForToday;
  delete rest.rerollDailyTasks;
  delete rest.getDailyTaskStatuses;
  delete rest.claimDailyTaskReward;
  const data = { state: rest, version: BigBeautifulBalancePath };
  localStorage.setItem('suomidle', JSON.stringify(data));
};

const applyDailyUpdate = (
  mutator?: (
    daily: DailyTaskRuntimeState,
    state: State,
    context: DailyTaskPlayerContext,
  ) => DailyTaskRuntimeState,
  timestamp?: number,
) => {
  const now = timestamp ?? Date.now();
  let recomputeNeeded = false;
  useGameStore.setState((state) => {
    const context = buildDailyContext(state, now);
    let daily = ensureDailyTasks(state.daily, context, now);
    const before = daily.buffMultiplier;
    if (mutator) {
      daily = mutator(daily, state, context);
    }
    if (daily.buffMultiplier !== before) recomputeNeeded = true;
    return { daily };
  });
  if (recomputeNeeded) useGameStore.getState().recompute();
};

gameEvents.on('tick', ({ delta, timestamp, source }) => {
  applyDailyUpdate((daily) => {
    let next = daily;
    if (source !== 'offline') next = addUptime(next, delta, timestamp);
    next = expireDailyBuffs(next, timestamp);
    return next;
  }, timestamp);
});

gameEvents.on('population_gain', (payload) => {
  applyDailyUpdate((daily) => {
    let next = payload.amount > 0 ? addPopulationEarned(daily, payload.amount, payload.timestamp) : daily;
    next = updateMetricProgress(next, 'temperature', payload.currentPopulation, payload.timestamp);
    return next;
  }, payload.timestamp);
});

gameEvents.on('loyly_throw', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => handleGameEvent(daily, context, 'loyly_throw', payload),
    payload.timestamp,
  );
});

gameEvents.on('click', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => handleGameEvent(daily, context, 'click', payload),
    payload.timestamp,
  );
});

gameEvents.on('building_bought', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => handleGameEvent(daily, context, 'building_bought', payload),
    payload.timestamp,
  );
});

gameEvents.on('building_bought_same_type', (payload) => {
  applyDailyUpdate(
    (daily, state, context) =>
      handleGameEvent(daily, context, 'building_bought_same_type', payload),
    payload.timestamp,
  );
});

gameEvents.on('technology_bought', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => handleGameEvent(daily, context, 'technology_bought', payload),
    payload.timestamp,
  );
});

gameEvents.on('tier_unlocked', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => handleGameEvent(daily, context, 'tier_unlocked', payload),
    payload.timestamp,
  );
});

gameEvents.on('prestige', (payload) => {
  applyDailyUpdate(
    (daily, state, context) => {
      let next = handleGameEvent(daily, context, 'prestige', payload);
      next = updateMetricProgress(next, 'prestige_multiplier', payload.newMultiplier, payload.timestamp);
      return next;
    },
    payload.timestamp,
  );
});

