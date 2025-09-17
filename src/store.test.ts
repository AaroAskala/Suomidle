import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, BigBeautifulBalancePath } from './app/store';
import {
  createInitialDailyTaskState,
  getTempGainBuffSnapshots,
  type ActiveBuffState,
} from './app/dailyTasks';

describe('model v6', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState({
      population: 0,
      totalPopulation: 0,
      tierLevel: 1,
      buildings: {},
      techCounts: {},
      multipliers: { population_cps: 1 },
      baseCps: 0,
      cps: 0,
      clickPower: 1,
      prestigePoints: 0,
      prestigeMult: 1,
      eraMult: 1,
      lastMajorVersion: BigBeautifulBalancePath,
      eraPromptAcknowledged: true,
      tempGainBuffs: [],
    });
    useGameStore.getState().recompute();
  });

  it('LPS increases when buying buildings', () => {
    useGameStore.setState({ population: 1000 });
    const before = useGameStore.getState().cps;
    useGameStore.getState().purchaseBuilding('sauna');
    expect(useGameStore.getState().cps).toBeGreaterThan(before);
  });

  it("Tech 'vihta' multiplies LPS", () => {
    useGameStore.setState({ population: 1000 });
    useGameStore.getState().purchaseBuilding('sauna');
    const before = useGameStore.getState().cps;
    useGameStore.getState().purchaseTech('vihta');
    expect(useGameStore.getState().cps).toBeCloseTo(before * 1.25);
  });

  it('applies active temp gain buffs to cps, ticks, and clicks', () => {
    const now = Date.now();
    const daily = createInitialDailyTaskState();
    const activeBuff: ActiveBuffState = {
      id: 'test',
      sourceTaskId: 'test',
      rewardId: 'test_reward',
      type: 'temp_gain_mult',
      value: 0.5,
      startedAt: now,
      expiresAt: now + 60_000,
    };
    daily.activeBuffs = { [activeBuff.id]: activeBuff };
    daily.buffMultiplier = 1.5;
    useGameStore.setState({
      population: 0,
      totalPopulation: 0,
      buildings: { sauna: 1 },
      daily,
      tempGainBuffs: getTempGainBuffSnapshots(daily),
    });
    useGameStore.getState().recompute();
    expect(useGameStore.getState().baseCps).toBeCloseTo(1, 6);
    expect(useGameStore.getState().cps).toBeCloseTo(1.5, 6);

    useGameStore.setState({ population: 0, totalPopulation: 0 });
    useGameStore.getState().tick(1, 'tick');
    expect(useGameStore.getState().population).toBeCloseTo(1.5, 6);

    useGameStore.setState({ population: 0, totalPopulation: 0 });
    const clickPower = useGameStore.getState().clickPower;
    useGameStore.getState().addPopulation(clickPower);
    expect(useGameStore.getState().population).toBeCloseTo(1.5, 6);
  });

  it('rehydrates techCounts from stored object', async () => {
    const payload = {
      state: {
        population: 0,
        tierLevel: 1,
        buildings: {},
        techCounts: { vihta: 1 },
        multipliers: { population_cps: 1 },
        cps: 0,
        clickPower: 1,
        eraMult: 1,
      },
      version: BigBeautifulBalancePath,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const counts = useGameStore.getState().techCounts;
    expect(counts.vihta).toBe(1);
    useGameStore.getState().purchaseTech('vihta');
    expect(useGameStore.getState().techCounts.vihta).toBe(1);
  });

  it('migrates v5 saves and retains era multiplier', async () => {
    const payload = {
      state: {
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
        eraMult: 42,
      },
      version: 5,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    expect(useGameStore.getState().eraMult).toBe(42);
  });

  it('migrates v2 saves without resetting if no duplicate tech purchases', async () => {
    const payload = {
      state: {
        population: 50,
        tierLevel: 1,
        buildings: { sauna: 1 },
        techOwned: ['vihta'],
        multipliers: { population_cps: 10 },
        cps: 0,
        clickPower: 1,
      },
      version: 2,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    useGameStore.getState().recompute();
    const state = useGameStore.getState();
    expect(state.population).toBe(50);
    expect(state.buildings.sauna).toBe(1);
    expect(state.techCounts.vihta).toBe(1);
    expect(state.multipliers.population_cps).toBeCloseTo(1.25);
    expect(state.cps).toBeCloseTo(1.25);
  });

  it('resets save if migrated techCounts contain duplicates', async () => {
    const payload = {
      state: {
        population: 100,
        tierLevel: 2,
        buildings: { sauna: 2 },
        techCounts: { vihta: 2 },
        multipliers: { population_cps: 5 },
        cps: 0,
        clickPower: 1,
      },
      version: 2,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const state = useGameStore.getState();
    expect(state.population).toBe(0);
    expect(state.buildings.sauna).toBeUndefined();
    expect(state.techCounts.vihta).toBeUndefined();
    expect(state.tierLevel).toBe(1);
  });

  it('grants offline progress based on elapsed time', async () => {
    const fiveSecondsAgo = Date.now() - 5000;
    const payload = {
      state: {
        population: 100,
        totalPopulation: 100,
        tierLevel: 1,
        buildings: { kylakauppa: 2 },
        techCounts: {},
        multipliers: { population_cps: 1 },
        cps: 0,
        clickPower: 1,
        prestigePoints: 0,
        prestigeMult: 1,
        eraMult: 1,
        lastSave: fiveSecondsAgo,
      },
      version: BigBeautifulBalancePath,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const state = useGameStore.getState();
    expect(state.population).toBeCloseTo(150, 0);
    expect(state.totalPopulation).toBeCloseTo(150, 0);
  });

  it('rehydrating twice in quick succession only grants offline gains once', async () => {
    const fiveSecondsAgo = Date.now() - 5000;
    const payload = {
      state: {
        population: 100,
        totalPopulation: 100,
        tierLevel: 1,
        buildings: { kylakauppa: 2 },
        techCounts: {},
        multipliers: { population_cps: 1 },
        cps: 0,
        clickPower: 1,
        prestigePoints: 0,
        prestigeMult: 1,
        lastSave: fiveSecondsAgo,
      },
      version: 3,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const first = useGameStore.getState().population;
    await useGameStore.persist.rehydrate();
    const second = useGameStore.getState().population;
    expect(first).toBeCloseTo(150, 0);
    expect(second).toBeCloseTo(first, 0);
  });

  it('prompts when lastMajorVersion is outdated despite current version', async () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'test',
      configurable: true,
    });

    let prompted = 0;
    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => {
      prompted++;
      return false;
    };

    const payload = {
      state: {
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
        lastMajorVersion: BigBeautifulBalancePath - 1,
      },
      version: BigBeautifulBalancePath,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    expect(prompted).toBe(1);
    expect(useGameStore.getState().lastMajorVersion).toBe(BigBeautifulBalancePath);
    expect(useGameStore.getState().eraPromptAcknowledged).toBe(true);

    globalThis.confirm = originalConfirm;
    Object.defineProperty(global.navigator, 'userAgent', { value: originalUA });
  });


  it('resets progress when confirming major version reset prompt', async () => {
    // Simulate a browser environment where the era-change prompt is shown
    const originalUA = navigator.userAgent;
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'test',
      configurable: true,
    });

    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => true;

    const payload = {
      state: {
        population: 100,
        totalPopulation: 100,
        tierLevel: 3,
        buildings: { sauna: 5 },
        techCounts: {},
        multipliers: { population_cps: 1 },
        cps: 0,
        clickPower: 1,
        prestigePoints: 0,
        prestigeMult: 1,
        eraMult: 3,
        lastSave: Date.now() - 1000,
      },
      version: 5,
    };

    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();

    const state = useGameStore.getState();
    expect(state.population).toBe(0);
    expect(state.totalPopulation).toBe(0);
    expect(state.buildings.sauna).toBeUndefined();
    expect(state.eraMult).toBe(4);

    globalThis.confirm = originalConfirm;
    Object.defineProperty(global.navigator, 'userAgent', { value: originalUA });
  });
});
