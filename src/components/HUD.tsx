import { useGameStore } from '../app/store';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  return (
    <div>
      <div>Population: {Math.floor(population)}</div>
      <button onClick={() => addPopulation(click)}>Click</button>
    </div>
  );
}
