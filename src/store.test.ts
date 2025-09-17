import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore, BigBeautifulBalancePath, STORAGE_KEY } from './app/store';

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
      cps: 0,
      clickPower: 1,
      prestigePoints: 0,
      prestigeMult: 1,
      eraMult: 1,
      lastMajorVersion: BigBeautifulBalancePath,
      eraPromptAcknowledged: true,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    await useGameStore.persist.rehydrate();

    const state = useGameStore.getState();
    expect(state.population).toBe(0);
    expect(state.totalPopulation).toBe(0);
    expect(state.buildings.sauna).toBeUndefined();
    expect(state.eraMult).toBe(4);

    globalThis.confirm = originalConfirm;
    Object.defineProperty(global.navigator, 'userAgent', { value: originalUA });
  });

  it('keeps persisted saves isolated between storage namespaces', async () => {
    const mutableEnv = import.meta.env as unknown as Record<string, string | undefined>;
    const originalNamespace = mutableEnv.VITE_STORAGE_NAMESPACE;
    const originalMode = mutableEnv.MODE;

    const loadStoreForNamespace = async (namespace: string) => {
      vi.resetModules();
      mutableEnv.VITE_STORAGE_NAMESPACE = namespace;
      mutableEnv.MODE = 'production';
      return import('./app/store');
    };

    localStorage.clear();

    try {
      const prodModule = await loadStoreForNamespace('prod-slot');
      const prodStore = prodModule.useGameStore;
      const prodKey = prodModule.STORAGE_KEY;

      const prodPayload = {
        state: {
          population: 111,
          totalPopulation: 111,
          tierLevel: 1,
          buildings: {},
          techCounts: {},
          multipliers: { population_cps: 1 },
          cps: 0,
          clickPower: 1,
          prestigePoints: 0,
          prestigeMult: 1,
          eraMult: 1,
        },
        version: prodModule.BigBeautifulBalancePath,
      } satisfies Record<string, unknown>;

      localStorage.setItem(prodKey, JSON.stringify(prodPayload));
      await prodStore.persist.rehydrate();
      expect(prodStore.getState().population).toBe(111);

      const prodStoredValue = localStorage.getItem(prodKey);
      expect(prodStoredValue).toBeTruthy();
      const prodSnapshot = prodStoredValue ? JSON.parse(prodStoredValue) : null;

      const previewModule = await loadStoreForNamespace('dev-preview');
      const previewStore = previewModule.useGameStore;
      const previewKey = previewModule.STORAGE_KEY;

      expect(previewKey).not.toBe(prodKey);

      await previewStore.persist.rehydrate();
      expect(previewStore.getState().population).toBe(0);

      const prodValueAfterPreview = localStorage.getItem(prodKey);
      expect(prodValueAfterPreview).toBeTruthy();
      if (prodSnapshot) {
        expect(prodValueAfterPreview ? JSON.parse(prodValueAfterPreview) : null).toEqual(
          prodSnapshot,
        );
      }

      await previewStore.persist.clearStorage();
      await prodStore.persist.clearStorage();
    } finally {
      if (originalNamespace === undefined) {
        delete mutableEnv.VITE_STORAGE_NAMESPACE;
      } else {
        mutableEnv.VITE_STORAGE_NAMESPACE = originalNamespace;
      }
      if (originalMode === undefined) {
        delete mutableEnv.MODE;
      } else {
        mutableEnv.MODE = originalMode;
      }
      localStorage.clear();
      vi.resetModules();
    }
  });
});
