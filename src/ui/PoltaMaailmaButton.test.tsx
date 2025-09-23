import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { PoltaMaailmaButton } from './PoltaMaailmaButton';
import { getTuhkaAwardPreview, useGameStore } from '../app/store';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';
import i18n from '../i18n';

describe('PoltaMaailmaButton', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
    useGameStore.persist.clearStorage();
    useGameStore.setState((state) => ({
      ...state,
      tierLevel: 1,
      prestigeMult: 0,
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

  it('uses the documented Tuhka formula for high-tier previews', () => {
    const tierLevel = 15;
    const prestigeMult = 999;
    const currentTuhka = 123n;
    const totalEarned = 456n;

    useGameStore.setState((state) => ({
      ...state,
      tierLevel,
      prestigeMult,
      maailma: {
        ...state.maailma,
        tuhka: currentTuhka.toString(),
        totalTuhkaEarned: totalEarned.toString(),
      },
    }));

    const preview = getTuhkaAwardPreview();

    const tierBonus = Math.max(tierLevel - 10, 0) * 0.25 + 1;
    const expectedAwardNumber = Math.floor(
      Math.sqrt(Math.log10(prestigeMult + 1)) * 3.2 * tierBonus,
    );
    const expectedAward = BigInt(expectedAwardNumber);

    expect(expectedAwardNumber).toBeGreaterThan(0);
    expect(preview.award).toBe(expectedAward);
    expect(preview.availableAfter).toBe(currentTuhka + expectedAward);
    expect(preview.totalEarnedAfter).toBe(totalEarned + expectedAward);
  });
});
