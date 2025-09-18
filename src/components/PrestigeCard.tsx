import { useState } from 'react';
import { ImageCardButton } from './ImageCardButton';
import { CardDetailsPanel } from './CardDetailsPanel';
import { useGameStore } from '../app/store';
import { prestige as prestigeData } from '../content';
import { useLocale } from '../i18n/useLocale';

export function PrestigeCard() {
  const { t, formatNumber } = useLocale();
  const canPrestige = useGameStore((s) => s.canPrestige());
  const prestige = useGameStore((s) => s.prestige);
  const projectPrestigeGain = useGameStore((s) => s.projectPrestigeGain);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const projection = projectPrestigeGain();
  const { multNow, multAfter, deltaMult, pointsAfter } = projection;

  const prestigePercent = (multNow - 1) * 100;
  const prestigeName = t('prestige.action', { defaultValue: prestigeData.name });
  const description = t('prestige.details.description', {
    defaultValue: prestigeData.description ?? '',
  });
  const flavor = t('prestige.details.flavor', {
    defaultValue: prestigeData.flavor ?? '',
  });

  const formattedCurrentMultiplier = formatNumber(multNow, { maximumFractionDigits: 2 });
  const formattedNextMultiplier = formatNumber(multAfter, { maximumFractionDigits: 2 });
  const formattedGainPercent = formatNumber(deltaMult * 100, { maximumFractionDigits: 2 });
  const formattedRequirement = formatNumber(prestigeData.minPopulation, {
    maximumFractionDigits: 0,
  });
  const formattedPointsAfter = formatNumber(pointsAfter, {
    maximumFractionDigits: 0,
  });

  const cardStatus = canPrestige
    ? t('prestige.card.status.availableShort')
    : t('prestige.card.status.lockedShort');

  const detailStatus = canPrestige
    ? t('prestige.card.gain', {
        gain: formattedGainPercent,
        target: formattedNextMultiplier,
      })
    : t('prestige.card.unlock', {
        requirement: formattedRequirement,
      });

  const handlePrestige = () => {
    if (!canPrestige) return;
    const confirmed = confirm(
      t('prestige.confirm', {
        gain: formattedGainPercent,
        name: prestigeName,
      }),
    );
    if (!confirmed) return;
    const success = prestige();
    if (success) {
      setDetailsOpen(false);
    }
  };

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
          value: formattedCurrentMultiplier,
        })}
        subtitle={cardStatus}
        onSelect={() => setDetailsOpen(true)}
      />
      <CardDetailsPanel
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        icon={prestigeData.icon}
        title={prestigeName}
        subtitle={t('prestige.details.subtitle', {
          value: formattedCurrentMultiplier,
        })}
        status={detailStatus}
        description={description}
        flavor={flavor}
        actions={
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canPrestige}
            onClick={handlePrestige}
          >
            {t('prestige.details.action')}
          </button>
        }
      >
        <dl className="card-details__stats">
          <div>
            <dt>{t('prestige.details.currentMultiplierLabel')}</dt>
            <dd>
              {t('prestige.details.multiplierValue', {
                value: formattedCurrentMultiplier,
              })}
            </dd>
          </div>
          <div>
            <dt>{t('prestige.details.nextMultiplierLabel')}</dt>
            <dd>
              {t('prestige.details.multiplierValue', {
                value: formattedNextMultiplier,
              })}
            </dd>
          </div>
          <div>
            <dt>{t('prestige.details.gainLabel')}</dt>
            <dd>
              {t('prestige.details.gainValue', {
                value: formattedGainPercent,
              })}
            </dd>
          </div>
          <div>
            <dt>{t('prestige.details.pointsLabel')}</dt>
            <dd>{formattedPointsAfter}</dd>
          </div>
          <div>
            <dt>{t('prestige.details.requirementLabel')}</dt>
            <dd>{formattedRequirement}</dd>
          </div>
        </dl>
      </CardDetailsPanel>
      <div className="prestige-mobile-info">
        {t('prestige.mobileInfo', {
          name: prestigeName,
          bonus: formatNumber(prestigePercent, { maximumFractionDigits: 2 }),
        })}
      </div>
    </div>
  );
}
