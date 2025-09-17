import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PoltaMaailmaButton } from './PoltaMaailmaButton';
import { useGameStore } from '../app/store';

describe('PoltaMaailmaButton', () => {
  beforeEach(() => {
    useGameStore.persist.clearStorage();
    useGameStore.setState((state) => ({
      ...state,
      tierLevel: 1,
      prestigeMult: 1,
      maailma: {
        ...state.maailma,
        tuhka: '0',
        totalTuhkaEarned: '0',
      },
    }));
  });

  it('disables the reset button when no award is available', () => {
    render(<PoltaMaailmaButton />);

    const button = screen.getByRole('button', { name: /polta maailma/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute(
      'title',
      'Et ansaitse vielä Tuhkaa polttamalla maailman.',
    );
  });
});

