import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import {
  useGameStore,
  computeDevTierPopulationMultiplier,
  MAAILMA_BUFF_REWARD_PREFIX,
} from '../app/store';
import { computeCpsBase, computeTierBonusMultiplier } from '../app/cpsUtils';
import { useLocale } from '../i18n/useLocale';
import { getTemperatureGainMultiplier } from '../systems/dailyTasks';

interface MultiplierEntry {
  id: string;
  label: string;
  value: number;
}

const sanitizeMultiplier = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value;
};

export function CpsMultiplierTooltip() {
  const { t, formatNumber } = useLocale();
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const buildingCounts = useGameStore((state) => state.buildings);
  const tierLevel = useGameStore((state) => state.tierLevel);
  const prestigeMult = useGameStore((state) => state.prestigeMult);
  const eraMult = useGameStore((state) => state.eraMult);
  const cps = useGameStore((state) => state.cps);
  const permanent = useGameStore((state) => state.modifiers.permanent);
  const techMultiplierBase = useGameStore((state) => state.multipliers.population_cps);
  const dailyTasks = useGameStore((state) => state.dailyTasks);

  const baseProduction = useMemo(
    () => sanitizeMultiplier(computeCpsBase(buildingCounts)),
    [buildingCounts],
  );

  const baseProdMult = sanitizeMultiplier(permanent.baseProdMult);
  const techMultiplier = sanitizeMultiplier(techMultiplierBase);
  const techBonusMultiplier = sanitizeMultiplier(1 + permanent.techMultiplierBonusAdd);
  const spentBonusMultiplier = sanitizeMultiplier(1 + permanent.globalCpsAddFromTuhkaSpent);
  const tierBonusMultiplier = useMemo(
    () => sanitizeMultiplier(computeTierBonusMultiplier(tierLevel, permanent.perTierGlobalCpsAdd)),
    [permanent.perTierGlobalCpsAdd, tierLevel],
  );
  const devTierMultiplier = sanitizeMultiplier(computeDevTierPopulationMultiplier(tierLevel));
  const prestigeMultiplier = sanitizeMultiplier(
    Math.max(prestigeMult, permanent.saunaPrestigeBaseMultiplierMin),
  );
  const eraMultiplier = sanitizeMultiplier(eraMult);
  const { totalTemperatureMultiplier, maailmaTemperatureMultiplier, taskBuffMultiplier } = useMemo(() => {
    const total = sanitizeMultiplier(getTemperatureGainMultiplier(dailyTasks));
    const buffs = Array.isArray(dailyTasks.activeBuffs) ? dailyTasks.activeBuffs : [];
    let maailmaMultiplier = 1;
    for (const buff of buffs) {
      if (
        typeof buff.rewardId === 'string' &&
        buff.rewardId.startsWith(MAAILMA_BUFF_REWARD_PREFIX)
      ) {
        const factor = sanitizeMultiplier(1 + buff.value);
        if (factor > 0) {
          maailmaMultiplier *= factor;
        }
      }
    }
    maailmaMultiplier = sanitizeMultiplier(maailmaMultiplier);
    const tasksMultiplier =
      maailmaMultiplier > 0 ? sanitizeMultiplier(total / maailmaMultiplier) : total;
    return {
      totalTemperatureMultiplier: total,
      maailmaTemperatureMultiplier: maailmaMultiplier,
      taskBuffMultiplier: tasksMultiplier,
    };
  }, [dailyTasks]);
  const effectiveCps = sanitizeMultiplier(cps * totalTemperatureMultiplier);

  const entries = useMemo<MultiplierEntry[]>(() => {
    const data: MultiplierEntry[] = [
      { id: 'baseProduction', label: t('hud.cpsMultipliers.entry.baseProduction'), value: baseProdMult },
      { id: 'tech', label: t('hud.cpsMultipliers.entry.tech'), value: techMultiplier },
      { id: 'techBonus', label: t('hud.cpsMultipliers.entry.techBonus'), value: techBonusMultiplier },
      { id: 'ash', label: t('hud.cpsMultipliers.entry.ash'), value: spentBonusMultiplier },
      { id: 'tier', label: t('hud.cpsMultipliers.entry.tier'), value: tierBonusMultiplier },
      { id: 'prestige', label: t('hud.cpsMultipliers.entry.prestige'), value: prestigeMultiplier },
      { id: 'era', label: t('hud.cpsMultipliers.entry.era'), value: eraMultiplier },
      { id: 'devTier', label: t('hud.cpsMultipliers.entry.devTier'), value: devTierMultiplier },
      { id: 'dailyTasks', label: t('hud.cpsMultipliers.entry.dailyTasks'), value: taskBuffMultiplier },
      {
        id: 'maailmaTemperature',
        label: t('hud.cpsMultipliers.entry.maailmaTemperature'),
        value: maailmaTemperatureMultiplier,
      },
    ];
    return data
      .map((entry) => ({ ...entry, value: sanitizeMultiplier(entry.value) }))
      .filter((entry) => {
        if (entry.id === 'devTier') return entry.value !== 1;
        if (entry.id === 'maailmaTemperature') return entry.value !== 1;
        return true;
      });
  }, [
    baseProdMult,
    taskBuffMultiplier,
    maailmaTemperatureMultiplier,
    devTierMultiplier,
    eraMultiplier,
    prestigeMultiplier,
    spentBonusMultiplier,
    t,
    techBonusMultiplier,
    techMultiplier,
    tierBonusMultiplier,
  ]);

  const productMultiplier = entries.reduce((acc, entry) => acc * entry.value, 1);
  const ratioMultiplier = baseProduction > 0 ? effectiveCps / baseProduction : productMultiplier;
  const totalMultiplier = sanitizeMultiplier(
    Number.isFinite(ratioMultiplier) && ratioMultiplier > 0 ? ratioMultiplier : productMultiplier,
  );

  useEffect(() => {
    if (!open) return undefined;
    if (typeof window === 'undefined') return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!containerRef.current || !target) return;
      if (!containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleToggle = () => {
    setOpen((previous) => !previous);
  };

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) {
      return;
    }
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
  };

  const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) {
      return;
    }
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const ariaControls = open ? tooltipId : undefined;

  return (
    <div
      className="hud__cps-multipliers"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="hud__cps-multipliers-button"
        aria-label={t('hud.cpsMultipliers.label')}
        aria-expanded={open}
        aria-controls={ariaControls}
        aria-haspopup="dialog"
        onClick={handleToggle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden="true" className="hud__cps-multipliers-icon">
          ▲
        </span>
      </button>
      {open ? (
        <div className="hud__cps-multipliers-content" id={tooltipId} role="dialog" aria-modal="false">
          <div className="hud__cps-multipliers-header">
            {t('hud.cpsMultipliers.base', {
              value: formatNumber(baseProduction, { maximumFractionDigits: 2 }),
            })}
          </div>
          <ul className="hud__cps-multipliers-list">
            {entries.map((entry) => (
              <li key={entry.id} className="hud__cps-multipliers-item">
                <span className="hud__cps-multipliers-item-label">{entry.label}</span>
                <span className="hud__cps-multipliers-item-value">
                  ×{formatNumber(entry.value, { maximumFractionDigits: 3 })}
                </span>
              </li>
            ))}
          </ul>
          <div className="hud__cps-multipliers-footer">
            <div>
              {t('hud.cpsMultipliers.total', {
                value: formatNumber(totalMultiplier, { maximumFractionDigits: 3 }),
              })}
            </div>
            <div>
              {t('hud.cpsMultipliers.effective', {
                value: formatNumber(effectiveCps, { maximumFractionDigits: 2 }),
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
