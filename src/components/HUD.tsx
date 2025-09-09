import { useGameStore } from '../app/store';

export function HUD() {
  const coins = useGameStore((s) => s.coins);
  const addCoins = useGameStore((s) => s.addCoins);
  return (
    <div>
      <div>Coins: {Math.floor(coins)}</div>
      <button onClick={() => addCoins(1)}>Click</button>
    </div>
  );
}
