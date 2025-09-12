import { useMemo } from 'react';
import { ImageCardButton } from './ImageCardButton';
import {
  computePrestigeMult,
  computePrestigePoints,
  useGameStore,
} from '../app/store';
import { prestige as prestigeData } from '../content';
import { formatNumber } from '../utils/format';

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

  const prestigePercent = (prestigeMult - 1) * 100;

  const subtitle = canPrestige
    ? `Gain +${formatNumber(deltaMult * 100)}% → ${formatNumber(multAfter)}×`
    : `Unlock at ${formatNumber(prestigeData.minPopulation)} lämpötila`;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <ImageCardButton
        className="prestige-btn"
        icon={prestigeData.icon}
        title={`${prestigeData.name}: ${formatNumber(prestigeMult)}×`}
        subtitle={subtitle}
        disabled={!canPrestige}
        onClick={() => {
          if (!canPrestige) return;
          if (
            confirm(
              `Reset progress and gain +${formatNumber(
                deltaMult * 100,
              )}% ${prestigeData.name} multiplier?`,
            )
          )
            prestige();
        }}
      />
      <div className="prestige-mobile-info">
        {`Polta sauna: +${formatNumber(prestigePercent)}%`}
      </div>
    </div>
  );
}
