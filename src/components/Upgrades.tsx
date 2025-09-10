import { useGameStore } from '../app/store';
import { tech as techList } from '../content';

export function Upgrades() {
  const population = useGameStore((s) => s.population);
  const counts = useGameStore((s) => s.techCounts);
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
              className="btn btn--primary"
              disabled={
                population < t.cost || (counts[t.id] || 0) >= (t.limit ?? 1)
              }
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
