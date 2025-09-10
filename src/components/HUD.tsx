import { useGameStore } from '../app/store';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  return (
    <div>
      <div>Lämpötila: {Math.floor(population)}</div>
      <button
        className="btn btn--primary"
        onClick={() => addPopulation(click)}
      >
        Click
      </button>
    </div>
  );
}
