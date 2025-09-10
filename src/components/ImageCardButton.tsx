
interface ImageCardButtonProps {
  icon: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function ImageCardButton({
  icon,
  title,
  subtitle,
  disabled,
  onClick,
}: ImageCardButtonProps) {
  return (
    <button
      className="btn btn--primary"
      onClick={onClick}
      disabled={disabled}
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
      <img src={icon} alt={title} width={96} height={96} />
      <div className="card__text">
        <div>{title}</div>
        {subtitle && <div>{subtitle}</div>}
      </div>
    </button>
  );
}
