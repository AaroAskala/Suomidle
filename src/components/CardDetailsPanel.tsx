import { Children, ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '../i18n/useLocale';

interface CardDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  icon: string;
  title: string;
  subtitle?: string;
  status?: string;
  description?: string;
  flavor?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function CardDetailsPanel({
  open,
  onClose,
  icon,
  title,
  subtitle,
  status,
  description,
  flavor,
  children,
  actions,
}: CardDetailsPanelProps) {
  const { t } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const hasBodyContent =
    Boolean(description || flavor) || (children ? Children.count(children) > 0 : false);
  const describedBy = hasBodyContent ? descriptionId : undefined;

  return createPortal(
    <div className="card-details__overlay" role="presentation" onClick={onClose}>
      <aside
        className="card-details__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="card-details__header">
          <div className="card-details__media" aria-hidden="true">
            <img src={icon} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="card-details__heading">
            <h2 id={titleId} className="card-details__title">
              {title}
            </h2>
            {subtitle && <p className="card-details__subtitle">{subtitle}</p>}
            {status && <p className="card-details__status">{status}</p>}
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="card-details__close"
            onClick={onClose}
          >
            <span className="sr-only">{t('actions.close')}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 0 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>
        <div id={descriptionId} className="card-details__body">
          {description && <p className="card-details__description">{description}</p>}
          {children}
          {flavor && <p className="card-details__flavor">{flavor}</p>}
        </div>
        {actions && <footer className="card-details__footer">{actions}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
