import {
  BUILDING_PURCHASE_EPSILON,
  createBuildingPurchaseState,
  getMaxAffordablePurchases,
  getTotalCostForPurchases,
} from '../app/buildingPurchase';
import { useGameStore } from '../app/store';
import { buildings } from '../content';
import { useLocale } from '../i18n/useLocale';

export function Store() {
  const { t, formatNumber } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const buyMax = useGameStore((s) => s.purchaseBuildingMax);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const permanent = useGameStore((s) => s.modifiers.permanent);
  return (
    <div>
      <h2>{t('shop.title')}</h2>
      {buildings.map((building) => {
        if (building.unlock?.tier && tier < building.unlock.tier) return null;
        const count = owned[building.id] || 0;
        const purchaseState = createBuildingPurchaseState(building, count, permanent);
        const price = purchaseState.nextPrice;
        const maxPurchases = getMaxAffordablePurchases(purchaseState, population);
        const totalCost =
          maxPurchases > 0 ? getTotalCostForPurchases(purchaseState, maxPurchases) : 0;
        const canBuyNow =
          maxPurchases > 0 && Number.isFinite(totalCost) && totalCost <= population + BUILDING_PURCHASE_EPSILON;
        const name = t(`buildings.names.${building.id}` as const, { defaultValue: building.name });
        const formattedPrice = Number.isFinite(price)
          ? formatNumber(price, { maximumFractionDigits: 0 })
          : '—';
        const formattedBuyAllCost =
          maxPurchases > 0 && Number.isFinite(totalCost)
            ? formatNumber(totalCost, { maximumFractionDigits: 0 })
            : '—';
        const formattedBuyAllCount = formatNumber(maxPurchases, { maximumFractionDigits: 0 });
        return (
          <div key={building.id} className="store__item">
            <span className="store__item-label">
              {t('shop.list.item', {
                name,
                count,
              })}
            </span>
            <div className="store__actions">
              <button
                className="btn btn--primary"
                disabled={!canBuyNow}
                onClick={() => buy(building.id)}
                aria-label={t('shop.list.buy', {
                  name,
                  price: formattedPrice,
                })}
              >
                {t('shop.list.button', {
                  price: formattedPrice,
                })}
              </button>
              <button
                className="btn btn--secondary"
                disabled={!canBuyNow}
                onClick={() => buyMax(building.id)}
                aria-label={t('shop.list.buyAll', {
                  name,
                  formattedCount: formattedBuyAllCount,
                  price: formattedBuyAllCost,
                })}
              >
                {t('shop.list.buttonAll', {
                  formattedCount: formattedBuyAllCount,
                })}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
