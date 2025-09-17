import { useGameStore } from '../app/store';
import { getTier } from '../content';
import { formatNumber } from '../utils/format';
import { CollapsibleSection } from './CollapsibleSection';

export function Prestige() {
  const tierLevel = useGameStore((s) => s.tierLevel);
  const canAdvance = useGameStore((s) => s.canAdvanceTier());
  const advance = useGameStore((s) => s.advanceTier);
  const current = getTier(tierLevel);
  const next = getTier(tierLevel + 1);
  return (
    <CollapsibleSection
      title="Uusi sauna"
      className="hud hud__card"
      titleClassName="text--h2"
    >
      <div className="text--body">
        Sauna Taso: {formatNumber(tierLevel)}
        {current ? ` (${current.name})` : ''}
      </div>
      {next && (
        <div className="text--body">
          Next Sauna: {next.name} ({formatNumber(next.population)})
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
    </CollapsibleSection>
  );
}
