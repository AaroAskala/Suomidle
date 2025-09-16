import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { useGameStore } from '../app/store';
import shopData from '../data/maailma_shop.json' assert { type: 'json' };
import { formatNumber } from '../utils/format';

const { currency, shop: shopItems } = shopData;
const currencyLabel = currency.short_fi ?? currency.name_fi;

interface Ember {
  id: number;
  x: number;
  y: number;
  scale: number;
  drift: number;
  rise: number;
  duration: number;
}

type EmberStyle = CSSProperties & {
  '--maailma-ember-scale'?: string;
  '--maailma-ember-rise'?: string;
  '--maailma-ember-drift'?: string;
};

const STACK_MODE_LABELS = {
  add: 'Additiivinen',
  mult: 'Kertautuva',
} as const;

const STACK_MODE_TOOLTIPS = {
  add: 'Bonukset summataan yhteen jokaisella tasolla.',
  mult: 'Bonukset kertautuvat keskenään jokaisella tasolla.',
} as const satisfies Record<keyof typeof STACK_MODE_LABELS, string>;

const formatDecimalString = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  const safe = Math.max(0, value);
  const fixed = safe.toFixed(6);
  const trimmed = fixed.replace(/\.0+$/, '').replace(/\.([0-9]*?)0+$/, '.$1');
  const cleaned = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  return cleaned.length > 0 ? cleaned : '0';
};

const formatDecimalNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

const getNextCost = (item: (typeof shopItems)[number], level: number) => {
  if (item.cost_tuhka.length === 0 || level >= item.max_level) {
    return undefined;
  }
  const index = Math.min(level, item.cost_tuhka.length - 1);
  return item.cost_tuhka[index];
};

export function MaailmaShop() {
  const tuhkaString = useGameStore((state) => state.maailma.tuhka);
  const purchaseHistory = useGameStore((state) => state.maailma.purchases);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [embers, setEmbers] = useState<Ember[]>([]);
  const emberTimeouts = useRef<number[]>([]);

  useEffect(() => () => {
    emberTimeouts.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    emberTimeouts.current = [];
  }, []);

  const tuhkaValue = useMemo(() => {
    const numeric = Number.parseFloat(tuhkaString);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [tuhkaString]);

  const purchaseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of purchaseHistory) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [purchaseHistory]);

  const spawnEmber = (centerX: number, centerY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ember: Ember = {
      id: Date.now() + Math.random(),
      x: centerX - rect.left,
      y: centerY - rect.top,
      scale: 0.85 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 40,
      rise: 48 + Math.random() * 36,
      duration: 750 + Math.random() * 450,
    };
    setEmbers((prev) => [...prev, ember]);
    const timeoutId = window.setTimeout(() => {
      setEmbers((prev) => prev.filter((item) => item.id !== ember.id));
      emberTimeouts.current = emberTimeouts.current.filter((id) => id !== timeoutId);
    }, ember.duration);
    emberTimeouts.current.push(timeoutId);
  };

  const attemptPurchase = (event: MouseEvent<HTMLButtonElement>, item: (typeof shopItems)[number]) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;

    let purchased = false;
    useGameStore.setState((state) => {
      const { maailma } = state;
      const numericTuhka = Number.parseFloat(maailma.tuhka);
      if (!Number.isFinite(numericTuhka)) return {};
      const level = maailma.purchases.filter((id) => id === item.id).length;
      if (level >= item.max_level) return {};
      const nextCost = getNextCost(item, level);
      if (nextCost === undefined || numericTuhka < nextCost) return {};
      purchased = true;
      return {
        maailma: {
          ...maailma,
          tuhka: formatDecimalString(numericTuhka - nextCost),
          purchases: [...maailma.purchases, item.id],
        },
      };
    });

    if (purchased) {
      spawnEmber(centerX, centerY);
    }
  };

  return (
    <div className="maailma-shop" ref={containerRef}>
      <div className="maailma-shop__header">
        <h2 className="maailma-shop__title text--h2">Maailman kauppa</h2>
        <div
          className="maailma-shop__balance"
          title={currency.accrual_formula_fi || undefined}
        >
          {currencyLabel}:&nbsp;
          <span className="maailma-shop__balance-value">{formatNumber(tuhkaValue)}</span>
        </div>
      </div>
      <table className="maailma-shop__table">
        <thead>
          <tr>
            <th scope="col">Parannus</th>
            <th scope="col">Taso</th>
            <th scope="col">Seuraava hinta</th>
            <th scope="col" className="maailma-shop__action-header">
              Toiminto
            </th>
          </tr>
        </thead>
        <tbody>
          {shopItems.map((item) => {
            const level = purchaseCounts.get(item.id) ?? 0;
            const nextCost = getNextCost(item, level);
            const maxed = level >= item.max_level;
            const affordable = nextCost !== undefined && tuhkaValue >= nextCost;
            const disabled = maxed || !affordable;
            const stackMode = item.effect.stack_mode;
            const stackLabel =
              stackMode === 'add'
                ? STACK_MODE_LABELS.add
                : stackMode === 'mult'
                  ? STACK_MODE_LABELS.mult
                  : undefined;
            const stackTooltip =
              stackMode === 'add'
                ? STACK_MODE_TOOLTIPS.add
                : stackMode === 'mult'
                  ? STACK_MODE_TOOLTIPS.mult
                  : undefined;
            const floorValue =
              typeof item.effect.floor === 'number' ? item.effect.floor : undefined;
            const buttonTitle = maxed
              ? 'Maksimitaso saavutettu'
              : affordable
                ? 'Osta seuraava taso'
                : 'Ei tarpeeksi Tuhkaa';

            return (
              <tr
                key={item.id}
                className={`maailma-shop__row${maxed ? ' maailma-shop__row--maxed' : ''}`}
              >
                <td className="maailma-shop__item">
                  <div className="maailma-shop__name">{item.name_fi}</div>
                  <div className="maailma-shop__description">{item.description_fi}</div>
                  {(stackLabel || floorValue !== undefined) && (
                    <div className="maailma-shop__meta">
                      {stackLabel && (
                        <span className="maailma-shop__tooltip" title={stackTooltip}>
                          Pinoutuminen: {stackLabel}
                        </span>
                      )}
                      {floorValue !== undefined && (
                        <span
                          className="maailma-shop__tooltip"
                          title={`Vaikutus ei voi laskea arvoa alle ${formatDecimalNumber(floorValue)}.`}
                        >
                          Lattia: {formatDecimalNumber(floorValue)}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="maailma-shop__level">
                  <span className="maailma-shop__level-current">{level}</span>
                  <span className="maailma-shop__level-divider">/</span>
                  <span className="maailma-shop__level-max">{item.max_level}</span>
                </td>
                <td className="maailma-shop__cost">
                  {nextCost !== undefined ? (
                    <>
                      {formatNumber(nextCost)}
                      <span className="maailma-shop__currency"> {currencyLabel}</span>
                    </>
                  ) : (
                    <span className="maailma-shop__cost--maxed">—</span>
                  )}
                </td>
                <td className="maailma-shop__action">
                  <button
                    type="button"
                    className="btn btn--primary maailma-shop__buy"
                    disabled={disabled}
                    title={buttonTitle}
                    onClick={(event) => attemptPurchase(event, item)}
                  >
                    {maxed ? 'Maksimi' : 'Osta'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="maailma-shop__embers" aria-hidden="true">
        {embers.map((ember) => (
          <span
            key={ember.id}
            className="maailma-shop__ember"
            style={
              {
                left: `${ember.x}px`,
                top: `${ember.y}px`,
                animationDuration: `${ember.duration}ms`,
                '--maailma-ember-scale': `${ember.scale}`,
                '--maailma-ember-rise': `${ember.rise}px`,
                '--maailma-ember-drift': `${ember.drift}px`,
              } as EmberStyle
            }
          />
        ))}
      </div>
    </div>
  );
}
