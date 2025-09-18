import { useGameStore } from '../app/store';
import { getTier } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';

export function Prestige() {
  const { t, formatNumber } = useLocale();
  const tierLevel = useGameStore((s) => s.tierLevel);
  const canAdvance = useGameStore((s) => s.canAdvanceTier());
  const advance = useGameStore((s) => s.advanceTier);
  const current = getTier(tierLevel);
  const next = getTier(tierLevel + 1);
  const currentName = current
    ? t(`tiers.${current.tier}.name` as const, { defaultValue: current.name })
    : null;
  const nextName = next ? t(`tiers.${next.tier}.name` as const, { defaultValue: next.name }) : null;
  return (
    <CollapsibleSection
      title={t('prestige.title')}
      className="hud hud__card"
      titleClassName="text--h2"
    >
      <div className="text--body">
        {t('prestige.level', {
          level: formatNumber(tierLevel, { maximumFractionDigits: 0 }),
          name: currentName ?? '',
          hasName: currentName ? 'true' : 'false',
        })}
      </div>
      {next && (
        <div className="text--body">
          {t('prestige.next', {
            name: nextName ?? next.name,
            population: formatNumber(next.population, { maximumFractionDigits: 0 }),
          })}
        </div>
      )}
      <button
        className="btn btn--primary"
        disabled={!canAdvance}
        onClick={() => advance()}
        style={{ marginTop: '0.5rem' }}
        aria-label={t('prestige.advance')}
      >
        {t('prestige.advance')}
      </button>
    </CollapsibleSection>
  );
}
