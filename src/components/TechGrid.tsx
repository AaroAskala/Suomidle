import { useGameStore } from '../app/store';
import { tech } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';

export function TechGrid() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);

  return (
    <CollapsibleSection
      title={t('tech.title')}
      className="hud hud__card"
      titleClassName="text--h2"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tech.map((techDef) => {
          const count = counts[techDef.id] || 0;
          const limit = techDef.limit ?? 1;
          const isOwned = count >= limit;
          const locked = !!(techDef.unlock?.tier && tier < techDef.unlock.tier);
          const disabled = isOwned || locked || population < techDef.cost;
          const status = isOwned
            ? t('tech.unlocked')
            : locked
              ? t('tech.locked')
              : '';
          const subtitleParts = [
            status || null,
            t('tech.card.cost', { cost: formatNumber(techDef.cost, { maximumFractionDigits: 0 }) }),
          ].filter(Boolean);
          const name = t(`tech.names.${techDef.id}` as const, { defaultValue: techDef.name });
          return (
            <ImageCardButton
              key={techDef.id}
              icon={`${import.meta.env.BASE_URL}assets/tech/${techDef.icon}`}
              title={name}
              subtitle={subtitleParts.join(' · ')}
              disabled={disabled}
              onClick={() => buy(techDef.id)}
            />
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
