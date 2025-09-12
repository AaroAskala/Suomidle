import { useGameStore } from '../app/store';
import { formatNumber } from '../utils/format';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  return (
    <div>
      <div className="hud hud__population">
        Lämpötila: {formatNumber(population)} | LPS: {formatNumber(cps)}
      </div>
      <button
        className="btn btn--primary"
        onClick={() => addPopulation(click)}
      >
        Heitä löylyä!
      </button>
    </div>
  );
}
