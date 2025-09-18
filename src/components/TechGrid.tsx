import { useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import { tech } from '../content';
import { useLocale } from '../i18n/useLocale';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageCardButton } from './ImageCardButton';
import { CardDetailsPanel } from './CardDetailsPanel';

export function TechGrid() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const tier = useGameStore((s) => s.tierLevel);
  const counts = useGameStore((s) => s.techCounts);
  const buy = useGameStore((s) => s.purchaseTech);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTech = useMemo(
    () => tech.find((techDef) => techDef.id === selectedId) ?? null,
    [selectedId],
  );
  const selectedCount = selectedTech ? counts[selectedTech.id] || 0 : 0;
  const selectedLimit = selectedTech?.limit ?? 1;
  const selectedCost = selectedTech?.cost ?? 0;
  const selectedLocked = Boolean(
    selectedTech?.unlock?.tier && tier < selectedTech.unlock.tier,
  );
  const selectedOwnedMax = selectedCount >= selectedLimit;
  const canBuySelected = Boolean(
    selectedTech && !selectedLocked && !selectedOwnedMax && population >= selectedCost,
  );
  const selectedStatus = selectedTech
    ? selectedLocked
      ? t('tech.card.status.lockedTier', { tier: selectedTech.unlock?.tier ?? 0 })
      : selectedOwnedMax
        ? t('tech.card.status.maxed')
        : population < selectedCost
          ? t('tech.card.status.unaffordable')
          : selectedCount > 0
            ? t('tech.card.status.upgradeAvailable')
            : t('tech.card.status.available')
    : '';
  const selectedDescription = selectedTech
    ? t(`tech.descriptions.${selectedTech.id}` as const, {
        defaultValue: selectedTech.description ?? '',
      })
    : '';
  const selectedFlavor = selectedTech
    ? t(`tech.flavor.${selectedTech.id}` as const, {
        defaultValue: selectedTech.flavor ?? '',
      })
    : '';
  const selectedOwnedLabel = selectedTech
    ? t('tech.details.owned', {
        count: formatNumber(selectedCount, { maximumFractionDigits: 0 }),
        limit: formatNumber(selectedLimit, { maximumFractionDigits: 0 }),
      })
    : '';
  const selectedEffects = selectedTech
    ? selectedTech.effects.map((effect, index) => {
        const formattedValue = formatNumber(effect.value, { maximumFractionDigits: 2 });
        return {
          id: `${effect.target}-${effect.type}-${index}`,
          text: t(
            `tech.effects.${effect.target}.${effect.type}` as Parameters<typeof t>[0],
            {
              value: formattedValue,
              defaultValue:
                effect.type === 'mult'
                  ? `×${formattedValue} ${effect.target}`
                  : `+${formattedValue} ${effect.target}`,
            },
          ),
        };
      })
    : [];

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
          const name = t(`tech.names.${techDef.id}` as const, { defaultValue: techDef.name });
          const statusText = locked
            ? t('tech.card.status.lockedTier', { tier: techDef.unlock?.tier ?? 0 })
            : isOwned
              ? t('tech.card.status.maxed')
              : population < techDef.cost
                ? t('tech.card.status.unaffordable')
                : count > 0
                  ? t('tech.card.status.upgradeAvailable')
                  : t('tech.card.status.available');
          return (
            <li key={techDef.id} className="card-grid__item" role="listitem">
              <ImageCardButton
                icon={`${import.meta.env.BASE_URL}assets/tech/${techDef.icon}`}
                title={t('tech.card.title', {
                  name,
                  count,
                  limit,
                })}
                subtitle={statusText}
                onSelect={() => setSelectedId(techDef.id)}
              />
            </li>
          );
        })}
      </ul>
      <CardDetailsPanel
        open={Boolean(selectedTech)}
        onClose={() => setSelectedId(null)}
        icon={
          selectedTech
            ? `${import.meta.env.BASE_URL}assets/tech/${selectedTech.icon}`
            : ''
        }
        title={
          selectedTech
            ? t(`tech.names.${selectedTech.id}` as const, {
                defaultValue: selectedTech.name,
              })
            : ''
        }
        subtitle={selectedOwnedLabel}
        status={selectedStatus}
        description={selectedDescription}
        flavor={selectedFlavor}
        actions={
          selectedTech ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canBuySelected}
              onClick={() => {
                if (!selectedTech || !canBuySelected) return;
                buy(selectedTech.id);
              }}
            >
              {t('tech.details.buy', {
                cost: formatNumber(selectedCost, { maximumFractionDigits: 0 }),
              })}
            </button>
          ) : null
        }
      >
        {selectedTech && (
          <>
            <dl className="card-details__stats">
              <div>
                <dt>{t('tech.details.costLabel')}</dt>
                <dd>
                  {formatNumber(selectedCost, { maximumFractionDigits: 0 })}
                </dd>
              </div>
              {selectedTech.unlock?.tier && (
                <div>
                  <dt>{t('tech.details.unlockLabel')}</dt>
                  <dd>
                    {t('tech.details.unlockValue', { tier: selectedTech.unlock.tier })}
                  </dd>
                </div>
              )}
            </dl>
            {selectedEffects.length > 0 && (
              <div className="card-details__effects">
                <h3 className="card-details__effects-title">{t('tech.details.effectsHeading')}</h3>
                <ul>
                  {selectedEffects.map((effect) => (
                    <li key={effect.id}>{effect.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardDetailsPanel>
    </CollapsibleSection>
  );
}
