import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BuildingsGrid } from '../components/BuildingsGrid';
import { useGameStore } from '../app/store';
import { renderWithI18n, setTestLanguage } from './testUtils';
import { createInitialDailyTasksState } from '../systems/dailyTasks';

const BUY_ALL_LABEL_REGEX = /Buy all/i;

describe('BuildingsGrid', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
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
      dailyTasks: createInitialDailyTasksState(),
    });
    useGameStore.getState().recompute();
  });

  it('shows an enabled Buy all button when the player can afford multiple buildings', () => {
    useGameStore.setState({ population: 1000 });
    useGameStore.getState().recompute();
    renderWithI18n(<BuildingsGrid />);
    const [buyAllButton] = screen.getAllByRole('button', { name: BUY_ALL_LABEL_REGEX });
    expect(buyAllButton).toBeEnabled();
  });

  it('disables the Buy all button when no bulk purchase is affordable', () => {
    renderWithI18n(<BuildingsGrid />);
    const [buyAllButton] = screen.getAllByRole('button', { name: BUY_ALL_LABEL_REGEX });
    expect(buyAllButton).toBeDisabled();
  });
});
