import { beforeEach, describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HUD } from './components/HUD';
import { useGameStore } from './app/store';
import { renderWithI18n, setTestLanguage } from './tests/testUtils';
import i18n from './i18n';
import { createInitialDailyTasksState } from './systems/dailyTasks';

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
    dailyTasks: createInitialDailyTasksState(),
  });
}

describe('HUD', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
    resetStore();
  });

  it('increments population on click', () => {
    renderWithI18n(<HUD />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('hud.throw') }));
    expect(useGameStore.getState().population).toBe(1);
  });

  it('renders cps when cps is set', () => {
    useGameStore.setState({ cps: 5 });
    renderWithI18n(<HUD />);
    const formatted = new Intl.NumberFormat(i18n.language).format(5);
    expect(screen.getByText(i18n.t('hud.cps', { value: formatted }))).toBeInTheDocument();
  });

  it('applies active daily task buffs to displayed cps', () => {
    const buffedTasks = {
      ...createInitialDailyTasksState(),
      activeBuffs: [
        {
          taskId: 'loyly_100',
          rewardId: 'small_temp_boost',
          type: 'temp_gain_mult' as const,
          value: 0.5,
          endsAt: Date.now() + 60_000,
        },
      ],
    };
    useGameStore.setState({ cps: 10, dailyTasks: buffedTasks });
    renderWithI18n(<HUD />);
    const formatted = new Intl.NumberFormat(i18n.language).format(15);
    expect(screen.getByText(i18n.t('hud.cps', { value: formatted }))).toBeInTheDocument();
  });

  it('click gains at least 1% of cps, rounded', () => {
    useGameStore.setState({ buildings: { sauna: 250 } });
    useGameStore.getState().recompute();
    renderWithI18n(<HUD />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('hud.throw') }));
    expect(useGameStore.getState().population).toBe(3);
  });
});
