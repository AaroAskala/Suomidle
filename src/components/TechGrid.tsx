import { useState } from 'react';
import { useGameStore } from '../app/store';
import { tech } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import { CardDetailsModal } from './CardDetailsModal';

export function TechGrid() {
  const { t } = useLocale();
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const selectedTech = selectedTechId
    ? (() => {
        const techDef = tech.find((item) => item.id === selectedTechId);
        if (!techDef) return null;
        const count = counts[techDef.id] || 0;
        const limit = techDef.limit ?? 1;
        const isOwned = count >= limit;
        const locked = !!(techDef.unlock?.tier && tier < techDef.unlock.tier);
        const canAfford = !isOwned && !locked && population >= techDef.cost;
        return {
          type: 'tech' as const,
          id: techDef.id,
          icon: `${import.meta.env.BASE_URL}assets/tech/${techDef.icon}`,
          cost: techDef.cost,
          effects: techDef.effects,
          canAfford,
          isOwned,
          limit,
          purchasedCount: count,
          locked,
          unlockTier: techDef.unlock?.tier,
          onConfirm: () => buy(techDef.id),
        };
      })()
    : null;

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
          const disabled = isOwned || locked || population < techDef.cost;
          const status = isOwned
            ? t('cardDetails.status.owned')
            : locked
              ? t('cardDetails.status.locked')
              : population >= techDef.cost
                ? t('cardDetails.status.available')
                : t('cardDetails.status.unavailable');
          const name = t(`tech.names.${techDef.id}` as const, { defaultValue: techDef.name });
          return (
            <li key={techDef.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/tech/${techDef.icon}`}
                title={name}
                subtitle={status}
                disabled={disabled}
                onSelect={() => setSelectedTechId(techDef.id)}
              />
            </li>
          );
        })}
      </ul>
      <CardDetailsModal selection={selectedTech} onClose={() => setSelectedTechId(null)} />
    </CollapsibleSection>
  );
}
