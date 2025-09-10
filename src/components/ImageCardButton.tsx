
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
  return (
    <button
      className={`btn btn--primary ${className ?? ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
      data-compact={compact ? '' : undefined}
      aria-label={compact ? title : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 4,
        padding: 8,
        border: '1px solid #ccc',
        background: '#fff',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <img
        src={icon}
        alt={title}
        width={compact ? 48 : 96}
        height={compact ? 48 : 96}
      />
      {!compact && (
        <div className="card__text">
          <div>{title}</div>
          {subtitle && <div>{subtitle}</div>}
        </div>
      )}
    </button>
  );
}
