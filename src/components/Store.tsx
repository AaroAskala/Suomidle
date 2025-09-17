import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { useLocale } from '../i18n/useLocale';

export function Store() {
  const { t, formatNumber } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  return (
    <div>
      <h2>{t('shop.title')}</h2>
      {buildings.map((building) => {
        if (building.unlock?.tier && tier < building.unlock.tier) return null;
        const count = owned[building.id] || 0;
        const price = getBuildingCost(building, count);
        const name = t(`buildings.names.${building.id}` as const, { defaultValue: building.name });
        return (
          <div key={building.id}>
            <span>
              {t('shop.list.item', {
                name,
                count: formatNumber(count, { maximumFractionDigits: 0 }),
              })}
            </span>
            <button
              className="btn btn--primary"
              disabled={population < price}
              onClick={() => buy(building.id)}
              aria-label={t('shop.list.buy', {
                name,
                price: formatNumber(price, { maximumFractionDigits: 0 }),
              })}
            >
              {t('shop.list.button', {
                price: formatNumber(price, { maximumFractionDigits: 0 }),
              })}
            </button>
          </div>
        );
      })}
    </div>
  );
}
