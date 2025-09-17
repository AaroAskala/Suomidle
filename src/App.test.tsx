import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HUD } from './components/HUD';
import { useGameStore } from './app/store';

function resetStore() {
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
  });
}

describe('HUD', () => {
  beforeEach(() => {
    resetStore();
  });

  it('increments population on click', () => {
    render(<HUD />);
    fireEvent.click(screen.getByRole('button'));
    expect(useGameStore.getState().population).toBe(1);
  });

  it('renders LPS when cps is set', () => {
    useGameStore.setState({ cps: 5 });
    render(<HUD />);
    expect(screen.getByText((content) => /5\s*LPS/.test(content))).toBeInTheDocument();
  });

  it('click gains at least 1% of cps, rounded', () => {
    useGameStore.setState({ buildings: { sauna: 250 } });
    useGameStore.getState().recompute();
    render(<HUD />);
    fireEvent.click(screen.getByRole('button'));
    expect(useGameStore.getState().population).toBe(3);
  });
});
