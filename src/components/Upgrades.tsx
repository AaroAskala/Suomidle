import { useGameStore } from '../app/store';
import { tech as techList } from '../content';

export function Upgrades() {
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.techOwned);
  const buy = useGameStore((s) => s.purchaseTech);
  const tier = useGameStore((s) => s.tierLevel);
  return (
    <div>
      <h2>Tech</h2>
      {techList.map((t) => {
        if (t.unlock?.tier && tier < t.unlock.tier) return null;
        return (
          <div key={t.id}>
            <span>
              {t.name} ({t.cost})
            </span>
            <button
              disabled={population < t.cost || owned.has(t.id)}
              onClick={() => buy(t.id)}
            >
              Buy
            </button>
          </div>
        );
      })}
    </div>
  );
}
