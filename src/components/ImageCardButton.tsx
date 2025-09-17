import { type ButtonHTMLAttributes } from 'react';
import { getIconComponent, type IconKey } from '../icons';

const joinClassNames = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

type CardStatus = 'default' | 'locked' | 'unaffordable' | 'ready' | 'owned';

type Tone = 'default' | 'accent';

interface ImageCardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  iconKey?: IconKey | string;
  title: string;
  subtitle?: string;
  badge?: string;
  status?: CardStatus;
  tone?: Tone;
}

export function ImageCardButton({
  iconKey,
  title,
  subtitle,
  badge,
  status = 'default',
  tone = 'default',
  className,
  disabled,
  ...buttonProps
}: ImageCardButtonProps) {
  const IconComponent = getIconComponent(iconKey);
  const composedClassName = joinClassNames('card-button', className);

  return (
    <button
      type="button"
      className={composedClassName}
      data-status={status}
      data-tone={tone}
      disabled={disabled}
      {...buttonProps}
    >
      <span className="card-button__icon" aria-hidden="true">
        <IconComponent className="card-button__icon-svg" />
        {badge ? <span className="card-button__badge">{badge}</span> : null}
      </span>
      <span className="card-button__text">
        <span className="card-button__title">{title}</span>
        {subtitle ? <span className="card-button__subtitle">{subtitle}</span> : null}
      </span>
    </button>
  );
}
