import { useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import { tech } from '../content';
import { formatNumber } from '../utils/format';
import { CollapsibleSection } from './CollapsibleSection';
import { DetailModal } from './DetailModal';
import { ImageCardButton } from './ImageCardButton';

const formatEffect = (value: number) => {
  const percentage = (value - 1) * 100;
  return `${percentage >= 0 ? '+' : ''}${formatNumber(percentage, { maximumFractionDigits: 2 })}%`;
};

export function TechGrid() {
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTech = useMemo(() => tech.find((entry) => entry.id === selectedId) ?? null, [selectedId]);

  const handleClose = () => setSelectedId(null);

  return (
    <CollapsibleSection
      title="Teknologiat"
      className="hud hud__card"
      titleClassName="text--h2"
      contentClassName="card-grid"
    >
      {tech.map((entry) => {
        const count = counts[entry.id] ?? 0;
        const limit = entry.limit ?? 1;
        const isOwnedOut = count >= limit;
        const locked = !!(entry.unlock?.tier && tier < entry.unlock.tier);
        const canAfford = population >= entry.cost;
        const status = locked
          ? 'locked'
          : isOwnedOut
            ? 'owned'
            : canAfford
              ? 'ready'
              : 'unaffordable';

        const subtitle = locked
          ? `Avautuu Tier ${entry.unlock?.tier}`
          : `Hinta ${formatNumber(entry.cost, { maximumFractionDigits: 0 })}`;

        return (
          <ImageCardButton
            key={entry.id}
            iconKey={entry.iconKey}
            title={entry.name}
            subtitle={subtitle}
            badge={count > 0 ? `×${formatNumber(count, { maximumFractionDigits: 0 })}` : undefined}
            status={status}
            onClick={() => setSelectedId(entry.id)}
          />
        );
      })}

      <DetailModal
        open={selectedTech !== null}
        title={selectedTech?.name ?? ''}
        iconKey={selectedTech?.iconKey}
        onClose={handleClose}
      >
        {selectedTech ? (
          <TechDetails
            entry={selectedTech}
            ownedCount={counts[selectedTech.id] ?? 0}
            tierLevel={tier}
            population={population}
            onBuy={() => buy(selectedTech.id)}
          />
        ) : null}
      </DetailModal>
    </CollapsibleSection>
  );
}

interface TechDetailsProps {
  entry: (typeof tech)[number];
  ownedCount: number;
  tierLevel: number;
  population: number;
  onBuy: () => void;
}

function TechDetails({ entry, ownedCount, tierLevel, population, onBuy }: TechDetailsProps) {
  const limit = entry.limit ?? 1;
  const lockedTier = entry.unlock?.tier;
  const isLocked = typeof lockedTier === 'number' && tierLevel < lockedTier;
  const isMaxed = ownedCount >= limit;
  const canPurchase = !isLocked && !isMaxed && population >= entry.cost;
  const missing = Math.max(0, entry.cost - population);

  return (
    <div className="detail-stack">
      <p className="detail-stack__description">{entry.description ?? 'Ei kuvausta saatavilla.'}</p>
      <dl className="detail-stack__metrics">
        <div>
          <dt>Hinta</dt>
          <dd>{formatNumber(entry.cost)}</dd>
        </div>
        <div>
          <dt>Vaikutus</dt>
          <dd>
            {entry.effects.map((effect) => {
              if (effect.type === 'mult') {
                return (
                  <span key={`${effect.target}-${effect.value}`} className="detail-stack__effect">
                    {formatEffect(effect.value)} {effect.target === 'population_cps' ? 'LPS' : effect.target}
                  </span>
                );
              }
              return (
                <span key={`${effect.target}-${effect.value}`} className="detail-stack__effect">
                  +{formatNumber(effect.value)} {effect.target}
                </span>
              );
            })}
          </dd>
        </div>
        <div>
          <dt>Omistettu</dt>
          <dd>
            {formatNumber(ownedCount, { maximumFractionDigits: 0 })} / {formatNumber(limit, { maximumFractionDigits: 0 })}
          </dd>
        </div>
        {lockedTier ? (
          <div>
            <dt>Avautuu</dt>
            <dd>Tier {lockedTier}</dd>
          </div>
        ) : null}
      </dl>
      {entry.flavorText ? <p className="detail-stack__flavor">“{entry.flavorText}”</p> : null}
      <div className="detail-stack__actions">
        <button type="button" className="btn btn--primary" onClick={onBuy} disabled={!canPurchase}>
          Osta ({formatNumber(entry.cost)})
        </button>
        {isLocked ? (
          <div className="detail-stack__hint">Tarvitset Tier {lockedTier} ennen ostamista.</div>
        ) : null}
        {isMaxed ? <div className="detail-stack__hint">Teknologia on maksimitasolla.</div> : null}
        {!canPurchase && !isLocked && !isMaxed && missing > 0 ? (
          <div className="detail-stack__hint">Tarvitset vielä {formatNumber(missing)} lämpöä.</div>
        ) : null}
      </div>
    </div>
  );
}
