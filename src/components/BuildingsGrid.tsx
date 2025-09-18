import { useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import { CardDetailsPanel } from './CardDetailsPanel';

export function BuildingsGrid() {
  const { t, formatNumber } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedId) ?? null,
    [selectedId],
  );

  const selectedCount = selectedBuilding ? owned[selectedBuilding.id] || 0 : 0;
  const selectedPrice = selectedBuilding
    ? getBuildingCost(selectedBuilding, selectedCount)
    : 0;
  const selectedLocked = Boolean(
    selectedBuilding?.unlock?.tier && tier < selectedBuilding.unlock.tier,
  );
  const selectedPerBuilding = selectedBuilding
    ? selectedBuilding.baseProd * mult
    : 0;
  const selectedStatus = selectedBuilding
    ? selectedLocked
      ? t('shop.card.status.lockedTier', {
          tier: selectedBuilding.unlock?.tier ?? 0,
        })
      : population < selectedPrice
        ? t('shop.card.status.unaffordable')
        : t('shop.card.status.available')
    : '';
  const canBuySelected = Boolean(
    selectedBuilding && !selectedLocked && population >= selectedPrice,
  );
  const selectedDescription = selectedBuilding
    ? t(`buildings.descriptions.${selectedBuilding.id}` as const, {
        defaultValue: selectedBuilding.description ?? '',
      })
    : '';
  const selectedFlavor = selectedBuilding
    ? t(`buildings.flavor.${selectedBuilding.id}` as const, {
        defaultValue: selectedBuilding.flavor ?? '',
      })
    : '';
  const countLabel = selectedBuilding
    ? t('shop.details.count', {
        count: formatNumber(selectedCount, { maximumFractionDigits: 0 }),
      })
    : '';

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
          const price = getBuildingCost(b, count);
          const name = t(`buildings.names.${b.id}` as const, { defaultValue: b.name });
          const locked = Boolean(b.unlock?.tier && tier < b.unlock.tier);
          const statusText = locked
            ? t('shop.card.status.lockedTier', {
                tier: b.unlock?.tier ?? 0,
              })
            : population < price
              ? t('shop.card.status.unaffordable')
              : t('shop.card.status.available');
          return (
            <li key={b.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/buildings/${b.icon}`}
                title={t('shop.card.title', {
                  name,
                  count,
                })}
                subtitle={statusText}
                onSelect={() => setSelectedId(b.id)}
              />
            </li>
          );
        })}
      </ul>
      <CardDetailsPanel
        open={Boolean(selectedBuilding)}
        onClose={() => setSelectedId(null)}
        icon={
          selectedBuilding
            ? `${import.meta.env.BASE_URL}assets/buildings/${selectedBuilding.icon}`
            : ''
        }
        title={
          selectedBuilding
            ? t(`buildings.names.${selectedBuilding.id}` as const, {
                defaultValue: selectedBuilding.name,
              })
            : ''
        }
        subtitle={countLabel}
        status={selectedStatus}
        description={selectedDescription}
        flavor={selectedFlavor}
        actions={
          selectedBuilding ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canBuySelected}
              onClick={() => {
                if (!selectedBuilding || !canBuySelected) return;
                buy(selectedBuilding.id);
              }}
            >
              {t('shop.details.buy', {
                cost: formatNumber(selectedPrice, { maximumFractionDigits: 0 }),
              })}
            </button>
          ) : null
        }
      >
        {selectedBuilding && (
          <dl className="card-details__stats">
            <div>
              <dt>{t('shop.details.nextCostLabel')}</dt>
              <dd>
                {formatNumber(selectedPrice, {
                  maximumFractionDigits: 0,
                })}
              </dd>
            </div>
            <div>
              <dt>{t('shop.details.productionEachLabel')}</dt>
              <dd>
                {t('shop.details.productionEachValue', {
                  value: formatNumber(selectedPerBuilding, {
                    maximumFractionDigits: 2,
                  }),
                })}
              </dd>
            </div>
            <div>
              <dt>{t('shop.details.productionCurrentLabel')}</dt>
              <dd>
                {t('shop.details.productionValue', {
                  value: formatNumber(selectedPerBuilding * selectedCount, {
                    maximumFractionDigits: 2,
                  }),
                })}
              </dd>
            </div>
            <div>
              <dt>{t('shop.details.productionAfterLabel')}</dt>
              <dd>
                {t('shop.details.productionValue', {
                  value: formatNumber(selectedPerBuilding * (selectedCount + 1), {
                    maximumFractionDigits: 2,
                  }),
                })}
              </dd>
            </div>
          </dl>
        )}
      </CardDetailsPanel>
    </CollapsibleSection>
  );
}
