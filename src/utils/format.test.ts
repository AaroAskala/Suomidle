import { describe, it, expect } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('formats numbers below 1e6 without exponent', () => {
    expect(formatNumber(999999)).toBe('999,999');
  });

  it('formats numbers at or above 1e6 in scientific notation', () => {
    expect(formatNumber(1000000)).toBe('1.00e+6');
  });

  it('removes decimals when requested', () => {
    expect(formatNumber(1234.56, { maximumFractionDigits: 0 })).toBe('1,234');
  });

  it('truncates decimals instead of rounding when removing them', () => {
    expect(formatNumber(1.99, { maximumFractionDigits: 0 })).toBe('1');
  });

  it('omits decimals in exponential notation when requested', () => {
    expect(formatNumber(1000000, { maximumFractionDigits: 0 })).toBe('1e+6');
  });
});
