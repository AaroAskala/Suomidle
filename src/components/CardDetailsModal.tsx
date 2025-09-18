import { useEffect, useId, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useGameStore } from '../app/store';
import { getBuilding, getBuildingCost, getTech } from '../content';
import { useLocale } from '../i18n/useLocale';
import type { CardSelection } from './CardSelection';

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

const findFocusable = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

export interface CardDetailsModalProps {
  selection: CardSelection | null;
  onClose: () => void;
}

type StatusKey = 'available' | 'unavailable' | 'locked' | 'owned';

interface DetailContent {
  icon: string;
  name: string;
  description: string;
  flavour: string;
  statusKey: StatusKey;
  statusLabel: string;
  countLabel: string;
  costLabel: string;
  productionLabel?: string;
  effects?: string[];
  limitLabel?: string;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
}

export function CardDetailsModal({ selection, onClose }: CardDetailsModalProps) {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const buildingCounts = useGameStore((s) => s.buildings);
  const techCounts = useGameStore((s) => s.techCounts);
  const purchaseBuilding = useGameStore((s) => s.purchaseBuilding);
  const purchaseTech = useGameStore((s) => s.purchaseTech);
  const productionMultiplier = useGameStore((s) => s.multipliers.population_cps);
  const tierLevel = useGameStore((s) => s.tierLevel);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!selection) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = findFocusable(dialog);
    const initialFocus = focusable[0] ?? dialog;
    initialFocus?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      if (!dialog) return;
      const nodes = findFocusable(dialog);
      if (nodes.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !nodes.includes(active ?? dialog)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose, selection]);

  const detail = useMemo<DetailContent | null>(() => {
    if (!selection) return null;

    if (selection.kind === 'building') {
      const building = getBuilding(selection.id);
      if (!building) return null;
      const count = buildingCounts[building.id] ?? 0;
      const nextCost = getBuildingCost(building, count);
      const canAfford = population >= nextCost;
      const statusKey: StatusKey = canAfford ? 'available' : 'unavailable';
      const statusLabel = t(`cards.status.${statusKey}` as const);
      const name = t(`buildings.names.${building.id}` as const, { defaultValue: building.name });
      const description = t(`buildings.descriptions.${building.id}` as const, { defaultValue: '' }).trim();
      const flavour = t(`buildings.flavour.${building.id}` as const, { defaultValue: '' }).trim();
      const perBuilding = building.baseProd * productionMultiplier;
      const totalProduction = perBuilding * count;
      const productionLabel = t('details.production.building', {
        per: formatNumber(perBuilding, { maximumFractionDigits: 2 }),
        total: formatNumber(totalProduction, { maximumFractionDigits: 2 }),
        count: formatNumber(count, { maximumFractionDigits: 0 }),
      });
      return {
        icon: `${import.meta.env.BASE_URL}assets/buildings/${building.icon}`,
        name,
        description,
        flavour,
        statusKey,
        statusLabel,
        countLabel: t('details.count.owned', { count }),
        costLabel: t('details.cost.next', {
          cost: formatNumber(nextCost, { maximumFractionDigits: 0 }),
        }),
        productionLabel,
        actionLabel: t('details.actions.buy', {
          cost: formatNumber(nextCost, { maximumFractionDigits: 0 }),
        }),
        actionDisabled: !canAfford,
        effects: undefined,
        limitLabel: undefined,
        onAction: () => purchaseBuilding(building.id),
      } satisfies DetailContent;
    }

    const tech = getTech(selection.id);
    if (!tech) return null;
    const count = techCounts[tech.id] ?? 0;
    const limit = tech.limit ?? 1;
    const isOwned = count >= limit;
    const locked = !!(tech.unlock?.tier && tierLevel < tech.unlock.tier);
    const canAfford = population >= tech.cost;
    let statusKey: StatusKey = 'available';
    if (isOwned) statusKey = 'owned';
    else if (locked) statusKey = 'locked';
    else if (!canAfford) statusKey = 'unavailable';
    const statusLabel =
      statusKey === 'locked' && tech.unlock?.tier
        ? t('cards.status.lockedTier', {
            tier: formatNumber(tech.unlock.tier, { maximumFractionDigits: 0 }),
          })
        : t(`cards.status.${statusKey}` as const);
    const name = t(`tech.names.${tech.id}` as const, { defaultValue: tech.name });
    const description = t(`tech.descriptions.${tech.id}` as const, { defaultValue: '' }).trim();
    const flavour = t(`tech.flavour.${tech.id}` as const, { defaultValue: '' }).trim();
    const effects = tech.effects.map((effect) => {
      if (effect.type === 'mult' && effect.target === 'population_cps') {
        return t('details.effects.multiplier', {
          value: formatNumber(effect.value, { maximumFractionDigits: 2 }),
        });
      }
      if (effect.type === 'add') {
        return t('details.effects.add', {
          value: formatNumber(effect.value, { maximumFractionDigits: 2 }),
          target: effect.target,
        });
      }
      return t('details.effects.generic', {
        target: effect.target,
      });
    });
    return {
      icon: `${import.meta.env.BASE_URL}assets/tech/${tech.icon}`,
      name,
      description,
      flavour,
      statusKey,
      statusLabel,
      countLabel: t('details.count.owned', { count }),
      costLabel: t('details.cost.next', {
        cost: formatNumber(tech.cost, { maximumFractionDigits: 0 }),
      }),
      productionLabel: undefined,
      effects,
      limitLabel:
        limit > 1
          ? t('details.limit', { limit: formatNumber(limit, { maximumFractionDigits: 0 }) })
          : undefined,
      actionLabel: t('details.actions.buy', {
        cost: formatNumber(tech.cost, { maximumFractionDigits: 0 }),
      }),
      actionDisabled: isOwned || locked || !canAfford,
      onAction: () => purchaseTech(tech.id),
    } satisfies DetailContent;
  }, [
    formatNumber,
    population,
    productionMultiplier,
    purchaseBuilding,
    purchaseTech,
    buildingCounts,
    techCounts,
    selection,
    t,
    tierLevel,
  ]);

  if (!selection || !detail) return null;

  const handleOverlayPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="card-detail-modal__overlay"
      role="presentation"
      onPointerDown={handleOverlayPointerDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="card-detail-modal"
        tabIndex={-1}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="card-detail-modal__header">
          <div className="card-detail-modal__media" aria-hidden="true">
            <img src={detail.icon} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="card-detail-modal__headline">
            <h2 id={titleId}>{detail.name}</h2>
            <div className="card-detail-modal__meta">
              <span className={`card-detail-modal__status card-detail-modal__status--${detail.statusKey}`}>
                {detail.statusLabel}
              </span>
              <span className="card-detail-modal__count">{detail.countLabel}</span>
              {detail.limitLabel ? (
                <span className="card-detail-modal__limit">{detail.limitLabel}</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="card-detail-modal__close"
            onClick={onClose}
            aria-label={t('details.actions.close')}
          >
            ×
          </button>
        </header>
        <section className="card-detail-modal__body">
          <p id={descriptionId} className="card-detail-modal__description">
            {detail.description || t('details.descriptionFallback')}
          </p>
          <dl className="card-detail-modal__facts">
            <div>
              <dt>{t('details.labels.cost')}</dt>
              <dd>{detail.costLabel}</dd>
            </div>
            {detail.productionLabel ? (
              <div>
                <dt>{t('details.labels.production')}</dt>
                <dd>{detail.productionLabel}</dd>
              </div>
            ) : null}
            {detail.effects && detail.effects.length > 0 ? (
              <div>
                <dt>{t('details.labels.effects')}</dt>
                <dd>
                  <ul className="card-detail-modal__effects">
                    {detail.effects.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="card-detail-modal__flavour">
            {detail.flavour || t('details.flavourFallback')}
          </p>
        </section>
        <footer className="card-detail-modal__footer">
          <button
            type="button"
            className="btn btn--primary card-detail-modal__primary"
            onClick={detail.onAction}
            disabled={detail.actionDisabled}
          >
            {detail.actionLabel}
          </button>
          <button
            type="button"
            className="btn card-detail-modal__secondary"
            onClick={onClose}
          >
            {t('details.actions.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
