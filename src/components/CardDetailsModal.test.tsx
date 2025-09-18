import '@testing-library/jest-dom';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CardDetailsModal } from './CardDetailsModal';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';

describe('CardDetailsModal', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
  });

  it('renders building details with description and flavor', () => {
    const onConfirm = vi.fn();
    renderWithI18n(
      <CardDetailsModal
        selection={{
          type: 'building',
          id: 'sauna',
          icon: 'icon.png',
          count: 2,
          nextCost: 1000,
          baseProduction: 5,
          productionDelta: 15,
          totalProduction: 30,
          canAfford: false,
          onConfirm,
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByRole('heading', { name: /Sauna \(2\)/ })).toBeInTheDocument();
    expect(screen.getByText(/A modest steam room/)).toBeInTheDocument();
    expect(screen.getByText(/Next purchase: \+15/)).toBeInTheDocument();
    expect(screen.getByText(/The bench creaks/)).toBeInTheDocument();
    const buyButton = screen.getByRole('button', { name: 'Buy' });
    expect(buyButton).toBeDisabled();
  });

  it('formats technology effects and triggers confirm', () => {
    const onConfirm = vi.fn();
    renderWithI18n(
      <CardDetailsModal
        selection={{
          type: 'tech',
          id: 'vihta',
          icon: 'icon.png',
          cost: 500,
          effects: [{ type: 'mult', target: 'population_cps', value: 1.25 }],
          canAfford: true,
          isOwned: false,
          limit: 1,
          purchasedCount: 0,
          locked: false,
          onConfirm,
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText('Birch Whisk')).toBeInTheDocument();
    expect(screen.getByText(/Global löyly production ×1.25/)).toBeInTheDocument();
    const unlockButton = screen.getByRole('button', { name: 'Unlock' });
    expect(unlockButton).toBeEnabled();
    fireEvent.click(unlockButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
