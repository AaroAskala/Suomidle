import './index.css';
import App from './App.tsx';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import en from './i18n/locales/en/common.json';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const fallbackLabel = en['loading'];

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<div className="app-loading" aria-live="polite">{fallbackLabel}</div>}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Suspense>
  </StrictMode>,
);
