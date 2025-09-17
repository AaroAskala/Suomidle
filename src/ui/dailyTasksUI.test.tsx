import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DailyTasksPanel } from './dailyTasksUI';
import { useGameStore } from '../app/store';
import { createInitialDailyTasksState, dailyTasksConfig } from '../systems/dailyTasks';

const resetDailyTasks = () => {
  useGameStore.setState({ dailyTasks: createInitialDailyTasksState() });
};

const uiTexts = dailyTasksConfig.ui_texts_fi;

describe('DailyTasksPanel', () => {
  beforeEach(() => {
    resetDailyTasks();
  });

  afterEach(() => {
    cleanup();
    resetDailyTasks();
  });

  it('is collapsed by default and expands when toggled', () => {
    render(<DailyTasksPanel />);
    expect(
      screen.queryByRole('heading', { level: 2, name: uiTexts.daily_tasks_title }),
    ).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: new RegExp(uiTexts.daily_tasks_title, 'i') });
    fireEvent.click(toggle);
    expect(
      screen.getByRole('heading', { level: 2, name: uiTexts.daily_tasks_title }),
    ).toBeInTheDocument();
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

    render(<DailyTasksPanel />);

    expect(screen.getByLabelText('1 task ready to claim')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: new RegExp(uiTexts.daily_tasks_title, 'i') });
    fireEvent.click(toggle);
    expect(screen.getByText(definition.title_fi)).toBeInTheDocument();
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

    render(<DailyTasksPanel />);

    expect(screen.queryByLabelText(/tasks ready to claim/i)).not.toBeInTheDocument();
  });
});
