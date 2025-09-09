import { useGameStore } from '../app/store';
import balance from '../lib/balance';

export function Prestige() {
  const population = useGameStore((s) => s.population);
  const prestige = useGameStore((s) => s.prestige);
  const level = useGameStore((s) => s.prestigeLevel);
  const multiplier = useGameStore((s) => s.multiplier);
  return (
    <div>
      <h2>Prestige</h2>
      <div>Prestige Level: {level}</div>
      <div>Multiplier: {multiplier}x</div>
      <button
        disabled={population < balance.prestigeThreshold}
        onClick={() => prestige()}
      >
        Prestige
      </button>
    </div>
  );
}
