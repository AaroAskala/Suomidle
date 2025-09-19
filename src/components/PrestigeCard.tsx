import { useMemo } from 'react';
import { ImageCardButton } from './ImageCardButton';
import {
  computePrestigeMult,
  computePrestigePoints,
  useGameStore,
} from '../app/store';
import { prestige as prestigeData } from '../content';
import { useLocale } from '../i18n/useLocale';

export function PrestigeCard() {
  const { t, formatNumber } = useLocale();
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const totalPopulation = useGameStore((s) => s.totalPopulation);
  const canPrestige = useGameStore((s) => s.canPrestige());
  const prestige = useGameStore((s) => s.prestige);

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
    ? t('prestige.card.gain', {
        gain: formatNumber(deltaMult * 100, { maximumFractionDigits: 2 }),
        target: formatNumber(multAfter, { maximumFractionDigits: 2 }),
      })
    : t('prestige.card.unlock', {
        requirement: formatNumber(prestigeData.minPopulation, { maximumFractionDigits: 0 }),
      });

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
        iconKey={prestigeData.icon}
        title={t('prestige.card.title', {
          name: prestigeName,
          value: formatNumber(prestigeMult, { maximumFractionDigits: 2 }),
        })}
        subtitle={subtitle}
        disabled={!canPrestige}
        onClick={() => {
          if (!canPrestige) return;
          if (
            confirm(
              t('prestige.confirm', {
                gain: formatNumber(deltaMult * 100, { maximumFractionDigits: 2 }),
                name: prestigeName,
              }),
            )
          )
            prestige();
        }}
      />
      <div className="prestige-mobile-info">
        {t('prestige.mobileInfo', {
          name: prestigeName,
          bonus: formatNumber(prestigePercent, { maximumFractionDigits: 2 }),
        })}
      </div>
    </div>
  );
}
