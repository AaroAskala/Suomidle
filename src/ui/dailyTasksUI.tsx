import { useEffect, useId, useMemo, useState } from 'react';
import { useGameStore } from '../app/store';
import {
  dailyTaskEventTarget,
  DAILY_TASK_TOAST_EVENT,
  type DailyTaskToastDetail,
  getDailyTaskDefinition,
  getTaskTarget,
  getRewardTemplate,
} from '../systems/dailyTasks';
import { useLocale } from '../i18n/useLocale';
import './dailyTasks.css';
import { generateDailyTaskBadge } from './generatedSvg';

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
  const { t, formatNumber } = useLocale();
  const dailyTasks = useGameStore((state) => state.dailyTasks);
  const claimReward = useGameStore((state) => state.claimDailyTaskReward);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

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
      const taskTitle = t(`tasks.daily.items.${detail.taskId}.title` as const, {
        defaultValue: detail.taskTitle,
      });
      let message = taskTitle;
      if (detail.type === 'complete') {
        message = t('tasks.daily.toast.completed', {
          title: taskTitle,
          status: t('tasks.daily.status.completed'),
        });
      } else if (detail.type === 'claim') {
        const pct = detail.rewardValue !== undefined ? Math.round(detail.rewardValue * 100) : null;
        const duration = detail.rewardDuration !== undefined ? formatTime(detail.rewardDuration) : undefined;
        const suffix = [
          t('tasks.daily.status.active'),
          pct !== null ? t('tasks.daily.toast.bonus', { bonus: pct }) : null,
          duration ? t('tasks.daily.toast.duration', { duration }) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        message = t('tasks.daily.toast.claimed', {
          title: taskTitle,
          details: suffix,
        });
      } else if (detail.type === 'buff_expired') {
        message = t('tasks.daily.toast.expired', {
          title: taskTitle,
          status: t('tasks.daily.status.expired'),
        });
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
  }, [t]);

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
        const rewardTemplate = getRewardTemplate(definition.reward);
        let rewardLabel: string | null = null;
        if (rewardTemplate?.type === 'temp_gain_mult') {
          const formattedBonus = formatNumber(rewardTemplate.value * 100, {
            maximumFractionDigits: 0,
          });
          rewardLabel = t('tasks.daily.reward.tempGain', {
            bonus: formattedBonus,
            duration: formatTime(rewardTemplate.duration_s),
          });
        }
        let statusLabel: string | null = null;
        let statusType: 'default' | 'completed' | 'active' | 'expired' = 'default';
        if (claimable) {
          statusLabel = t('tasks.daily.status.completed');
          statusType = 'completed';
        } else if (claimed && buffMs > 0) {
          statusLabel = t('tasks.daily.status.activeWithTime', {
            duration: formatTime(buffMs / 1000),
          });
          statusType = 'active';
        } else if (claimed) {
          statusLabel = t('tasks.daily.status.expired');
          statusType = 'expired';
        }
        const buttonLabel = claimable
          ? t('tasks.redeem')
          : claimed && buffMs > 0
            ? t('tasks.daily.status.active')
            : claimed
              ? t('tasks.daily.status.expired')
              : t('tasks.daily.button.progress');
        return {
          id: taskId,
          title: t(`tasks.daily.items.${definition.id}.title` as const, {
            defaultValue: definition.title_fi,
          }),
          description: t(`tasks.daily.items.${definition.id}.description` as const, {
            defaultValue: definition.desc_fi,
          }),
          artworkUrl: generateDailyTaskBadge(definition.id, definition.title_fi, definition.category),
          progress,
          target,
          progressRatio,
          statusLabel,
          statusType,
          claimable,
          claimed,
          buttonLabel,
          rewardLabel,
        };
      })
      .filter((entry): entry is Exclude<typeof entry, null> => entry !== null);
  }, [dailyTasks, formatNumber, now, t]);

  const secondsToReset = dailyTasks.nextResetAt
    ? Math.max(0, Math.floor((dailyTasks.nextResetAt - now) / 1000))
    : 0;

  const readyToClaimCount = useMemo(
    () => taskViews.reduce((count, task) => (task.claimable ? count + 1 : count), 0),
    [taskViews],
  );
  const hasReadyTasks = readyToClaimCount > 0;
  const readyTasksLabel = hasReadyTasks
    ? t('tasks.daily.ready', { count: readyToClaimCount })
    : '';
  const title = t('tasks.daily.title');
  const toggleAriaLabel = hasReadyTasks ? `${title} · ${readyTasksLabel}` : title;

  return (
    <aside className={`daily-tasks-drawer${isOpen ? ' daily-tasks-drawer--open' : ''}`}>
      <button
        type="button"
        className="daily-tasks-drawer__toggle"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={toggleAriaLabel}
        onClick={() => setIsOpen((open) => !open)}
        title={toggleAriaLabel}
      >
        <span className="daily-tasks-drawer__chevron" aria-hidden="true">
          ›
        </span>
        <span className="daily-tasks-drawer__label">{title}</span>
        {hasReadyTasks && (
          <span className="daily-tasks-drawer__badge" aria-label={readyTasksLabel} role="status">
            !
          </span>
        )}
      </button>
      {isOpen && (
        <section id={panelId} className="daily-tasks" aria-labelledby="daily-tasks-title">
          <header className="daily-tasks__header">
            <h2 id="daily-tasks-title" className="daily-tasks__title">
              {title}
            </h2>
            <span className="daily-tasks__reset" aria-live="polite">
              {t('tasks.daily.resetsIn', { duration: formatTime(secondsToReset) })}
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
                    <div className="daily-tasks__card-main">
                      <img
                        src={task.artworkUrl}
                        alt=""
                        role="presentation"
                        loading="lazy"
                        className="daily-tasks__card-illustration"
                      />
                      <div className="daily-tasks__card-text">
                        <h3 className="daily-tasks__card-title">{task.title}</h3>
                        <p className="daily-tasks__card-desc">{task.description}</p>
                        {task.rewardLabel && (
                          <p className="daily-tasks__reward">{task.rewardLabel}</p>
                        )}
                      </div>
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
                      {t('tasks.daily.progressLabel', {
                        current: formattedProgress,
                        total: formattedTarget,
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={buttonClass}
                    disabled={!task.claimable}
                    onClick={() => claimReward(task.id)}
                    aria-label={task.buttonLabel}
                  >
                    {task.buttonLabel}
                  </button>
                </article>
              );
            })}
            {taskViews.length === 0 && (
              <div className="daily-tasks__empty" role="status">
                {t('tasks.daily.empty')}
              </div>
            )}
          </div>
        </section>
      )}
      {toast && (
        <div className="daily-tasks__toast" role="status">
          {toast.message}
        </div>
      )}
    </aside>
  );
}
