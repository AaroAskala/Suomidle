import { useId } from 'react';
import './ProgressBar.css';

export type ProgressBarVariant = 'blue' | 'orange' | 'purple';

export interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  helperText?: string | null;
  variant?: ProgressBarVariant;
}

const normalizeNumber = (value: number) =>
  Number.isFinite(value) ? value : 0;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function ProgressBar({
  label,
  value,
  max,
  valueLabel,
  helperText,
  variant = 'blue',
}: ProgressBarProps) {
  const labelId = useId();
  const helperId = helperText ? `${labelId}-helper` : undefined;

  const normalizedValue = normalizeNumber(value);
  const normalizedMax = normalizeNumber(max);
  const fallbackMax = normalizedMax > 0
    ? normalizedMax
    : normalizedValue > 0
      ? normalizedValue
      : 1;
  const safeValue = clamp(normalizedValue, 0, fallbackMax);
  const ratio = fallbackMax > 0 ? clamp(safeValue / fallbackMax, 0, 1) : 0;
  const percentage = Math.round(ratio * 1000) / 10;

  return (
    <div className={`progress-bar progress-bar--${variant}`}>
      <div className="progress-bar__header">
        <span className="progress-bar__label" id={labelId}>
          {label}
        </span>
        {valueLabel ? <span className="progress-bar__value">{valueLabel}</span> : null}
      </div>
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-describedby={helperId}
        aria-valuemin={0}
        aria-valuenow={Number.isFinite(safeValue) ? safeValue : 0}
        aria-valuemax={fallbackMax}
        aria-valuetext={valueLabel}
      >
        <div
          className="progress-bar__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {helperText ? (
        <div className="progress-bar__helper" id={helperId}>
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
