import { useGameStore, saveGame } from './store';

let last = performance.now();
let sinceSave = 0;

export function startGameLoop() {
  function frame(now: number) {
    const delta = (now - last) / 1000;
    last = now;
    useGameStore.getState().tick(delta);
    sinceSave += delta;
    if (sinceSave >= 5) {
      saveGame();
      sinceSave = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
