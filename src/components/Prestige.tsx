import { useGameStore } from '../app/store';
import { getTier } from '../content';

export function Prestige() {
  const population = useGameStore((s) => s.population);
  const tierLevel = useGameStore((s) => s.tierLevel);
  const canAdvance = useGameStore((s) => s.canAdvanceTier());
  const advance = useGameStore((s) => s.advanceTier);
  const current = getTier(tierLevel);
  const next = getTier(tierLevel + 1);
  return (
    <div>
      <h2>Tiers</h2>
      <div>
        Tier Level: {tierLevel}
        {current ? ` (${current.name})` : ''}
      </div>
      {next && (
        <div>
          Next Tier: {next.name} ({next.population})
        </div>
      )}
      <button disabled={!canAdvance} onClick={() => advance()}>
        Advance Tier
      </button>
      <div>Population: {Math.floor(population)}</div>
    </div>
  );
}
