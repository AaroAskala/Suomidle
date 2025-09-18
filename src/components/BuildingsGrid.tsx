import { useGameStore } from '../app/store';
import { buildings, getBuildingCost } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import type { CardSelection } from './CardSelection';

interface BuildingsGridProps {
  onSelect: (selection: CardSelection) => void;
}

export function BuildingsGrid({ onSelect }: BuildingsGridProps) {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const owned = useGameStore((s) => s.buildings);
  const tier = useGameStore((s) => s.tierLevel);

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
          const statusKey = canAfford ? 'available' : 'unavailable';
          const statusLabel = t(`cards.status.${statusKey}` as const);
          const name = t(`buildings.names.${b.id}` as const, { defaultValue: b.name });
          const countLabel = t('cards.count.owned', {
            count: formatNumber(count, { maximumFractionDigits: 0 }),
          });
          return (
            <li key={b.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/buildings/${b.icon}`}
                title={name}
                countLabel={countLabel}
                statusLabel={statusLabel}
                status={statusKey}
                onSelect={() => onSelect({ kind: 'building', id: b.id })}
              />
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}
