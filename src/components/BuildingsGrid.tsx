import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';

export function BuildingsGrid() {
  const { t, formatNumber } = useLocale();
  const buy = useGameStore((s) => s.purchaseBuilding);
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);
  const mult = useGameStore((s) => s.multipliers.population_cps);

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
          const cpsDelta = b.baseProd * mult;
          const disabled = population < price;
          const name = t(`buildings.names.${b.id}` as const, { defaultValue: b.name });
          return (
            <li key={b.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/buildings/${b.icon}`}
                title={t('shop.card.title', {
                  name,
                  count,
                })}
                subtitle={t('shop.card.subtitle', {
                  price: formatNumber(price, { maximumFractionDigits: 0 }),
                  cps: formatNumber(cpsDelta, { maximumFractionDigits: 2 }),
                })}
                disabled={disabled}
                onClick={() => buy(b.id)}
              />
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}
