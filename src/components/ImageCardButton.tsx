interface ImageCardButtonProps {
  icon: string;
  title: string;
  countLabel?: string;
  statusLabel?: string;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
  compact?: boolean;
  status?: 'available' | 'unavailable' | 'locked' | 'owned';
}

export function ImageCardButton({
  icon,
  title,
  countLabel,
  statusLabel,
  disabled,
  onSelect,
  className,
  compact,
  status,
}: ImageCardButtonProps) {
  const buttonClassName = ['card-button', className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onSelect}
      disabled={disabled}
      data-compact={compact ? '' : undefined}
      data-status={status}
      aria-label={compact ? title : undefined}
    >
      <span className="card-button__media" aria-hidden="true">
        <img src={icon} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="card-button__text">
        <span className="card-button__header">
          <span className="card-button__title">{title}</span>
          {countLabel ? <span className="card-button__count">{countLabel}</span> : null}
        </span>
        {statusLabel ? <span className="card-button__subtitle">{statusLabel}</span> : null}
      </span>
    </button>
  );
}
