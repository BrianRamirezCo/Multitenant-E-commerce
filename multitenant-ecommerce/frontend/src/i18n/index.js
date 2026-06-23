import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.js';
import en from './locales/en.js';

/**
 * i18n setup (react-i18next).
 *
 * - Default language: Spanish (the primary audience is Argentina).
 * - The chosen language is persisted in localStorage so it survives reloads.
 * - To add a screen to i18n: import useTranslation, replace hardcoded strings
 *   with t('namespace.key'), and add the keys to BOTH locale files.
 *
 * Note: we deliberately read/write localStorage only for the UI language
 * preference (allowed; this is not app data and not in an artifact sandbox).
 */
const STORAGE_KEY = 'app_lang';

function getInitialLang() {
  if (typeof window === 'undefined') return 'es';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  // Fall back to the browser language if it starts with "en", else Spanish.
  const browser = window.navigator.language || 'es';
  return browser.toLowerCase().startsWith('en') ? 'en' : 'es';
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getInitialLang(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false }, // React already escapes
});

// Persist language changes.
i18n.on('languageChanged', (lng) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore storage errors */
  }
});

export default i18n;
