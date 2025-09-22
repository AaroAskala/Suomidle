import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useGameStore } from '../app/store';
import { useLocale } from '../i18n/useLocale';
import { getTemperatureGainMultiplier } from '../systems/dailyTasks';
import { playSplashSound } from '../audio/splash';
import { CpsMultiplierTooltip } from './CpsMultiplierTooltip';

type Splash = {
  id: number;
  offsetX: number;
  scale: number;
};

type SplashStyle = CSSProperties & {
  '--splash-offset-x'?: string;
  '--splash-scale'?: string;
  '--splash-scale-start'?: string;
};

const SPLASH_DURATION_MS = 600; // Keep in sync with the hudSplash animation duration.
const MAX_ACTIVE_SPLASHES = 4;

export function HUD() {
  const { t, formatNumber } = useLocale();
  const population = useGameStore((s) => s.population);
  const addPopulation = useGameStore((s) => s.addPopulation);
  const click = useGameStore((s) => s.clickPower);
  const cps = useGameStore((s) => s.cps);
  const dailyTasks = useGameStore((s) => s.dailyTasks);
  const lpsMultiplier = getTemperatureGainMultiplier(dailyTasks);
  const effectiveCps = cps * lpsMultiplier;
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const splashIdRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mediaQuery.matches;
    const updatePreference = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => {
        mediaQuery.removeEventListener('change', updatePreference);
      };
    }
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updatePreference);
      return () => {
        mediaQuery.removeListener(updatePreference);
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }
      timeoutsRef.current = [];
    };
  }, []);

  const handleThrow = useCallback(() => {
    addPopulation(click);
    if (!prefersReducedMotionRef.current) {
      const splashId = splashIdRef.current;
      splashIdRef.current += 1;
      const splash: Splash = {
        id: splashId,
        offsetX: (Math.random() - 0.5) * 24,
        scale: 0.75 + Math.random() * 0.35,
      };
      setSplashes((previous) => {
        const trimmed = previous.slice(-MAX_ACTIVE_SPLASHES + 1);
        return [...trimmed, splash];
      });
      const timeoutId = window.setTimeout(() => {
        setSplashes((previous) => previous.filter((item) => item.id !== splashId));
        timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeoutId);
      }, SPLASH_DURATION_MS);
      timeoutsRef.current.push(timeoutId);
    }
    // Fire-and-forget audio playback so the click remains responsive.
    void playSplashSound();
  }, [addPopulation, click]);
  return (
    <div>
      <div className="hud hud__population">
        <span>
          {t('hud.temperature', {
            value: formatNumber(population, { maximumFractionDigits: 0 }),
          })}
        </span>
        <span> | </span>
        <span className="hud__cps-display">
          <span>{t('hud.cps', { value: formatNumber(effectiveCps, { maximumFractionDigits: 2 }) })}</span>
          <CpsMultiplierTooltip />
        </span>
      </div>
      <button
        className="btn btn--primary hud__throw-button"
        onClick={handleThrow}
        aria-label={t('hud.throw')}
      >
        <span className="hud__throw-label">{t('hud.throw')}</span>
        <span className="hud__splash-container" aria-hidden="true">
          {splashes.map((splash) => {
            const style: SplashStyle = {
              '--splash-offset-x': `${splash.offsetX.toFixed(1)}px`,
              '--splash-scale': splash.scale.toFixed(3),
              '--splash-scale-start': (splash.scale * 0.55).toFixed(3),
            };
            return <span key={splash.id} className="hud__splash" style={style} />;
          })}
        </span>
      </button>
    </div>
  );
}
