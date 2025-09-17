import { useGameStore, saveGame } from './store';

let last = 0;
let sinceSave = 0;
let frameId: number | null = null;

export function startGameLoop() {
  last = performance.now();
  sinceSave = 0;

  function frame(now: number) {
    const delta = (now - last) / 1000;
    last = now;
    useGameStore.getState().tick(delta, 'tick');
    sinceSave += delta;
    if (sinceSave >= 5) {
      saveGame();
      sinceSave = 0;
    }
    frameId = requestAnimationFrame(frame);
  }

  frameId = requestAnimationFrame(frame);
  return frameId;
}

export function stopGameLoop() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
}
