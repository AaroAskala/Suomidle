import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';

export function Store() {
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  return (
    <div>
      <h2>Store</h2>
      {buildings.map((b) => {
        if (b.unlock?.tier && tier < b.unlock.tier) return null;
        const count = owned[b.id] || 0;
        const price = getBuildingCost(b, count);
        return (
          <div key={b.id}>
            <span>
              {b.name} ({count}){' '}
            </span>
            <button disabled={population < price} onClick={() => buy(b.id)}>
              Buy {Math.round(price)}
            </button>
          </div>
        );
      })}
    </div>
  );
}
