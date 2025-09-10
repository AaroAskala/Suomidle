import { useGameStore } from '../app/store';

export function HUD() {
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  return (
    <div className="hud">
      <div className="text--h2">Lämpötila: {Math.floor(population)}</div>
      <button className="text--body" onClick={() => addPopulation(click)}>
        Click
      </button>
    </div>
  );
}
