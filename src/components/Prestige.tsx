import { useGameStore } from '../app/store';
import { getTier } from '../content';

export function Prestige() {
  const tierLevel = useGameStore((s) => s.tierLevel);
  const canAdvance = useGameStore((s) => s.canAdvanceTier());
  const advance = useGameStore((s) => s.advanceTier);
  const current = getTier(tierLevel);
  const next = getTier(tierLevel + 1);
  return (
    <div className="hud hud__card">
      <h2 className="text--h2">Uusi sauna</h2>
      <div className="text--body">
        Sauna Taso: {tierLevel}
        {current ? ` (${current.name})` : ''}
      </div>
      {next && (
        <div className="text--body">
          Next Sauna: {next.name} ({next.population})
        </div>
      )}
      <button
        className="btn btn--primary"
        disabled={!canAdvance}
        onClick={() => advance()}
        style={{ marginTop: '0.5rem' }}
      >
        Uusi sauna!
      </button>
    </div>
  );
}
