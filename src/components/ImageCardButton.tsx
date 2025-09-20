import { iconMap, type IconKey } from '../icons';

interface ImageCardButtonProps {
  iconKey: IconKey;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean;
  ariaLabel?: string;
  tooltip?: string;
}

export function ImageCardButton({
  iconKey,
  title,
  subtitle,
  disabled,
  onClick,
  className,
  compact,
  ariaLabel,
  tooltip,
}: ImageCardButtonProps) {
  const IconComponent = iconMap[iconKey] ?? iconMap.placeholder;
  const buttonClassName = ['card-button', className].filter(Boolean).join(' ');
  const computedAriaLabel = ariaLabel ?? (compact ? title : undefined);
  const computedTitle = tooltip ?? (compact ? title : undefined);

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      data-compact={compact ? '' : undefined}
      aria-label={computedAriaLabel}
      title={computedTitle}
    >
      <span className="card-button__media" aria-hidden="true">
        <IconComponent className="card-button__icon" aria-hidden="true" />
      </span>
      <span className="card-button__text">
        <span className="card-button__title">{title}</span>
        {subtitle && <span className="card-button__subtitle">{subtitle}</span>}
      </span>
    </button>
  );
}
