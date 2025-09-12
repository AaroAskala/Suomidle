export function formatNumber(n: number): string {
  if (Math.abs(n) < 1e6) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return n.toExponential(2);
}
