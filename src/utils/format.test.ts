import { describe, it, expect } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('formats numbers below 1e6 without exponent', () => {
    expect(formatNumber(999999)).toBe('999,999');
  });

  it('formats numbers at or above 1e6 in scientific notation', () => {
    expect(formatNumber(1000000)).toBe('1.00e+6');
  });
});
