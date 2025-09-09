import { useGameStore } from '../app/store';
import upgrades from '../lib/upgrades';

export function Upgrades() {
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.upgrades);
  const buy = useGameStore((s) => s.purchaseUpgrade);
  return (
    <div>
      <h2>Upgrades</h2>
      {upgrades.map((u) => (
        <div key={u.id}>
          <span>
            {u.name} ({u.cost})
          </span>
          <button
            disabled={population < u.cost || owned.has(u.id)}
            onClick={() => buy(u.id)}
          >
            Buy
          </button>
        </div>
      ))}
    </div>
  );
}
