import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './app/store';

describe('model v3', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState({
      population: 0,
      tierLevel: 1,
      buildings: {},
      techCounts: {},
      multipliers: { population_cps: 1 },
      cps: 0,
      clickPower: 1,
    });
    useGameStore.getState().recompute();
  });

  it('CPS increases when buying buildings', () => {
    useGameStore.setState({ population: 1000 });
    const before = useGameStore.getState().cps;
    useGameStore.getState().purchaseBuilding('sauna');
    expect(useGameStore.getState().cps).toBeGreaterThan(before);
  });

  it("Tech 'vihta' multiplies CPS", () => {
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
      },
      version: 3,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const counts = useGameStore.getState().techCounts;
    expect(counts.vihta).toBe(1);
    useGameStore.getState().purchaseTech('vihta');
    expect(useGameStore.getState().techCounts.vihta).toBe(1);
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
    const state = useGameStore.getState();
    expect(state.population).toBe(50);
    expect(state.buildings.sauna).toBe(1);
    expect(state.techCounts.vihta).toBe(1);
    expect(state.multipliers.population_cps).toBeCloseTo(1.25);
    expect(state.cps).toBeCloseTo(0.125);
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
});
