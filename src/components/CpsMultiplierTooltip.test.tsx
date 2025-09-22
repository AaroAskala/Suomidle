import { beforeEach, describe, expect, it } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CpsMultiplierTooltip } from './CpsMultiplierTooltip';
import { useGameStore } from '../app/store';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';
import { createInitialDailyTasksState } from '../systems/dailyTasks';

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
  useGameStore.setState((state) => ({
    modifiers: {
      ...state.modifiers,
      permanent: {
        ...state.modifiers.permanent,
        baseProdMult: 1,
        techMultiplierBonusAdd: 0,
        globalCpsAddFromTuhkaSpent: 0,
        perTierGlobalCpsAdd: {},
        saunaPrestigeBaseMultiplierMin: 1,
      },
    },
  }));
}

describe('CpsMultiplierTooltip', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
    resetStore();
  });

  it('displays base production and multiplier breakdown', () => {
    const buffedTasks = {
      ...createInitialDailyTasksState(),
      activeBuffs: [
        {
          taskId: 'buff',
          rewardId: 'temp',
          type: 'temp_gain_mult' as const,
          value: 0.5,
          endsAt: Date.now() + 60_000,
        },
      ],
    };

    useGameStore.setState((state) => ({
      ...state,
      buildings: { sauna: 10 },
      multipliers: { ...state.multipliers, population_cps: 2 },
      modifiers: {
        ...state.modifiers,
        permanent: {
          ...state.modifiers.permanent,
          baseProdMult: 1.5,
          techMultiplierBonusAdd: 0.25,
          globalCpsAddFromTuhkaSpent: 0.5,
          perTierGlobalCpsAdd: { '8': 0.1 },
        },
      },
      tierLevel: 9,
      prestigeMult: 3,
      eraMult: 1.8,
      dailyTasks: buffedTasks,
    }));
    useGameStore.getState().recompute();

    renderWithI18n(<CpsMultiplierTooltip />);
    const button = screen.getByRole('button', { name: /Show CPS multipliers/i });
    fireEvent.click(button);

    expect(screen.getByText(/Base production:/i)).toHaveTextContent('Base production: 10 /s');
    expect(screen.getByText(/Tech multiplier/i).closest('li')).toHaveTextContent('×2');
    expect(screen.getByText(/Maailma tech bonus/i).closest('li')).toHaveTextContent('×1.25');
    expect(screen.getByText(/Total multiplier/i)).toHaveTextContent('×54.675');
    expect(screen.getByText(/Effective CPS/i)).toHaveTextContent('546.75');
  });
});
