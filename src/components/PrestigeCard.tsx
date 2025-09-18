import { useMemo, useState } from 'react';
import { ImageCardButton } from './ImageCardButton';
import {
  computePrestigeMult,
  computePrestigePoints,
  useGameStore,
} from '../app/store';
import { prestige as prestigeData } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CardDetailsModal } from './CardDetailsModal';

export function PrestigeCard() {
  const { t, formatNumber } = useLocale();
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const totalPopulation = useGameStore((s) => s.totalPopulation);
  const canPrestige = useGameStore((s) => s.canPrestige());
  const prestige = useGameStore((s) => s.prestige);
  const [isModalOpen, setModalOpen] = useState(false);

  const { multAfter, deltaMult } = useMemo(() => {
    const pointsAfter = computePrestigePoints(totalPopulation);
    const multAfter = computePrestigeMult(pointsAfter);
    return {
      multAfter,
      deltaMult: multAfter - prestigeMult,
    };
  }, [prestigeMult, totalPopulation]);

  const prestigePercent = (prestigeMult - 1) * 100;
  const prestigeName = t('prestige.action', { defaultValue: prestigeData.name });

  const subtitle = canPrestige
    ? t('cardDetails.status.available')
    : t('cardDetails.status.unavailable');

  const selectedPrestige = isModalOpen
    ? {
        type: 'prestige' as const,
        icon: prestigeData.icon,
        canPrestige,
        currentMultiplier: prestigeMult,
        nextMultiplier: multAfter,
        deltaMultiplier: deltaMult,
        minPopulation: prestigeData.minPopulation,
        onConfirm: () => {
          if (!canPrestige) return;
          prestige();
          setModalOpen(false);
        },
      }
    : null;

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
        title={t('prestige.card.title', {
          name: prestigeName,
          value: formatNumber(prestigeMult, { maximumFractionDigits: 2 }),
        })}
        subtitle={subtitle}
        disabled={!canPrestige}
        onSelect={() => setModalOpen(true)}
      />
      <div className="prestige-mobile-info">
        {t('prestige.mobileInfo', {
          name: prestigeName,
          bonus: formatNumber(prestigePercent, { maximumFractionDigits: 2 }),
        })}
      </div>
      <CardDetailsModal selection={selectedPrestige} onClose={() => setModalOpen(false)} />
    </div>
  );
}
