import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getIconComponent, type IconKey } from '../icons';

export interface DetailModalProps {
  open: boolean;
  title: string;
  iconKey?: IconKey | string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  descriptionId?: string;
}

export function DetailModal({
  open,
  title,
  iconKey,
  onClose,
  children,
  footer,
  descriptionId,
}: DetailModalProps) {
  const titleId = useId();
  const resolvedDescriptionId = descriptionId ?? `${titleId}-description`;
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.setProperty('overflow', 'hidden');
    window.addEventListener('keydown', handleKey);
    return () => {
      if (previousOverflow) {
        document.body.style.setProperty('overflow', previousOverflow);
      } else {
        document.body.style.removeProperty('overflow');
      }
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const IconComponent = getIconComponent(iconKey);

  return createPortal(
    <div className="detail-modal__overlay" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={resolvedDescriptionId}
        className="detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="detail-modal__header">
          <span className="detail-modal__icon" aria-hidden="true">
            <IconComponent className="detail-modal__icon-svg" />
          </span>
          <h2 id={titleId} className="detail-modal__title">
            {title}
          </h2>
          <button type="button" className="detail-modal__close" onClick={onClose} aria-label="Sulje">
            ×
          </button>
        </header>
        <div id={resolvedDescriptionId} className="detail-modal__content">
          {children}
        </div>
        {footer ? <footer className="detail-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
