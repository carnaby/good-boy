import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Providers } from '@/lib/providers';

/**
 * Renders `ui` inside the same `<Providers>` tree the app uses (theme,
 * TanStack Query, i18next), so components under test can rely on
 * `useTranslation`, styled-components theming, etc. without each test
 * re-wiring providers by hand.
 */
export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Providers });
}
