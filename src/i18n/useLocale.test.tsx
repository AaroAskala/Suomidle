import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';
import { useLocale } from './useLocale';

type FormatNumberDisplayProps = {
  value: number | bigint;
  options?: Intl.NumberFormatOptions;
  testId?: string;
};

function FormatNumberDisplay({ value, options, testId = 'formatted-value' }: FormatNumberDisplayProps) {
  const { formatNumber } = useLocale();
  return <span data-testid={testId}>{formatNumber(value, options)}</span>;
}

describe('useLocale.formatNumber', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
  });

  it('uses scientific notation with two decimal places when the number exceeds the threshold', () => {
    renderWithI18n(<FormatNumberDisplay value={1_000_000_000} />);

    expect(screen.getByTestId('formatted-value')).toHaveTextContent('1.00E9');
  });

  it('enforces two decimal places for scientific notation even when options request fewer digits', () => {
    renderWithI18n(
      <FormatNumberDisplay
        value={1_000_000_000}
        options={{ maximumFractionDigits: 0 }}
        testId="custom-options"
      />,
    );

    expect(screen.getByTestId('custom-options')).toHaveTextContent('1.00E9');
  });

  it('formats large bigint values with scientific notation', () => {
    renderWithI18n(
      <FormatNumberDisplay value={123_456_789_012_345_678_901_234_567_890n} testId="bigint-value" />,
    );

    expect(screen.getByTestId('bigint-value')).toHaveTextContent('1.23E29');
  });
});
