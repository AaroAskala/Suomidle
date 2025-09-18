import { useGameStore } from '../app/store';
import { tech } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import type { CardSelection } from './CardSelection';

interface TechGridProps {
  onSelect: (selection: CardSelection) => void;
}

export function TechGrid({ onSelect }: TechGridProps) {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);

  return (
    <CollapsibleSection
      title={t('tech.title')}
      className="hud hud__card"
      titleClassName="text--h2"
    >
      <ul className="card-grid" role="list">
        {tech.map((techDef) => {
          const count = counts[techDef.id] || 0;
          const limit = techDef.limit ?? 1;
          const isOwned = count >= limit;
          const locked = !!(techDef.unlock?.tier && tier < techDef.unlock.tier);
          const canAfford = population >= techDef.cost;
          let statusKey: 'available' | 'unavailable' | 'locked' | 'owned' = 'available';
          if (isOwned) statusKey = 'owned';
          else if (locked) statusKey = 'locked';
          else if (!canAfford) statusKey = 'unavailable';
          const statusLabel =
            statusKey === 'locked' && techDef.unlock?.tier
              ? t('cards.status.lockedTier', {
                  tier: formatNumber(techDef.unlock.tier, { maximumFractionDigits: 0 }),
                })
              : t(`cards.status.${statusKey}` as const);
          const name = t(`tech.names.${techDef.id}` as const, { defaultValue: techDef.name });
          const countLabel =
            limit > 1
              ? t('cards.count.ownedWithLimit', {
                  count: formatNumber(count, { maximumFractionDigits: 0 }),
                  limit: formatNumber(limit, { maximumFractionDigits: 0 }),
                })
              : t('cards.count.owned', {
                  count: formatNumber(count, { maximumFractionDigits: 0 }),
                });
          return (
            <li key={techDef.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/tech/${techDef.icon}`}
                title={name}
                countLabel={countLabel}
                statusLabel={statusLabel}
                status={statusKey}
                onSelect={() => onSelect({ kind: 'tech', id: techDef.id })}
              />
            </li>
          );
        })}
      </ul>
    </CollapsibleSection>
  );
}
