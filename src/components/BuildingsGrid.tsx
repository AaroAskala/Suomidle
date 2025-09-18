import { useState } from 'react';
import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import { CardDetailsModal } from './CardDetailsModal';

export function BuildingsGrid() {
  const { t } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const selectedBuilding = selectedBuildingId
    ? (() => {
        const building = buildings.find((item) => item.id === selectedBuildingId);
        if (!building) return null;
        const count = owned[building.id] || 0;
        const price = getBuildingCost(building, count);
        const productionPer = building.baseProd * mult;
        const totalProduction = productionPer * count;
        return {
          type: 'building' as const,
          id: building.id,
          icon: `${import.meta.env.BASE_URL}assets/buildings/${building.icon}`,
          count,
          nextCost: price,
          baseProduction: building.baseProd,
          productionDelta: productionPer,
          totalProduction,
          canAfford: population >= price,
          onConfirm: () => buy(building.id),
        };
      })()
    : null;

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
          const canAfford = population >= price;
          const name = t(`buildings.names.${b.id}` as const, { defaultValue: b.name });
          return (
            <li key={b.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/buildings/${b.icon}`}
                title={t('shop.card.title', {
                  name,
                  count,
                })}
                subtitle={canAfford ? t('cardDetails.status.available') : t('cardDetails.status.unavailable')}
                disabled={!canAfford}
                onSelect={() => setSelectedBuildingId(b.id)}
              />
            </li>
          );
        })}
      </ul>
      <CardDetailsModal selection={selectedBuilding} onClose={() => setSelectedBuildingId(null)} />
    </CollapsibleSection>
  );
}
