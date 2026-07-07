'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/global';

/**
 * App-wide client providers. Currently wires up the styled-components
 * theme + global reset; later tasks (data fetching, i18n, form state, …)
 * extend this same wrapper rather than adding new top-level providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
