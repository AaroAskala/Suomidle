import {
  BUILDING_PURCHASE_EPSILON,
  createBuildingPurchaseState,
  getMaxAffordablePurchases,
  getTotalCostForPurchases,
} from '../app/buildingPurchase';
import { useGameStore } from '../app/store';
import { buildings } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';

export function BuildingsGrid() {
  const { t, formatNumber } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const buyMax = useGameStore((s) => s.purchaseBuildingMax);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);
  const permanent = useGameStore((s) => s.modifiers.permanent);

  return (
    <CollapsibleSection
      title={t('shop.title')}
      className="hud hud__card"
      titleClassName="text--h2"
    >
      <ul className="card-grid" role="list">
        {buildings.map((b) => {
          if (b.unlock?.tier && tier < b.unlock.tier) return null;
          const count = owned[b.id] || 0;
          const purchaseState = createBuildingPurchaseState(b, count, permanent);
          const price = purchaseState.nextPrice;
          const cpsDelta = b.baseProd * mult;
          const rawMaxPurchases = getMaxAffordablePurchases(purchaseState, population);
          const maxPurchases = Number.isFinite(rawMaxPurchases)
            ? rawMaxPurchases
            : 0;
          const totalCost =
            maxPurchases > 0 ? getTotalCostForPurchases(purchaseState, maxPurchases) : 0;
          const name = t(`buildings.names.${b.id}` as const, { defaultValue: b.name });
          const formattedPrice = Number.isFinite(price)
            ? formatNumber(price, { maximumFractionDigits: 0 })
            : '—';
          const formattedCps = formatNumber(cpsDelta, { maximumFractionDigits: 2 });
          const formattedBuyAllCount = formatNumber(maxPurchases, { maximumFractionDigits: 0 });
          const hasFiniteTotalCost = maxPurchases > 0 && Number.isFinite(totalCost);
          const formattedBuyAllCost = hasFiniteTotalCost
            ? formatNumber(totalCost, { maximumFractionDigits: 0 })
            : '—';
          const canBuySingle =
            Number.isFinite(price) &&
            price > 0 &&
            population + BUILDING_PURCHASE_EPSILON >= price;
          const canBuyBulk =
            maxPurchases > 0 &&
            hasFiniteTotalCost &&
            totalCost <= population + BUILDING_PURCHASE_EPSILON;
          const buyDescription = t('shop.list.buy', {
            name,
            price: formattedPrice,
          });
          const buyAllDescription = t('shop.list.buyAll', {
            name,
            formattedCount: formattedBuyAllCount,
            price: formattedBuyAllCost,
          });
          const buyAllLabel = t('shop.list.buttonAll', {
            formattedCount: formattedBuyAllCount,
          });
          const showMaxPurchaseHint = maxPurchases > 1 && hasFiniteTotalCost;
          return (
            <li key={b.id} className="card-grid__item" role="listitem">
              <article className="building-card">
                <ImageCardButton
                  className="building-card__buy-one"
                  iconKey={b.icon}
                  title={t('shop.card.title', {
                    name,
                    count,
                  })}
                  subtitle={t('shop.card.subtitle', {
                    price: formattedPrice,
                    cps: formattedCps,
                  })}
                  disabled={!canBuySingle}
                  onClick={() => buy(b.id)}
                  ariaLabel={buyDescription}
                  tooltip={buyDescription}
                />
                <div className="building-card__actions">
                  <button
                    type="button"
                    className="btn btn--secondary building-card__buy-all"
                    disabled={!canBuyBulk}
                    onClick={() => buyMax(b.id)}
                    aria-label={buyAllDescription}
                    title={buyAllDescription}
                  >
                    {buyAllLabel}
                  </button>
                  {showMaxPurchaseHint ? (
                    <p className="building-card__hint" role="status">
                      {t('shop.list.maxPurchaseHint', {
                        formattedCount: formattedBuyAllCount,
                        price: formattedBuyAllCost,
                      })}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}
