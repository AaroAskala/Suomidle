import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG, SUPPORTED_LANGS, type SupportedLang } from './config';

const SCIENTIFIC_NOTATION_THRESHOLD = 1_000_000_000;
const SCIENTIFIC_NOTATION_THRESHOLD_BIGINT = 1_000_000_000n;

const shouldUseScientificNotation = (value: number | bigint) => {
  if (typeof value === 'bigint') {
    return (
      value >= SCIENTIFIC_NOTATION_THRESHOLD_BIGINT ||
      value <= -SCIENTIFIC_NOTATION_THRESHOLD_BIGINT
    );
  }

  if (!Number.isFinite(value)) return false;

  return Math.abs(value) >= SCIENTIFIC_NOTATION_THRESHOLD;
};

const STORAGE_KEY = 'i18nextLng';

type FormatNumberOptions = Intl.NumberFormatOptions;
type FormatDateOptions = Intl.DateTimeFormatOptions;

type FormatDateInput = Date | number | string;

const isSupportedLang = (value: string): value is SupportedLang =>
  SUPPORTED_LANGS.includes(value as SupportedLang);

export function useLocale() {
  const { i18n, t } = useTranslation();

  const resolvedLang = useMemo<SupportedLang>(() => {
    const lang = i18n.resolvedLanguage || i18n.language;
    return lang && isSupportedLang(lang) ? lang : DEFAULT_LANG;
  }, [i18n.language, i18n.resolvedLanguage]);

  const setLang = useCallback(
    async (lang: SupportedLang) => {
      if (i18n.language !== lang) {
        await i18n.changeLanguage(lang);
      }
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (error) {
        console.warn('Failed to persist language preference', error);
      }
      document.documentElement.lang = lang;
    },
    [i18n],
  );

  const formatNumber = useCallback(
    (value: number | bigint, options?: FormatNumberOptions) => {
      const locale = i18n.language || resolvedLang;
      const targetValue = typeof value === 'bigint' ? value : Number(value);
      const formatOptions: FormatNumberOptions | undefined = shouldUseScientificNotation(targetValue)
        ? { ...(options ?? {}), notation: 'scientific' }
        : options;
      const formatter = new Intl.NumberFormat(locale, formatOptions);
      return formatter.format(targetValue);
    },
    [i18n.language, resolvedLang],
  );

  const formatDate = useCallback(
    (value: FormatDateInput, options?: FormatDateOptions) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      const formatter = new Intl.DateTimeFormat(i18n.language || resolvedLang, options);
      return formatter.format(date);
    },
    [i18n.language, resolvedLang],
  );

  return { lang: resolvedLang, setLang, t, formatNumber, formatDate };
}
