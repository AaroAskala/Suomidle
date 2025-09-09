import { useGameStore } from '../app/store';
import balance from '../lib/balance';

export function Store() {
  const buy = useGameStore((s) => s.buyGenerator);
  const coins = useGameStore((s) => s.coins);
  const generators = useGameStore((s) => s.generators);
  return (
    <div>
      <h2>Store</h2>
      {balance.generators.map((gen) => {
        const count = generators[gen.id] || 0;
        const price = balance.getPrice(gen, count);
        return (
          <div key={gen.id}>
            <span>{gen.name} ({count}) </span>
            <button disabled={coins < price} onClick={() => buy(gen.id)}>
              Buy {Math.round(price)}
            </button>
          </div>
        );
      })}
    </div>
  );
}
