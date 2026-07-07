'use client';

import { useState, type ReactNode } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

/**
 * Official Next.js App Router pattern for styled-components v6 SSR
 * (see: https://nextjs.org/docs/app/guides/css-in-js#styled-components).
 * Collects styles generated during server rendering into a registry and
 * flushes them into <head> via `useServerInsertedHTML` before any content
 * that depends on them is streamed — this is what avoids FOUC.
 */
export function StyledComponentsRegistry({ children }: { children: ReactNode }) {
  // Only create the stylesheet once, with lazy initial state.
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>{children}</StyleSheetManager>
  );
}
