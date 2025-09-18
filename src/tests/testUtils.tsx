import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

export const setTestLanguage = async (lng: string) => {
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
};

export const renderWithI18n = (ui: ReactElement, options?: RenderOptions) =>
  render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>, options);
