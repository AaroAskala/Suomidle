import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import en from './locales/en/common.json';
import fi from './locales/fi/common.json';
import sv from './locales/sv/common.json';
import { DEFAULT_LANG, NAMESPACE, SUPPORTED_LANGS } from './config';

const resources = {
  en: { [NAMESPACE]: en },
  fi: { [NAMESPACE]: fi },
  sv: { [NAMESPACE]: sv },
} as const;

type Resource = typeof resources;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: Resource;
    returnNull: false;
    defaultNS: typeof NAMESPACE;
  }
}

void i18n
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS.slice() as unknown as string[],
    nonExplicitSupportedLngs: true,
    ns: [NAMESPACE],
    defaultNS: NAMESPACE,
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
    keySeparator: false,
    returnNull: false,
    react: { useSuspense: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language || DEFAULT_LANG;

export default i18n;
