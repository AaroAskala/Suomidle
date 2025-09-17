import { useGameStore } from '../app/store';
import { useLocale } from '../i18n/useLocale';

export function HUD() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  return (
    <div>
      <div className="hud hud__population">
        <span>
          {t('hud.temperature', {
            value: formatNumber(population, { maximumFractionDigits: 0 }),
          })}
        </span>
        <span> | </span>
        <span>{t('hud.cps', { value: formatNumber(cps, { maximumFractionDigits: 2 }) })}</span>
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
