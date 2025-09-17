import { useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { formatDuration, formatNumber } from '../utils/format';
import { CollapsibleSection } from './CollapsibleSection';
import { DetailModal } from './DetailModal';
import { ImageCardButton } from './ImageCardButton';

export function BuildingsGrid() {
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);
  const cps = useGameStore((s) => s.cps);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBuilding = useMemo(
    () => buildings.find((entry) => entry.id === selectedId) ?? null,
    [selectedId],
  );

  const handleClose = () => setSelectedId(null);

  return (
    <CollapsibleSection
      title="Rakennukset"
      className="hud hud__card"
      titleClassName="text--h2"
      contentClassName="card-grid"
    >
      {buildings.map((building) => {
        if (building.unlock?.tier && tier < building.unlock.tier) {
          return (
            <ImageCardButton
              key={building.id}
              iconKey={building.iconKey}
              title={building.name}
              subtitle={`Avautuu Tier ${building.unlock.tier}`}
              status="locked"
              onClick={() => setSelectedId(building.id)}
            />
          );
        }

        const count = owned[building.id] ?? 0;
        const price = getBuildingCost(building, count);
        const canAfford = population >= price;
        const status = canAfford ? 'ready' : count > 0 ? 'owned' : 'unaffordable';

        return (
          <ImageCardButton
            key={building.id}
            iconKey={building.iconKey}
            title={building.name}
            subtitle={`Hinta ${formatNumber(price, { maximumFractionDigits: 0 })}`}
            badge={count > 0 ? `×${formatNumber(count, { maximumFractionDigits: 0 })}` : undefined}
            status={status}
            onClick={() => setSelectedId(building.id)}
          />
        );
      })}

      <DetailModal
        open={selectedBuilding !== null}
        title={selectedBuilding?.name ?? ''}
        iconKey={selectedBuilding?.iconKey}
        onClose={handleClose}
      >
        {selectedBuilding ? (
          <BuildingDetails
            building={selectedBuilding}
            ownedCount={owned[selectedBuilding.id] ?? 0}
            population={population}
            multiplier={Math.max(0, mult)}
            cps={cps}
            tierLevel={tier}
            onBuy={() => {
              buy(selectedBuilding.id);
            }}
          />
        ) : null}
      </DetailModal>
    </CollapsibleSection>
  );
}

interface BuildingDetailsProps {
  building: (typeof buildings)[number];
  ownedCount: number;
  population: number;
  multiplier: number;
  cps: number;
  tierLevel: number;
  onBuy: () => void;
}

function BuildingDetails({
  building,
  ownedCount,
  population,
  multiplier,
  cps,
  tierLevel,
  onBuy,
}: BuildingDetailsProps) {
  const price = getBuildingCost(building, ownedCount);
  const effectiveProduction = building.baseProd * multiplier;
  const totalProduction = effectiveProduction * ownedCount;
  const unlockTier = building.unlock?.tier;
  const isLocked = typeof unlockTier === 'number' && tierLevel < unlockTier;
  const canAfford = population >= price;
  const canPurchase = !isLocked && canAfford;
  const timeToAfford =
    cps > 0 && !canAfford && !isLocked ? formatDuration((price - population) / cps) : null;

  return (
    <div className="detail-stack">
      <p className="detail-stack__description">{building.description ?? 'Ei kuvausta saatavilla.'}</p>
      <dl className="detail-stack__metrics">
        <div>
          <dt>Seuraava hinta</dt>
          <dd>{formatNumber(price)}</dd>
        </div>
        <div>
          <dt>Perustuotanto</dt>
          <dd>+{formatNumber(building.baseProd)} LPS</dd>
        </div>
        <div>
          <dt>Nykyinen kerroin</dt>
          <dd>×{formatNumber(multiplier, { maximumFractionDigits: 2 })}</dd>
        </div>
        <div>
          <dt>Tuotanto / yksikkö</dt>
          <dd>+{formatNumber(effectiveProduction)} LPS</dd>
        </div>
        <div>
          <dt>Kokonaisvaikutus</dt>
          <dd>+{formatNumber(totalProduction)} LPS</dd>
        </div>
        <div>
          <dt>Omistettu</dt>
          <dd>{formatNumber(ownedCount, { maximumFractionDigits: 0 })} kpl</dd>
        </div>
        {unlockTier ? (
          <div>
            <dt>Avautuu</dt>
            <dd>Tier {unlockTier}</dd>
          </div>
        ) : null}
      </dl>
      {timeToAfford ? (
        <div className="detail-stack__hint">Arvio seuraavaan ostoon: {timeToAfford}</div>
      ) : !canAfford && !isLocked ? (
        <div className="detail-stack__hint">Tarvitset lisää lämpöä tämän hankkimiseksi.</div>
      ) : null}
      {building.flavorText ? (
        <p className="detail-stack__flavor">“{building.flavorText}”</p>
      ) : null}
      <div className="detail-stack__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onBuy}
          disabled={!canPurchase}
        >
          Osta ({formatNumber(price)})
        </button>
        {isLocked ? (
          <div className="detail-stack__hint">Tarvitset Tier {unlockTier} ennen ostamista.</div>
        ) : null}
      </div>
    </div>
  );
}
