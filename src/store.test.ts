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

  it("Tech 'hand_tools' multiplies CPS", () => {
    useGameStore.setState({ population: 1000 });
    useGameStore.getState().purchaseBuilding('sauna');
    const before = useGameStore.getState().cps;
    useGameStore.getState().purchaseTech('hand_tools');
    expect(useGameStore.getState().cps).toBeCloseTo(before * 2);
  });
});
