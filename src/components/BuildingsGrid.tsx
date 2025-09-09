import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
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
            icon={`/assets/buildings/${b.icon}`}
            title={`${b.name} (${count})`}
            subtitle={`Next: ${Math.round(price)} | +${cpsDelta.toFixed(2)} CPS`}
            disabled={disabled}
            onClick={() => buy(b.id)}
          />
        );
      })}
    </div>
  );
}
