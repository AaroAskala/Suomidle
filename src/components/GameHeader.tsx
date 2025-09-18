import { useEffect, useMemo, useRef } from 'react';
import {
  computePrestigeMult,
  computePrestigePoints,
  useGameStore,
} from '../app/store';
import { getTier, prestige as prestigeData } from '../content';
import { useLocale } from '../i18n/useLocale';
import { getTemperatureGainMultiplier } from '../systems/dailyTasks';
import { ProgressBar } from './ProgressBar';

const updateHeaderOffset = (element: HTMLElement | null) => {
  if (!element) {
    document.documentElement.style.removeProperty('--app-header-offset');
    return;
  }
  const height = element.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--app-header-offset', `${height}px`);
};

export function GameHeader() {
  const headerRef = useRef<HTMLElement | null>(null);
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const totalPopulation = useGameStore((s) => s.totalPopulation);
  const cps = useGameStore((s) => s.cps);
  const dailyTasks = useGameStore((s) => s.dailyTasks);
  const tierLevel = useGameStore((s) => s.tierLevel);
  const tierUnlockOffset = useGameStore((s) => Math.trunc(s.modifiers.permanent.tierUnlockOffset));
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const canPrestige = useGameStore((s) => s.canPrestige());
  const advanceTier = useGameStore((s) => s.advanceTier);
  const canAdvanceTier = useGameStore((s) => s.canAdvanceTier());
  const prestige = useGameStore((s) => s.prestige);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;
    updateHeaderOffset(element);
    const observer = new ResizeObserver(() => updateHeaderOffset(element));
    observer.observe(element);
    return () => {
      observer.disconnect();
      updateHeaderOffset(null);
    };
  }, []);

  const nextTier = getTier(tierLevel + 1);
  const requirementTier = getTier(Math.max(1, tierLevel + 1 + tierUnlockOffset));
  const requirementPopulation = requirementTier?.population ?? nextTier?.population ?? 0;

  const lpsMultiplier = getTemperatureGainMultiplier(dailyTasks);
  const effectiveCps = Math.max(0, cps * lpsMultiplier);

  const temperatureValue = Math.max(0, population);
  const temperatureMax = nextTier
    ? Math.max(temperatureValue, requirementPopulation)
    : Math.max(temperatureValue, 1);

  const tierName = getTier(tierLevel)?.name;
  const tierLabel = tierName
    ? t(`tiers.${tierLevel}.name` as const, { defaultValue: tierName })
    : undefined;
  const nextTierLabel = nextTier
    ? t(`tiers.${nextTier.tier}.name` as const, { defaultValue: nextTier.name })
    : null;

  const prestigeSummary = useMemo(() => {
    const pointsAfter = computePrestigePoints(totalPopulation);
    const multAfter = computePrestigeMult(pointsAfter);
    const deltaMult = Math.max(0, multAfter - prestigeMult);
    const requirement = prestigeData.minPopulation;
    const progressValue = Math.min(totalPopulation, requirement);
    return {
      multAfter,
      deltaMult,
      requirement,
      progressValue,
    };
  }, [prestigeMult, totalPopulation]);

  const prestigeProgressMax = Math.max(prestigeSummary.requirement, prestigeSummary.progressValue, 1);

  const handlePrestige = () => {
    if (!canPrestige) return;
    const prestigeName = t('prestige.action', { defaultValue: prestigeData.name });
    const confirmed = window.confirm(
      t('prestige.confirm', {
        gain: formatNumber(prestigeSummary.deltaMult * 100, { maximumFractionDigits: 2 }),
        name: prestigeName,
      }),
    );
    if (!confirmed) return;
    prestige();
  };

  return (
    <header className="app-header" ref={headerRef}>
      <div className="app-header__inner">
        <div className="app-header__summary">
          <div className="app-header__title" aria-live="polite">
            <span className="app-header__game">{t('app.title')}</span>
            <span className="app-header__tier">
              {t('prestige.level', {
                level: formatNumber(tierLevel, { maximumFractionDigits: 0 }),
                name: tierLabel ?? '',
                hasName: tierLabel ? 'true' : 'false',
              })}
            </span>
            <span className="app-header__next-tier" aria-live="polite">
              {nextTier
                ? t('hud.nextTier', {
                    name: nextTierLabel ?? nextTier.name,
                    value: formatNumber(requirementPopulation, { maximumFractionDigits: 0 }),
                  })
                : t('hud.tierMaxed')}
            </span>
          </div>
          <div className="app-header__progress">
            <ProgressBar
              label={t('hud.temperatureLabel')}
              value={temperatureValue}
              max={temperatureMax}
              valueLabel={t('hud.temperature', {
                value: formatNumber(temperatureValue, { maximumFractionDigits: 0 }),
              })}
              helperText={nextTier
                ? t('hud.nextTier', {
                    name: nextTierLabel ?? nextTier.name,
                    value: formatNumber(requirementPopulation, { maximumFractionDigits: 0 }),
                  })
                : t('hud.tierMaxed')}
              variant="blue"
            />
            <ProgressBar
              label={t('hud.lpsLabel')}
              value={effectiveCps}
              max={nextTier ? Math.max(effectiveCps, requirementPopulation) : Math.max(effectiveCps, 1)}
              valueLabel={t('hud.cps', {
                value: formatNumber(effectiveCps, { maximumFractionDigits: 2 }),
              })}
              helperText={Math.abs(lpsMultiplier - 1) > 0.000001
                ? t('hud.lpsMultiplier', {
                    value: formatNumber(lpsMultiplier, { maximumFractionDigits: 2 }),
                  })
                : null}
              variant="orange"
            />
            <ProgressBar
              label={t('hud.prestigeLabel')}
              value={prestigeSummary.progressValue}
              max={prestigeProgressMax}
              valueLabel={t('hud.prestigeValue', {
                value: formatNumber(prestigeMult, { maximumFractionDigits: 2 }),
              })}
              helperText={canPrestige
                ? t('hud.prestigeReady', {
                    gain: formatNumber(prestigeSummary.deltaMult * 100, { maximumFractionDigits: 2 }),
                    next: formatNumber(prestigeSummary.multAfter, { maximumFractionDigits: 2 }),
                  })
                : t('hud.prestigeRequirement', {
                    value: formatNumber(prestigeSummary.requirement, { maximumFractionDigits: 0 }),
                  })}
              variant="purple"
            />
          </div>
        </div>
        <div className="app-header__actions">
          <button
            type="button"
            className="btn btn--primary app-header__action"
            onClick={advanceTier}
            disabled={!canAdvanceTier}
            aria-label={t('prestige.advance')}
          >
            {t('prestige.advance')}
          </button>
          <button
            type="button"
            className="btn btn--primary app-header__action app-header__action--burn"
            onClick={handlePrestige}
            disabled={!canPrestige}
            aria-label={t('prestige.action')}
          >
            <span className="app-header__action-title">{t('prestige.action')}</span>
            <span className="app-header__action-subtitle">
              {t('hud.prestigeActionHelper', {
                gain: formatNumber(prestigeSummary.deltaMult * 100, { maximumFractionDigits: 2 }),
                next: formatNumber(prestigeSummary.multAfter, { maximumFractionDigits: 2 }),
              })}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
