import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { BuildingsGrid } from '../BuildingsGrid';
import { TechGrid } from '../TechGrid';
import { PrestigeCard } from '../PrestigeCard';
import { renderWithI18n, setTestLanguage } from '../../tests/testUtils';
import { useGameStore } from '../../app/store';
import { createInitialDailyTasksState } from '../../systems/dailyTasks';

function resetStore() {
  useGameStore.setState({
    population: 1_000_000,
    totalPopulation: 1_000_000,
    tierLevel: 12,
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

describe('selection detail panels', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
    resetStore();
  });

  it('opens building details and purchases through the panel', async () => {
    renderWithI18n(<BuildingsGrid />);
    const button = screen.getByRole('button', { name: /Sauna \(0\)/ });
    fireEvent.click(button);

    expect(screen.getByRole('dialog', { name: 'Sauna' })).toBeInTheDocument();
    expect(screen.getByText('Owned: 0')).toBeInTheDocument();

    const buyButton = screen.getByRole('button', { name: /Buy for/ });
    fireEvent.click(buyButton);

    expect(useGameStore.getState().buildings.sauna).toBe(1);
    expect(await screen.findByText('Owned: 1')).toBeInTheDocument();
  });

  it('shows technology effects and allows research', async () => {
    renderWithI18n(<TechGrid />);
    const button = screen.getByRole('button', { name: /Birch Whisk \(0\/1\)/ });
    fireEvent.click(button);

    expect(screen.getByRole('dialog', { name: 'Birch Whisk' })).toBeInTheDocument();
    expect(screen.getByText(/Global production ×1.25/)).toBeInTheDocument();

    const buyButton = screen.getByRole('button', { name: /Research for/ });
    fireEvent.click(buyButton);

    expect(useGameStore.getState().techCounts.vihta).toBe(1);
    expect(
      await screen.findByText('Owned: 1 / 1'),
    ).toBeInTheDocument();
  });

  it('opens prestige details and performs a reset from the panel', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithI18n(<PrestigeCard />);

    const button = screen.getByRole('button', { name: /Burn sauna/ });
    fireEvent.click(button);

    const dialog = screen.getByRole('dialog', { name: 'Burn sauna' });
    expect(within(dialog).getByText(/Permanent multiplier/)).toBeInTheDocument();

    const prestigeButton = within(dialog).getByRole('button', { name: 'Burn sauna' });
    fireEvent.click(prestigeButton);

    expect(confirmSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Burn sauna' })).not.toBeInTheDocument(),
    );

    expect(useGameStore.getState().prestigePoints).toBeGreaterThan(0);

    confirmSpy.mockRestore();
  });
});
