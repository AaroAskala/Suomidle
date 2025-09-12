import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { formatNumber } from '../utils/format';
import { ImageCardButton } from './ImageCardButton';

export function BuildingsGrid() {
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {buildings.map((b) => {
        if (b.unlock?.tier && tier < b.unlock.tier) return null;
        const count = owned[b.id] || 0;
        const price = getBuildingCost(b, count);
        const cpsDelta = b.baseProd * mult;
        const disabled = population < price;
        return (
          <ImageCardButton
            key={b.id}
            icon={`${import.meta.env.BASE_URL}assets/buildings/${b.icon}`}
            title={`${b.name} (${formatNumber(count)})`}
            subtitle={`Next: ${formatNumber(price)} | +${formatNumber(cpsDelta)} LPS`}
            disabled={disabled}
            onClick={() => buy(b.id)}
          />
        );
      })}
    </div>
  );
}
