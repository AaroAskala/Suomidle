import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './app/store';

describe('model v2', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState({
      population: 0,
      tierLevel: 1,
      buildings: {},
      techOwned: new Set<string>(),
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

  it('rehydrates techOwned from stored array', async () => {
    const payload = {
      state: {
        population: 0,
        tierLevel: 1,
        buildings: {},
        techOwned: ['vihta'],
        multipliers: { population_cps: 1 },
        cps: 0,
        clickPower: 1,
      },
      version: 2,
    };
    localStorage.setItem('suomidle', JSON.stringify(payload));
    await useGameStore.persist.rehydrate();
    const owned = useGameStore.getState().techOwned;
    expect(owned instanceof Set).toBe(true);
    expect(owned.has('vihta')).toBe(true);
  });
});
