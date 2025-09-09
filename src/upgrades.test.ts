import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './app/store';

describe('upgrades', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState({
      population: 0,
      generators: {},
      upgrades: new Set<string>(),
      clickPower: 1,
      cpsMultiplier: 1,
      lastSaved: Date.now(),
    });
  });

  it('mult stacks multiplicatively', () => {
    useGameStore.setState({ population: 1000 });
    const purchase = useGameStore.getState().purchaseUpgrade;
    purchase('double');
    purchase('triple');
    expect(useGameStore.getState().clickPower).toBe(6);
  });

  it('add increases click', () => {
    useGameStore.setState({ population: 10 });
    useGameStore.getState().purchaseUpgrade('plus1');
    useGameStore.getState().addPopulation(useGameStore.getState().clickPower);
    expect(useGameStore.getState().population).toBe(2);
  });
});
