import { useGameStore } from '../app/store';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  return (
    <div>
      <div>Population: {Math.floor(population)}</div>
      <button onClick={() => addPopulation(1)}>Click</button>
    </div>
  );
}
