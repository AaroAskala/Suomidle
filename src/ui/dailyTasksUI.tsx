import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import {
  dailyTasksConfig,
  dailyTaskEventTarget,
  DAILY_TASK_TOAST_EVENT,
  type DailyTaskToastDetail,
  getDailyTaskDefinition,
  getTaskTarget,
} from '../systems/dailyTasks';
import { formatNumber } from '../utils/format';
import './dailyTasks.css';

const formatTime = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const segments = [minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')];
  if (hours > 0) {
    segments.unshift(hours.toString().padStart(2, '0'));
  }
  return segments.join(':');
};

interface ToastState {
  id: number;
  message: string;
}

export function DailyTasksPanel() {
  const dailyTasks = useGameStore((state) => state.dailyTasks);
  const claimReward = useGameStore((state) => state.claimDailyTaskReward);
  const uiTexts = dailyTasksConfig.ui_texts_fi;
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let toastTimer: number | undefined;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<DailyTaskToastDetail>;
      const detail = custom.detail;
      if (!detail) return;
      let message = detail.taskTitle;
      if (detail.type === 'complete') {
        message = `${detail.taskTitle} · ${uiTexts.completed}`;
      } else if (detail.type === 'claim') {
        const pct = detail.rewardValue !== undefined ? Math.round(detail.rewardValue * 100) : null;
        const duration =
          detail.rewardDuration !== undefined ? formatTime(detail.rewardDuration) : undefined;
        const suffix = [uiTexts.reward_active, pct !== null ? `+${pct}%` : null, duration]
          .filter(Boolean)
          .join(' · ');
        message = `${detail.taskTitle} · ${suffix}`;
      } else if (detail.type === 'buff_expired') {
        message = `${detail.taskTitle} · ${uiTexts.reward_expired}`;
      }
      if (toastTimer !== undefined) window.clearTimeout(toastTimer);
      setToast({ id: Date.now(), message });
      toastTimer = window.setTimeout(() => setToast(null), 4000);
    };
    dailyTaskEventTarget.addEventListener(DAILY_TASK_TOAST_EVENT, handler);
    return () => {
      if (toastTimer !== undefined) window.clearTimeout(toastTimer);
      dailyTaskEventTarget.removeEventListener(DAILY_TASK_TOAST_EVENT, handler);
    };
  }, [uiTexts.completed, uiTexts.reward_active, uiTexts.reward_expired]);

  const taskViews = useMemo(() => {
    return dailyTasks.taskOrder
      .map((taskId) => {
        const definition = getDailyTaskDefinition(taskId);
        const state = dailyTasks.tasks[taskId];
        if (!definition || !state) return null;
        const target = getTaskTarget(definition);
        const progress = state.progress;
        const progressRatio = target > 0 ? Math.min(1, progress / target) : state.completedAt ? 1 : 0;
        const buff = dailyTasks.activeBuffs.find((entry) => entry.taskId === taskId);
        const buffMs = buff ? buff.endsAt - now : 0;
        const claimable = state.completedAt !== null && state.claimedAt === null;
        const claimed = state.claimedAt !== null;
        let statusLabel: string | null = null;
        let statusType: 'default' | 'completed' | 'active' | 'expired' = 'default';
        if (claimable) {
          statusLabel = uiTexts.completed;
          statusType = 'completed';
        } else if (claimed && buffMs > 0) {
          statusLabel = `${uiTexts.reward_active} · ${formatTime(buffMs / 1000)}`;
          statusType = 'active';
        } else if (claimed) {
          statusLabel = uiTexts.reward_expired;
          statusType = 'expired';
        }
        const buttonLabel = claimable
          ? uiTexts.claim_reward
          : claimed && buffMs > 0
            ? uiTexts.reward_active
            : claimed
              ? uiTexts.reward_expired
              : uiTexts.progress;
        return {
          id: taskId,
          title: definition.title_fi,
          description: definition.desc_fi,
          progress,
          target,
          progressRatio,
          statusLabel,
          statusType,
          claimable,
          claimed,
          buttonLabel,
        };
      })
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);
  }, [dailyTasks, now, uiTexts]);

  const secondsToReset = dailyTasks.nextResetAt
    ? Math.max(0, Math.floor((dailyTasks.nextResetAt - now) / 1000))
    : 0;

  return (
    <section className="daily-tasks" aria-labelledby="daily-tasks-title">
      <header className="daily-tasks__header">
        <h2 id="daily-tasks-title" className="daily-tasks__title">
          {uiTexts.daily_tasks_title}
        </h2>
        <span className="daily-tasks__reset" aria-live="polite">
          {uiTexts.resets_in}: {formatTime(secondsToReset)}
        </span>
      </header>
      <div className="daily-tasks__list">
        {taskViews.map((task) => {
          const formattedProgress = formatNumber(task.progress, { maximumFractionDigits: 0 });
          const formattedTarget = formatNumber(task.target, { maximumFractionDigits: 0 });
          const buttonClass = task.claimable
            ? 'btn btn--primary'
            : task.claimed
              ? 'btn btn--success'
              : 'btn btn--disabled';
          return (
            <article className="daily-tasks__card" key={task.id}>
              <header className="daily-tasks__card-header">
                <div className="daily-tasks__card-text">
                  <h3 className="daily-tasks__card-title">{task.title}</h3>
                  <p className="daily-tasks__card-desc">{task.description}</p>
                </div>
                {task.statusLabel && (
                  <span className={`daily-tasks__status daily-tasks__status--${task.statusType}`}>
                    {task.statusLabel}
                  </span>
                )}
              </header>
              <div className="daily-tasks__progress">
                <div
                  className="daily-tasks__progress-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={task.target}
                  aria-valuenow={task.progress}
                >
                  <div
                    className="daily-tasks__progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, task.progressRatio * 100))}%` }}
                  />
                </div>
                <div className="daily-tasks__progress-label">
                  {uiTexts.progress}: {formattedProgress} {uiTexts.of} {formattedTarget}
                </div>
              </div>
              <button
                type="button"
                className={buttonClass}
                disabled={!task.claimable}
                onClick={() => claimReward(task.id)}
              >
                {task.buttonLabel}
              </button>
            </article>
          );
        })}
        {taskViews.length === 0 && (
          <div className="daily-tasks__empty" role="status">
            {uiTexts.progress}: 0 {uiTexts.of} 0
          </div>
        )}
      </div>
      {toast && (
        <div className="daily-tasks__toast" role="status">
          {toast.message}
        </div>
      )}
    </section>
  );
}
