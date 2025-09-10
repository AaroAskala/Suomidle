import { useMemo } from 'react';
import { ImageCardButton } from './ImageCardButton';
import {
  computePrestigeMult,
  computePrestigePoints,
  useGameStore,
} from '../app/store';
import { prestige as prestigeData } from '../content';

export function PrestigeCard() {
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const totalPopulation = useGameStore((s) => s.totalPopulation);
  const canPrestige = useGameStore((s) => s.canPrestige());
  const prestige = useGameStore((s) => s.prestige);

  const { multAfter, deltaMult } = useMemo(() => {
    const pointsAfter = computePrestigePoints(totalPopulation);
    const multAfter = computePrestigeMult(pointsAfter);
    const deltaPoints = pointsAfter - prestigePoints;
    return {
      multAfter,
      deltaMult: multAfter - prestigeMult,
      deltaPoints,
    };
  }, [prestigePoints, prestigeMult, totalPopulation]);

  const subtitle = canPrestige
    ? `Gain +${(deltaMult * 100).toFixed(0)}% → ${multAfter.toFixed(2)}×`
    : `Unlock at ${prestigeData.minPopulation} population`;

  return (
    <ImageCardButton
      icon={prestigeData.icon}
      title={`Prestige: ${prestigeMult.toFixed(2)}×`}
      subtitle={subtitle}
      disabled={!canPrestige}
      onClick={() => {
        if (!canPrestige) return;
        if (confirm('Reset progress and gain prestige multiplier?')) prestige();
      }}
    />
  );
}
