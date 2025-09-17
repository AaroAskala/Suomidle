import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { renderWithI18n, setTestLanguage } from './testUtils';
import i18n from '../i18n';

const languages = ['fi', 'en', 'sv'] as const;

describe('i18n coverage', () => {
  afterEach(() => {
    cleanup();
  });

  for (const lang of languages) {
    it(`renders translations for ${lang}`, async () => {
      await setTestLanguage(lang);
      renderWithI18n(<LanguageSwitcher />);
      const code = (i18n.resolvedLanguage || i18n.language).slice(0, 2).toUpperCase();
      expect(screen.getByText(i18n.t('lang.current', { code }))).toBeInTheDocument();
      expect(screen.getByLabelText(i18n.t('lang.switch'))).toBeInTheDocument();
    });
  }
});
