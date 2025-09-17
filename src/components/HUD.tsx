import { useMemo } from 'react';
import { useGameStore } from '../app/store';
import { getTier, prestige as prestigeData } from '../content';
import { formatDuration, formatNumber } from '../utils/format';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  description: string;
}

function ProgressBar({ label, value, max, color, description }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const ratio = Math.min(Math.max(safeValue / safeMax, 0), 1);

  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__label">{label}</span>
        <span className="progress-bar__description">{description}</span>
      </div>
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div className="progress-bar__fill" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function HUD() {
  const population = useGameStore((s) => s.population);
  const totalPopulation = useGameStore((s) => s.totalPopulation);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  const tierLevel = useGameStore((s) => s.tierLevel);
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const prestigePoints = useGameStore((s) => s.prestigePoints);
  const tierOffset = useGameStore((s) => Math.trunc(s.modifiers.permanent.tierUnlockOffset ?? 0));

  const {
    currentTier,
    nextTier,
    nextThreshold,
    progressValue,
    progressMax,
    remainingToNextTier,
    timeToNextTier,
  } = useMemo(() => {
    const baseTier = getTier(tierLevel);
    const targetTier = Math.max(1, tierLevel + 1 + tierOffset);
    const upcomingTier = getTier(targetTier);
    const previousThreshold = baseTier?.population ?? 0;
    const nextThreshold = upcomingTier?.population ?? previousThreshold;
    const value = Math.max(0, population - previousThreshold);
    const max = Math.max(1, nextThreshold - previousThreshold);
    const remaining = Math.max(0, nextThreshold - population);
    const eta = cps > 0 && remaining > 0 ? formatDuration(remaining / cps) : null;
    return {
      currentTier: baseTier,
      nextTier: upcomingTier,
      nextThreshold,
      progressValue: value,
      progressMax: max,
      remainingToNextTier: remaining,
      timeToNextTier: eta,
    };
  }, [cps, population, tierLevel, tierOffset]);

  const prestigeGoal = prestigeData.minPopulation;
  const prestigeProgress = Math.min(totalPopulation, prestigeGoal);

  return (
    <header className="game-header">
      <div className="game-header__inner">
        <div className="game-header__summary">
          <div className="game-header__tier">
            <span className="game-header__tier-label">Tier {tierLevel}</span>
            <span className="game-header__tier-name">{currentTier?.name ?? 'Tuntematon'}</span>
          </div>
          <div className="game-header__prestige">
            <span className="game-header__prestige-mult">Prestige: {formatNumber(prestigeMult)}×</span>
            <span className="game-header__prestige-points">Pisteet: {formatNumber(prestigePoints)}</span>
          </div>
        </div>
        <div className="game-header__bars">
          <ProgressBar
            label="Lämpötila"
            value={progressValue}
            max={progressMax}
            color="#38bdf8"
            description={`${formatNumber(Math.max(population, 0))} / ${formatNumber(nextThreshold)}`}
          />
          <ProgressBar
            label="LPS"
            value={Math.max(cps, 0)}
            max={progressMax}
            color="#f97316"
            description={`${formatNumber(cps)} / ${formatNumber(progressMax)} (tavoite)`}
          />
          <ProgressBar
            label="Prestige-valmius"
            value={prestigeProgress}
            max={prestigeGoal}
            color="#a855f7"
            description={`${formatNumber(totalPopulation)} / ${formatNumber(prestigeGoal)}`}
          />
        </div>
        <div className="game-header__meta">
          {nextTier ? (
            <div className="game-header__meta-item">
              <span className="game-header__meta-label">Seuraava tier</span>
              <span className="game-header__meta-value">
                {nextTier.name} · {formatNumber(nextTier.population)} lämpöä
              </span>
            </div>
          ) : (
            <div className="game-header__meta-item">
              <span className="game-header__meta-label">Seuraava tier</span>
              <span className="game-header__meta-value">Maksimitaso saavutettu</span>
            </div>
          )}
          {timeToNextTier ? (
            <div className="game-header__meta-item">
              <span className="game-header__meta-label">Arvioitu aika</span>
              <span className="game-header__meta-value">{timeToNextTier}</span>
            </div>
          ) : null}
          <div className="game-header__meta-item">
            <span className="game-header__meta-label">Puuttuu</span>
            <span className="game-header__meta-value">{formatNumber(remainingToNextTier)}</span>
          </div>
        </div>
        <div className="game-header__actions">
          <button
            className="btn btn--primary game-header__action-button"
            onClick={() => addPopulation(click)}
          >
            Heitä löylyä!
          </button>
          <div className="game-header__action-meta">
            <span>+{formatNumber(click)} lämpöä / klikkaus</span>
            <span>{formatNumber(cps)} LPS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
