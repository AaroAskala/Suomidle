import { useGameStore } from '../app/store';
import { tech } from '../content';
import { ImageCardButton } from './ImageCardButton';

export function TechGrid() {
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {tech.map((t) => {
        const count = counts[t.id] || 0;
        const limit = t.limit ?? 1;
        const isOwned = count >= limit;
        const locked = !!(t.unlock?.tier && tier < t.unlock.tier);
        const disabled = isOwned || locked || population < t.cost;
        const subtitle = `${isOwned ? 'Owned' : locked ? 'Locked' : ''}${
          isOwned || locked ? ' - ' : ''
        }Cost: ${Math.round(t.cost)}`;
        return (
          <ImageCardButton
            key={t.id}
            icon={`${import.meta.env.BASE_URL}assets/tech/${t.icon}`}
            title={t.name}
            subtitle={subtitle}
            disabled={disabled}
            onClick={() => buy(t.id)}
          />
        );
      })}
    </div>
  );
}
