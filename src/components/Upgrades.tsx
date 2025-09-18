import { useGameStore } from '../app/store';
import { tech as techList } from '../content';
import { useLocale } from '../i18n/useLocale';

export function Upgrades() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);
  const tier = useGameStore((s) => s.tierLevel);
  return (
    <div>
      <h2>{t('tech.title')}</h2>
      {techList.map((techDef) => {
        if (techDef.unlock?.tier && tier < techDef.unlock.tier) return null;
        const name = t(`tech.names.${techDef.id}` as const, { defaultValue: techDef.name });
        return (
          <div key={techDef.id}>
            <span>
              {t('tech.list.item', {
                name,
                cost: formatNumber(techDef.cost, { maximumFractionDigits: 0 }),
              })}
            </span>
            <button
              className="btn btn--primary"
              disabled={
                population < techDef.cost || (counts[techDef.id] || 0) >= (techDef.limit ?? 1)
              }
              onClick={() => buy(techDef.id)}
              aria-label={t('tech.list.buy', { name })}
            >
              {t('actions.buy')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
