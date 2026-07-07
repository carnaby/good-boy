import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from '@/locales/sk/common.json';
import donation from '@/locales/sk/donation.json';
import about from '@/locales/sk/about.json';

/**
 * Single i18next instance shared by the whole app. Only Slovak is supported
 * for now — `resources` gains a namespace entry whenever a task introduces
 * one (see task-3 brief: common now, donation/contact/about later).
 *
 * Guarded by `isInitialized` so calling this module more than once (React
 * StrictMode double-invoking effects, or multiple test files importing
 * `Providers`) never re-runs `.init()`.
 */
if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    lng: 'sk',
    fallbackLng: 'sk',
    defaultNS: 'common',
    resources: {
      sk: {
        common,
        donation,
        about,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18next;
