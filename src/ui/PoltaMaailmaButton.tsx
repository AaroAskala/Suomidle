import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTuhkaAwardPreview,
  poltaMaailmaConfirm,
  useGameStore,
  type PoltaMaailmaResult,
  type TuhkaAwardPreview,
} from '../app/store';
import { useLocale } from '../i18n/useLocale';

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

  const confirmPhrase = t('maailma.confirmPhrase');

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
      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          right: '1.25rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.35rem',
        }}
      >
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setModalOpen(true)}
          disabled={!canPoltaMaailma}
          title={disabledTooltip}
          style={{
            background: '#b91c1c',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          aria-label={t('maailma.action')}
        >
          <div style={{ fontWeight: 600 }}>{t('maailma.action')}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {t('maailma.preview.gain', {
              award: formatBigInt(preview.award),
              available: formatBigInt(preview.availableAfter),
            })}
          </div>
        </button>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
          {t('maailma.preview.total', {
            total: formatBigInt(preview.totalEarned),
            totalAfter: formatBigInt(preview.totalEarnedAfter),
          })}
        </div>
      </div>

      {isModalOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
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
            style={{
              background: 'var(--surface-elevated)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '100%',
              color: 'var(--color-text)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            }}
          >
            <h2 id="polta-maailma-title" style={{ marginTop: 0 }}>
              {t('maailma.action')}
            </h2>
            <p id="polta-maailma-description" style={{ marginBottom: '1rem' }}>
              {t('maailma.description', { phrase: confirmPhrase })}
            </p>
            <div
              style={{
                display: 'grid',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
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
              <label htmlFor="polta-maailma-confirm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                {t('maailma.modal.label')}
              </label>
              <input
                id="polta-maailma-confirm"
                ref={inputRef}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={confirmPhrase}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0, 0, 0, 0.35)',
                  color: 'inherit',
                  marginBottom: '1rem',
                }}
                autoComplete="off"
                spellCheck={false}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setModalOpen(false);
                    setConfirmValue('');
                  }}
                  style={{ background: 'rgba(255, 255, 255, 0.12)', color: 'inherit' }}
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={confirmValue.trim().toUpperCase() !== confirmPhrase.toUpperCase()}
                  style={{ background: '#16a34a' }}
                >
                  {t('actions.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(28, 28, 28, 0.9)',
            color: '#fff',
            padding: '0.75rem 1rem',
            borderRadius: '999px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            zIndex: 1200,
            maxWidth: '90vw',
            textAlign: 'center',
            fontSize: '0.95rem',
          }}
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
