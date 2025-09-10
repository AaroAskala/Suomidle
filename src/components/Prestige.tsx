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
      <h2>Uusi sauna</h2>
      <div>
        Sauna Taso: {tierLevel}
        {current ? ` (${current.name})` : ''}
      </div>
      {next && (
        <div>
          Next Sauna: {next.name} ({next.population})
        </div>
      )}
      <button
        className="btn btn--primary"
        disabled={!canAdvance}
        onClick={() => advance()}
      >
        Uusi sauna!
      </button>
      <div className="hud hud__population">Lämpötila: {Math.floor(population)}</div>
    </div>
  );
}
