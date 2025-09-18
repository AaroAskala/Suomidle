interface ImageCardButtonProps {
  icon: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean;
}

export function ImageCardButton({
  icon,
  title,
  subtitle,
  disabled,
  onClick,
  className,
  compact,
}: ImageCardButtonProps) {
  const buttonClassName = ['card-button', className].filter(Boolean).join(' ');

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
        <img src={icon} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="card-button__text">
        <span className="card-button__title">{title}</span>
        {subtitle && <span className="card-button__subtitle">{subtitle}</span>}
      </span>
    </button>
  );
}
