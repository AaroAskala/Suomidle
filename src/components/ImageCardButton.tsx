import { iconMap, type IconKey } from '../icons';

interface ImageCardButtonProps {
  iconKey: IconKey;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean;
}

export function ImageCardButton({
  iconKey,
  title,
  subtitle,
  disabled,
  onClick,
  className,
  compact,
}: ImageCardButtonProps) {
  const buttonClassName = ['card-button', className].filter(Boolean).join(' ');
  const IconComponent = iconMap[iconKey] ?? iconMap.placeholder;

  if (!iconMap[iconKey]) {
    console.warn(`Unknown icon key provided to ImageCardButton: "${iconKey}"`);
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      data-compact={compact ? '' : undefined}
      aria-label={compact ? title : undefined}
    >
      <span className="card-button__media" aria-hidden="true">
        <IconComponent className="card-button__icon" aria-hidden="true" focusable="false" />
      </span>
      <span className="card-button__text">
        <span className="card-button__title">{title}</span>
        {subtitle && <span className="card-button__subtitle">{subtitle}</span>}
      </span>
    </button>
  );
}
