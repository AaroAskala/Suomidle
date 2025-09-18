import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { SUPPORTED_LANGS, type SupportedLang } from '../i18n/config';
import { useLocale } from '../i18n/useLocale';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLocale();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value as SupportedLang;
      void setLang(next);
    },
    [setLang],
  );

  return (
    <label className={`language-switcher ${className ?? ''}`.trim()} aria-label={t('lang.switch')}>
      <span className="language-switcher__label">{t('lang.current', { code: lang.toUpperCase() })}</span>
      <select className="language-switcher__select" value={lang} onChange={handleChange}>
        {SUPPORTED_LANGS.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSwitcher;
