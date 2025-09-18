import { useGameStore } from '../app/store';
import { getTier } from '../content';
import { useLocale } from '../i18n/useLocale';
import { getTemperatureGainMultiplier } from '../systems/dailyTasks';
import { ProgressBar } from './ProgressBar';

export function HUD() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  const dailyTasks = useGameStore((s) => s.dailyTasks);
  const tierLevel = useGameStore((s) => s.tierLevel);
  const tierUnlockOffset = useGameStore((s) =>
    Math.trunc(s.modifiers.permanent.tierUnlockOffset),
  );
  const lpsMultiplier = getTemperatureGainMultiplier(dailyTasks);
  const effectiveCps = cps * lpsMultiplier;
  const nextTier = getTier(tierLevel + 1);
  const requirementTier = getTier(Math.max(1, tierLevel + 1 + tierUnlockOffset));
  const requirementPopulation = requirementTier?.population ?? nextTier?.population ?? 0;
  const temperatureValue = Math.max(0, population);
  const temperatureMax = nextTier
    ? Math.max(temperatureValue, requirementPopulation)
    : Math.max(temperatureValue, 1);
  const temperatureLabel = t('hud.temperatureLabel');
  const temperatureValueLabel = t('hud.temperature', {
    value: formatNumber(temperatureValue, { maximumFractionDigits: 0 }),
  });
  const nextTierName = nextTier
    ? t(`tiers.${nextTier.tier}.name` as const, { defaultValue: nextTier.name })
    : null;
  const temperatureHelper = nextTier
    ? t('hud.nextTier', {
        name: nextTierName ?? nextTier?.name ?? '',
        value: formatNumber(requirementPopulation, { maximumFractionDigits: 0 }),
      })
    : t('hud.tierMaxed');

  const lpsValue = Math.max(0, effectiveCps);
  const lpsMax = nextTier ? Math.max(lpsValue, requirementPopulation) : Math.max(lpsValue, 1);
  const lpsLabel = t('hud.lpsLabel');
  const lpsValueLabel = t('hud.cps', {
    value: formatNumber(lpsValue, { maximumFractionDigits: 2 }),
  });
  const hasLpsBonus = Math.abs(lpsMultiplier - 1) > 0.000001;
  const lpsMultiplierHelper = hasLpsBonus
    ? t('hud.lpsMultiplier', {
        value: formatNumber(lpsMultiplier, { maximumFractionDigits: 2 }),
      })
    : null;

  return (
    <div className="hud hud__population">
      <div className="hud__metrics">
        <ProgressBar
          label={temperatureLabel}
          value={temperatureValue}
          max={temperatureMax}
          valueLabel={temperatureValueLabel}
          helperText={temperatureHelper}
          variant="blue"
        />
        <ProgressBar
          label={lpsLabel}
          value={lpsValue}
          max={lpsMax}
          valueLabel={lpsValueLabel}
          helperText={lpsMultiplierHelper}
          variant="orange"
        />
      </div>
      <button
        className="btn btn--primary"
        onClick={() => addPopulation(click)}
        aria-label={t('hud.throw')}
      >
        {t('hud.throw')}
      </button>
    </div>
  );
}
