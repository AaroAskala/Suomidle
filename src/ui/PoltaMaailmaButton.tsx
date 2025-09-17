import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTuhkaAwardPreview,
  poltaMaailmaConfirm,
  useGameStore,
  type PoltaMaailmaResult,
  type TuhkaAwardPreview,
} from '../app/store';
import { formatNumber } from '../utils/format';

const CONFIRMATION_PHRASE = 'POLTA MAAILMA';

const formatBigInt = (value: bigint) => {
  const absolute = value < 0n ? -value : value;
  if (absolute <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return formatNumber(Number(value));
  }
  return value.toString();
};

const toastDurationMs = 5000;

export function PoltaMaailmaButton() {
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

  const canPoltaMaailma = preview.award > 0n;
  const disabledTooltip = canPoltaMaailma
    ? undefined
    : 'Et ansaitse vielä Tuhkaa polttamalla maailman.';

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
    if (normalized !== CONFIRMATION_PHRASE) return;

    const result: PoltaMaailmaResult = poltaMaailmaConfirm();
    setModalOpen(false);
    setConfirmValue('');

    if (result.awarded > 0n) {
      showToast(
        `Maailma paloi! +${formatBigInt(result.awarded)} Tuhka (→ ${formatBigInt(
          result.availableTuhka,
        )}).`,
      );
    } else {
      showToast('Maailma paloi, mutta et ansainnut uutta Tuhkaa.');
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
        >
          <div style={{ fontWeight: 600 }}>Polta maailma</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {`+${formatBigInt(preview.award)} Tuhka → ${formatBigInt(preview.availableAfter)}`}
          </div>
        </button>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
          {`Yhteensä: ${formatBigInt(preview.totalEarned)} → ${formatBigInt(
            preview.totalEarnedAfter,
          )}`}
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
            <h2 id="polta-maailma-title" style={{ marginTop: 0 }}>Polta maailma</h2>
            <p id="polta-maailma-description" style={{ marginBottom: '1rem' }}>
              Kirjoita ”POLTA MAAILMA” vahvistaaksesi. Tämä nollaa nykyisen maailman ja alkaa uudelta
              aikakaudelta.
            </p>
            <div
              style={{
                display: 'grid',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              <div>{`Saat: +${formatBigInt(preview.award)} Tuhka`}</div>
              <div>{`Tuhka varastossa: ${formatBigInt(preview.current)} → ${formatBigInt(
                preview.availableAfter,
              )}`}</div>
              <div>{`Tuhka ansaittu yhteensä: ${formatBigInt(preview.totalEarned)} → ${formatBigInt(
                preview.totalEarnedAfter,
              )}`}</div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
            >
              <label htmlFor="polta-maailma-confirm" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Vahvista polttamalla maailma
              </label>
              <input
                id="polta-maailma-confirm"
                ref={inputRef}
                value={confirmValue}
                onChange={(event) => setConfirmValue(event.target.value)}
                placeholder={CONFIRMATION_PHRASE}
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
                  Peruuta
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={confirmValue.trim().toUpperCase() !== CONFIRMATION_PHRASE}
                  style={{ background: '#16a34a' }}
                >
                  Vahvista
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
