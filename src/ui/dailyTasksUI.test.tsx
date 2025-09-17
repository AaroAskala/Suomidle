import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DailyTasksPanel } from './dailyTasksUI';
import { useGameStore } from '../app/store';
import { createInitialDailyTasksState, dailyTasksConfig } from '../systems/dailyTasks';
import { renderWithI18n, setTestLanguage } from '../tests/testUtils';
import i18n from '../i18n';

const resetDailyTasks = () => {
  useGameStore.setState({ dailyTasks: createInitialDailyTasksState() });
};

describe('DailyTasksPanel', () => {
  beforeEach(async () => {
    await setTestLanguage('en');
    resetDailyTasks();
  });

  afterEach(() => {
    cleanup();
    resetDailyTasks();
  });

  it('is collapsed by default and expands when toggled', () => {
    renderWithI18n(<DailyTasksPanel />);
    const title = i18n.t('tasks.daily.title');
    expect(screen.queryByRole('heading', { level: 2, name: title })).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: new RegExp(title, 'i') });
    fireEvent.click(toggle);
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
  });

  it('shows a ready indicator when tasks can be claimed', () => {
    const definition = dailyTasksConfig.tasks[0];
    const now = Date.now();
    useGameStore.setState({
      dailyTasks: {
        ...createInitialDailyTasksState(),
        rolledDate: '2024-01-01',
        taskOrder: [definition.id],
        tasks: {
          [definition.id]: {
            id: definition.id,
            rolledAt: '2024-01-01T00:00:00.000Z',
            progress: 1,
            completedAt: now,
            claimedAt: null,
          },
        },
        nextResetAt: now + 60_000,
      },
    });

    renderWithI18n(<DailyTasksPanel />);

    const readyLabel = i18n.t('tasks.daily.ready', { count: 1 });
    expect(screen.getByLabelText(readyLabel)).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: new RegExp(i18n.t('tasks.daily.title'), 'i') });
    fireEvent.click(toggle);
    expect(
      screen.getByText(i18n.t(`tasks.daily.items.${definition.id}.title` as const, {
        defaultValue: definition.title_fi,
      })),
    ).toBeInTheDocument();
  });

  it('hides the ready indicator when no tasks are claimable', () => {
    const definition = dailyTasksConfig.tasks[0];
    const now = Date.now();
    useGameStore.setState({
      dailyTasks: {
        ...createInitialDailyTasksState(),
        rolledDate: '2024-01-01',
        taskOrder: [definition.id],
        tasks: {
          [definition.id]: {
            id: definition.id,
            rolledAt: '2024-01-01T00:00:00.000Z',
            progress: 0,
            completedAt: null,
            claimedAt: null,
          },
        },
        nextResetAt: now + 60_000,
      },
    });

    renderWithI18n(<DailyTasksPanel />);

    expect(screen.queryByLabelText(i18n.t('tasks.daily.ready', { count: 1 }))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t('tasks.daily.ready', { count: 2 }))).not.toBeInTheDocument();
  });
});
