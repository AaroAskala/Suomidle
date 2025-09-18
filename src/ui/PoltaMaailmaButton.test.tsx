import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { PoltaMaailmaButton } from './PoltaMaailmaButton';
import { useGameStore } from '../app/store';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';
import i18n from '../i18n';

describe('PoltaMaailmaButton', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
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
    renderWithI18n(<PoltaMaailmaButton />);

    const button = screen.getByRole('button', { name: i18n.t('maailma.action') });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', i18n.t('maailma.tooltip.noAsh'));
  });
});
