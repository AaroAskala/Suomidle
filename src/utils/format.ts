const EXPONENTIAL_THRESHOLD = 1_000_000;
const MAX_FRACTION_DIGITS = 20;

type FormatNumberOptions = {
  maximumFractionDigits?: number;
  exponentFractionDigits?: number;
};

const clampFractionDigits = (value: number | undefined, fallback: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  const integer = Math.trunc(value);
  return Math.min(MAX_FRACTION_DIGITS, Math.max(0, integer));
};

const truncateIfNeeded = (value: number, shouldTruncate: boolean) =>
  shouldTruncate ? Math.trunc(value) : value;

export function formatNumber(n: number, options?: FormatNumberOptions): string {
  const maximumFractionDigits = clampFractionDigits(
    options?.maximumFractionDigits,
    2,
  );
  const exponentFractionDigits = clampFractionDigits(
    options?.exponentFractionDigits,
    maximumFractionDigits,
  );

  if (Math.abs(n) < EXPONENTIAL_THRESHOLD) {
    const value = truncateIfNeeded(n, maximumFractionDigits === 0);
    return value.toLocaleString(undefined, { maximumFractionDigits });
  }

  const value = truncateIfNeeded(n, maximumFractionDigits === 0);
  return value.toExponential(exponentFractionDigits);
}
