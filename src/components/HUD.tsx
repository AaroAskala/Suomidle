import { useGameStore } from '../app/store';
import { formatNumber } from '../utils';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  return (
    <div>
      <div className="hud hud__population">
        Lämpötila: {Math.floor(population)} | LPS: {formatNumber(cps)}
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
