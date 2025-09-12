export function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
