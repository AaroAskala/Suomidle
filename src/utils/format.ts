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

export const formatDuration = (seconds: number): string | null => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  if (seconds < 1) return '<1 s';
  if (seconds < 60) return `${Math.ceil(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  if (minutes < 60) return `${minutes} min ${remainingSeconds} s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `${hours} h ${remainingMinutes} min`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} pv ${remainingHours} h`;
};
