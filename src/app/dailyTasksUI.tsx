import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import {
  dailyTaskConfig,
  getTaskStatus,
  type ActiveBuffState,
  type DailyTaskDefinition,
  type DailyTaskRuntimeState,
  type DailyTaskStatus,
} from './dailyTasks';
import { useGameStore } from './store';
import { formatNumber } from '../utils/format';

type ToastTone = 'info' | 'success' | 'warning';

interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
  expiresAt: number;
}

type ToastProducer = (text: string, tone?: ToastTone) => void;

const uiText = dailyTaskConfig.ui_texts_fi;

const taskDefinitionById = new Map<string, DailyTaskDefinition>(
  dailyTaskConfig.tasks.map((task) => [task.id, task]),
);

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const timeParts = [
    hours > 0 ? String(hours) : null,
    hours > 0 ? String(minutes).padStart(2, '0') : String(minutes),
    String(seconds).padStart(2, '0'),
  ].filter((part): part is string => part !== null);
  return timeParts.join(':');
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: value < 0.1 ? 1 : 0,
    maximumFractionDigits: value < 0.1 ? 1 : 0,
  }).format(value);

const useTaskStatuses = (daily: DailyTaskRuntimeState): DailyTaskStatus[] =>
  useMemo(
    () =>
      daily.activeTaskIds
        .map((taskId) => getTaskStatus(daily, taskId))
        .filter((status): status is DailyTaskStatus => status !== null),
    [daily],
  );

const useToasts = (): [ToastMessage[], ToastProducer] => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback<ToastProducer>((text, tone = 'info') => {
    setToasts((prev) => {
      const now = Date.now();
      const toast: ToastMessage = {
        id: now + Math.random(),
        text,
        tone,
        expiresAt: now + 5000,
      };
      return [...prev, toast];
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToasts((prev) => prev.filter((toast) => toast.expiresAt > Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return [toasts, addToast];
};

const computeResetCountdown = (now: number) => {
  const zoned = DateTime.fromMillis(now, { zone: dailyTaskConfig.reset_timezone });
  const start = zoned.startOf('day');
  const next = start.plus({ days: 1 });
  return Math.max(0, next.toMillis() - now);
};

const getBuffTaskTitle = (buff: ActiveBuffState) =>
  taskDefinitionById.get(buff.sourceTaskId)?.title_fi ?? buff.sourceTaskId;

interface DailyTaskCardProps {
  status: DailyTaskStatus;
  onClaim: (taskId: string) => void;
}

const DailyTaskCard = ({ status, onClaim }: DailyTaskCardProps) => {
  const { definition, completed, claimed, target, progress } = status;
  const effectiveTarget = target > 0 ? target : Math.max(progress, 1);
  const cappedProgress = Math.min(progress, effectiveTarget);
  const percent = effectiveTarget > 0 ? Math.min(100, (cappedProgress / effectiveTarget) * 100) : 0;
  const canClaim = completed && !claimed;

  return (
    <article
      className={`daily-task-card${completed ? ' daily-task-card--completed' : ''}${
        claimed ? ' daily-task-card--claimed' : ''
      }`}
    >
      <header className="daily-task-card__header">
        <h3 className="daily-task-card__title">{definition.title_fi}</h3>
        <p className="daily-task-card__description">{definition.desc_fi}</p>
      </header>
      <div className="daily-task-card__progress">
        <label className="daily-task-card__progress-label">
          {uiText.progress}: {formatNumber(cappedProgress)} {uiText.of} {formatNumber(effectiveTarget)}
        </label>
        <progress className="daily-task-card__progress-bar" max={effectiveTarget} value={cappedProgress}>
          {percent.toFixed(0)}%
        </progress>
      </div>
      <footer className="daily-task-card__footer">
        {claimed ? (
          <span className="daily-task-card__badge daily-task-card__badge--claimed">
            {uiText.claim_reward}
          </span>
        ) : canClaim ? (
          <button
            type="button"
            className="btn btn--primary daily-task-card__claim"
            onClick={() => onClaim(status.id)}
          >
            {uiText.claim_reward}
          </button>
        ) : completed ? (
          <span className="daily-task-card__badge daily-task-card__badge--completed">
            {uiText.completed}
          </span>
        ) : null}
      </footer>
    </article>
  );
};

interface BuffListProps {
  buffs: ActiveBuffState[];
  now: number;
}

const ActiveBuffList = ({ buffs, now }: BuffListProps) => {
  if (buffs.length === 0) {
    return null;
  }
  return (
    <div className="daily-task-buffs">
      <h4 className="daily-task-buffs__title">{uiText.reward_active}</h4>
      <ul className="daily-task-buffs__list">
        {buffs.map((buff) => {
          const remaining = Math.max(0, buff.expiresAt - now);
          return (
            <li key={buff.id} className="daily-task-buffs__item">
              <span className="daily-task-buffs__name">{getBuffTaskTitle(buff)}</span>
              <span className="daily-task-buffs__value">{formatPercent(buff.value)}</span>
              <span className="daily-task-buffs__timer">{formatDuration(remaining)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export function DailyTasksPanel() {
  const daily = useGameStore((state) => state.daily);
  const claimReward = useGameStore((state) => state.claimDailyTaskReward);
  const [now, setNow] = useState(() => Date.now());
  const [toasts, pushToast] = useToasts();
  const handleClaim = useCallback(
    (taskId: string) => {
      try {
        claimReward(taskId);
      } catch (error) {
        console.error('Failed to claim daily task reward', error);
        pushToast(`${uiText.claim_reward}: ${taskId}`, 'warning');
      }
    },
    [claimReward, pushToast],
  );
  const tasks = useTaskStatuses(daily);
  const resetCountdown = useMemo(() => computeResetCountdown(now), [now]);
  const activeBuffs = useMemo(
    () =>
      Object.values(daily.activeBuffs)
        .slice()
        .sort((a, b) => a.expiresAt - b.expiresAt),
    [daily.activeBuffs],
  );

  const previousCompleted = useRef<Set<string>>(new Set());
  const previousClaimed = useRef<Set<string>>(new Set());
  const previousBuffIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const completedNow = new Set(tasks.filter((task) => task.completed).map((task) => task.id));
    const claimedNow = new Set(tasks.filter((task) => task.claimed).map((task) => task.id));
    const activeBuffIds = new Set(Object.keys(daily.activeBuffs));

    if (!initialized.current) {
      previousCompleted.current = completedNow;
      previousClaimed.current = claimedNow;
      previousBuffIds.current = activeBuffIds;
      initialized.current = true;
      return;
    }

    for (const task of tasks) {
      if (task.completed && !previousCompleted.current.has(task.id)) {
        pushToast(`${task.definition.title_fi} – ${uiText.completed}`, 'info');
      }
      if (task.claimed && !previousClaimed.current.has(task.id)) {
        pushToast(`${task.definition.title_fi} – ${uiText.claim_reward}`, 'success');
      }
    }

    for (const buffId of activeBuffIds) {
      if (!previousBuffIds.current.has(buffId)) {
        const title = taskDefinitionById.get(buffId)?.title_fi ?? buffId;
        pushToast(`${title} – ${uiText.reward_active}`, 'success');
      }
    }

    for (const buffId of previousBuffIds.current) {
      if (!activeBuffIds.has(buffId)) {
        const title = taskDefinitionById.get(buffId)?.title_fi ?? buffId;
        pushToast(`${title} – ${uiText.reward_expired}`, 'warning');
      }
    }

    previousCompleted.current = completedNow;
    previousClaimed.current = claimedNow;
    previousBuffIds.current = activeBuffIds;
  }, [tasks, daily.activeBuffs, pushToast]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="daily-tasks-panel" aria-label={uiText.daily_tasks_title}>
      <header className="daily-tasks-panel__header">
        <h2 className="daily-tasks-panel__title">{uiText.daily_tasks_title}</h2>
        <div className="daily-tasks-panel__timer">
          {uiText.resets_in}: {formatDuration(resetCountdown)}
        </div>
      </header>
      <ActiveBuffList buffs={activeBuffs} now={now} />
      <div className="daily-tasks-panel__list">
        {tasks.map((task) => (
          <DailyTaskCard key={task.id} status={task} onClaim={handleClaim} />
        ))}
      </div>
      {toasts.length > 0 && (
        <div className="daily-tasks-toasts" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`daily-tasks-toast daily-tasks-toast--${toast.tone}`}>
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default DailyTasksPanel;
