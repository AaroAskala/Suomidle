import { ImageCardButton } from './ImageCardButton';
import { useGameStore } from '../app/store';
import { prestige as prestigeData } from '../content';

export function PrestigeCard() {
  const mult = useGameStore((s) => s.prestigeMult);
  const canPrestige = useGameStore((s) => s.canPrestige());
  const { multAfter, deltaMult } = useGameStore((s) => s.projectPrestigeGain());
  const prestige = useGameStore((s) => s.prestige);

  const subtitle = canPrestige
    ? `Gain +${(deltaMult * 100).toFixed(0)}% → ${multAfter.toFixed(2)}×`
    : `Unlock at ${prestigeData.minPopulation} population`;

  return (
    <ImageCardButton
      icon={prestigeData.icon}
      title={`Prestige: ${mult.toFixed(2)}×`}
      subtitle={subtitle}
      disabled={!canPrestige}
      onClick={() => {
        if (!canPrestige) return;
        if (confirm('Reset progress and gain prestige multiplier?')) prestige();
      }}
    />
  );
}
