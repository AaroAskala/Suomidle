
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
    <button onClick={onClick} disabled={disabled} className="card">
      <img src={icon} alt={title} width={96} height={96} />
      <div className="card__text">
        <div>{title}</div>
        {subtitle && <div>{subtitle}</div>}
      </div>
    </button>
  );
}
