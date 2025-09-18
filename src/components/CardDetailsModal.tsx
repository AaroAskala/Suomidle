import { useEffect, useId, useRef } from 'react';
import { useLocale } from '../i18n/useLocale';
import type { TechEffect } from '../content/types';

type BuildingSelection = {
  type: 'building';
  id: string;
  icon: string;
  count: number;
  nextCost: number;
  baseProduction: number;
  productionDelta: number;
  totalProduction: number;
  canAfford: boolean;
  onConfirm: () => void;
};

type TechSelection = {
  type: 'tech';
  id: string;
  icon: string;
  cost: number;
  effects: TechEffect[];
  canAfford: boolean;
  isOwned: boolean;
  limit: number;
  purchasedCount: number;
  locked: boolean;
  unlockTier?: number;
  onConfirm: () => void;
};

type PrestigeSelection = {
  type: 'prestige';
  icon: string;
  canPrestige: boolean;
  currentMultiplier: number;
  nextMultiplier: number;
  deltaMultiplier: number;
  minPopulation: number;
  onConfirm: () => void;
};

export type CardDetailSelection = BuildingSelection | TechSelection | PrestigeSelection;

interface CardDetailsModalProps {
  selection: CardDetailSelection | null;
  onClose: () => void;
}

export function CardDetailsModal({ selection, onClose }: CardDetailsModalProps) {
  const { t, formatNumber } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!selection) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selection, onClose]);

  useEffect(() => {
    if (selection) closeButtonRef.current?.focus();
  }, [selection]);

  if (!selection) return null;

  const formatEffect = (effect: TechEffect) => {
    const targetKey = `cardDetails.effects.targets.${effect.target}` as const;
    const targetLabel = t(targetKey, { defaultValue: effect.target });
    if (effect.type === 'mult') {
      const percent = (effect.value - 1) * 100;
      return t('cardDetails.effects.mult', {
        target: targetLabel,
        multiplier: formatNumber(effect.value, { maximumFractionDigits: 2 }),
        percent: formatNumber(percent, { maximumFractionDigits: 2 }),
      });
    }
    return t('cardDetails.effects.add', {
      target: targetLabel,
      value: formatNumber(effect.value, { maximumFractionDigits: 2 }),
    });
  };

  const stats: string[] = [];
  const effects: string[] = [];
  let statusMessage: string | null = null;
  let description = '';
  let flavor = '';
  let confirmLabel = '';
  let confirmDisabled = false;
  let title = '';

  if (selection.type === 'building') {
    const name = t(`buildings.names.${selection.id}` as const, {
      defaultValue: selection.id,
    });
    title = t('cardDetails.titleWithCount', { name, count: selection.count });
    stats.push(
      t('cardDetails.label.owned', { count: selection.count }),
      t('cardDetails.label.cost', {
        value: formatNumber(selection.nextCost, { maximumFractionDigits: 0 }),
      }),
      t('cardDetails.label.productionDelta', {
        value: formatNumber(selection.productionDelta, { maximumFractionDigits: 2 }),
      }),
      t('cardDetails.label.productionBase', {
        value: formatNumber(selection.baseProduction, { maximumFractionDigits: 2 }),
      }),
      t('cardDetails.label.productionTotal', {
        value: formatNumber(selection.totalProduction, { maximumFractionDigits: 2 }),
      }),
    );
    statusMessage = selection.canAfford
      ? t('cardDetails.status.available')
      : t('cardDetails.building.notEnough');
    description = t(`buildings.descriptions.${selection.id}` as const, {
      defaultValue: '',
    });
    flavor = t(`buildings.flavor.${selection.id}` as const, {
      defaultValue: '',
    });
    confirmLabel = t('cardDetails.actions.buy');
    confirmDisabled = !selection.canAfford;
  } else if (selection.type === 'tech') {
    const name = t(`tech.names.${selection.id}` as const, {
      defaultValue: selection.id,
    });
    title = name;
    stats.push(
      t('cardDetails.label.cost', {
        value: formatNumber(selection.cost, { maximumFractionDigits: 0 }),
      }),
    );
    if (selection.limit > 0) {
      stats.push(t('cardDetails.label.limit', { limit: selection.limit }));
      const remaining = Math.max(0, selection.limit - selection.purchasedCount);
      if (selection.limit > 1) {
        stats.push(t('cardDetails.label.remaining', { remaining }));
      }
    }
    statusMessage = selection.isOwned
      ? t('cardDetails.tech.alreadyOwned')
      : selection.locked
        ? selection.unlockTier
          ? t('cardDetails.status.lockedTier', { tier: selection.unlockTier })
          : t('cardDetails.status.locked')
        : selection.canAfford
          ? t('cardDetails.status.available')
          : t('cardDetails.tech.notEnough');
    description = t(`tech.descriptions.${selection.id}` as const, {
      defaultValue: '',
    });
    flavor = t(`tech.flavor.${selection.id}` as const, {
      defaultValue: '',
    });
    effects.push(...selection.effects.map((effect) => formatEffect(effect)));
    confirmLabel = t('cardDetails.actions.unlock');
    confirmDisabled = selection.isOwned || selection.locked || !selection.canAfford;
  } else {
    title = t('prestige.action', { defaultValue: 'Burn sauna' });
    stats.push(
      t('cardDetails.prestige.current', {
        value: formatNumber(selection.currentMultiplier, { maximumFractionDigits: 2 }),
      }),
      t('cardDetails.prestige.next', {
        value: formatNumber(selection.nextMultiplier, { maximumFractionDigits: 2 }),
      }),
      t('cardDetails.prestige.gain', {
        value: formatNumber(selection.deltaMultiplier * 100, {
          maximumFractionDigits: 2,
        }),
      }),
      t('cardDetails.prestige.requirement', {
        value: formatNumber(selection.minPopulation, { maximumFractionDigits: 0 }),
      }),
    );
    statusMessage = selection.canPrestige
      ? t('cardDetails.status.available')
      : t('cardDetails.prestige.unavailable');
    description = t('cardDetails.prestige.warning');
    flavor = t('prestige.flavor', { defaultValue: '' });
    confirmLabel = t('cardDetails.actions.prestige');
    confirmDisabled = !selection.canPrestige;
  }

  const hasDescription = description.trim().length > 0;
  const hasFlavor = flavor.trim().length > 0;
  const hasEffects = effects.length > 0;

  const handleConfirm = () => {
    if (confirmDisabled) return;
    selection.onConfirm();
  };

  return (
    <div
      className="card-details__overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="card-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasDescription ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="card-details__header">
          <span className="card-details__media" aria-hidden="true">
            <img src={selection.icon} alt="" loading="lazy" decoding="async" />
          </span>
          <div className="card-details__titles">
            <h2 id={titleId}>{title}</h2>
            {statusMessage && <p className="card-details__status">{statusMessage}</p>}
          </div>
        </div>
        <div className="card-details__body">
          {hasDescription && (
            <section className="card-details__section" id={descriptionId}>
              <h3>{t('cardDetails.section.description')}</h3>
              <p>{description}</p>
            </section>
          )}
          {stats.length > 0 && (
            <section className="card-details__section">
              <h3>{t('cardDetails.section.stats')}</h3>
              <ul>
                {stats.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {hasEffects && (
            <section className="card-details__section">
              <h3>{t('cardDetails.section.effects')}</h3>
              <ul>
                {effects.map((effect, index) => (
                  <li key={`${index}-${effect}`}>{effect}</li>
                ))}
              </ul>
            </section>
          )}
          {hasFlavor && (
            <section className="card-details__section card-details__section--flavor">
              <h3>{t('cardDetails.section.flavor')}</h3>
              <p>{flavor}</p>
            </section>
          )}
        </div>
        <div className="card-details__footer">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            ref={closeButtonRef}
          >
            {t('cardDetails.actions.close')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
