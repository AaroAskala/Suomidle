import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTuhkaAwardPreview,
  poltaMaailmaConfirm,
  useGameStore,
  type PoltaMaailmaResult,
  type TuhkaAwardPreview,
} from '../app/store';
import { useLocale } from '../i18n/useLocale';
import './PoltaMaailmaButton.css';

const toastDurationMs = 5000;

export function PoltaMaailmaButton() {
  const { t, formatNumber } = useLocale();
  const [isModalOpen, setModalOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tierLevel = useGameStore((s) => s.tierLevel);
  const prestigeMult = useGameStore((s) => s.prestigeMult);
  const tuhka = useGameStore((s) => s.maailma.tuhka);
  const totalTuhkaEarned = useGameStore((s) => s.maailma.totalTuhkaEarned);

  const preview: TuhkaAwardPreview = useMemo(() => {
    void tierLevel;
    void prestigeMult;
    void tuhka;
    void totalTuhkaEarned;
    return getTuhkaAwardPreview();
  }, [tierLevel, prestigeMult, tuhka, totalTuhkaEarned]);

  const confirmPhrase: string = t('maailma.confirmPhrase');

  const formatBigInt = (value: bigint) => formatNumber(value, { maximumFractionDigits: 0 });

  const canPoltaMaailma = preview.award > 0n;
  const disabledTooltip = canPoltaMaailma ? undefined : t('maailma.tooltip.noAsh');

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== undefined) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), toastDurationMs);
  };

  useEffect(() => () => {
    if (toastTimerRef.current !== undefined) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setModalOpen(false);
        setConfirmValue('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) inputRef.current?.focus();
  }, [isModalOpen]);

  const handleConfirm = () => {
    const normalized = confirmValue.trim().toUpperCase();
    if (normalized !== confirmPhrase.toUpperCase()) return;

    const result: PoltaMaailmaResult = poltaMaailmaConfirm();
    setModalOpen(false);
    setConfirmValue('');

    if (result.awarded > 0n) {
      showToast(
        t('maailma.toast.awarded', {
          awarded: formatBigInt(result.awarded),
          available: formatBigInt(result.availableTuhka),
        }),
      );
    } else {
      showToast(t('maailma.toast.none'));
    }
  };

  return (
    <>
      <div className="polta-maailma">
        <button
          type="button"
          className="btn polta-maailma__button"
          onClick={() => setModalOpen(true)}
          disabled={!canPoltaMaailma}
          title={disabledTooltip}
          aria-label={t('maailma.action')}
        >
          <span className="polta-maailma__label">{t('maailma.action')}</span>
          <span className="polta-maailma__preview">
            {t('maailma.preview.gain', {
              award: formatBigInt(preview.award),
              available: formatBigInt(preview.availableAfter),
            })}
          </span>
        </button>
        <div className="polta-maailma__total">
          {t('maailma.preview.total', {
            total: formatBigInt(preview.totalEarned),
            totalAfter: formatBigInt(preview.totalEarnedAfter),
          })}
        </div>
      </div>

      {isModalOpen && (
        <div
          role="presentation"
          className="polta-maailma__overlay"
          onClick={() => {
            setModalOpen(false);
            setConfirmValue('');
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="polta-maailma-title"
            aria-describedby="polta-maailma-description"
            onClick={(event) => event.stopPropagation()}
            className="polta-maailma__dialog"
          >
            <h2 id="polta-maailma-title" className="polta-maailma__title">
              {t('maailma.action')}
            </h2>
            <p id="polta-maailma-description" className="polta-maailma__description">
              {t('maailma.description', { phrase: confirmPhrase })}
            </p>
            <div className="polta-maailma__stats">
              <div>{t('maailma.modal.award', { value: formatBigInt(preview.award) })}</div>
              <div>
                {t('maailma.modal.available', {
                  current: formatBigInt(preview.current),
                  next: formatBigInt(preview.availableAfter),
                })}
              </div>
              <div>
                {t('maailma.modal.total', {
                  total: formatBigInt(preview.totalEarned),
                  totalAfter: formatBigInt(preview.totalEarnedAfter),
                })}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              <label htmlFor="polta-maailma-confirm" className="polta-maailma__label-text">
                {t('maailma.modal.label')}
              </label>
              <input
                id="polta-maailma-confirm"
                ref={inputRef}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={confirmPhrase}
                className="polta-maailma__input"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="polta-maailma__actions">
                <button
                  type="button"
                  className="btn polta-maailma__cancel"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmValue('');
                  }}
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn polta-maailma__confirm"
                  disabled={confirmValue.trim().toUpperCase() !== confirmPhrase.toUpperCase()}
                >
                  {t('actions.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div role="status" aria-live="polite" className="polta-maailma__toast">
          {toastMessage}
        </div>
      )}
    </>
  );
}
