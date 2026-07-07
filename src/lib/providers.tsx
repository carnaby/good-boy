'use client';

import { useState, type ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/global';
import i18n from '@/lib/i18n';

/**
 * App-wide client providers. Wires up the styled-components theme + global
 * reset, TanStack Query, and i18next; later tasks (form state, …) extend
 * this same wrapper rather than adding new top-level providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  // Lazy initial state so each mounted <Providers> (each app instance, each
  // test render) gets its own isolated QueryClient rather than sharing a
  // module-level singleton across requests/tests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
