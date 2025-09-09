import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HUD } from './components/HUD';
import { useGameStore } from './app/store';

describe('HUD', () => {
  it('increments population on click', () => {
    render(<HUD />);
    fireEvent.click(screen.getByText(/click/i));
    expect(useGameStore.getState().population).toBe(1);
  });
});
