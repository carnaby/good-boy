'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';

export interface PageLayoutProps {
  children: ReactNode;
  /**
   * Rendered as a sibling AFTER the `<main>` landmark (e.g. `<SiteFooter />`)
   * rather than as part of `children` — a `<footer>` nested inside `<main>`
   * loses its implicit `contentinfo` landmark role (per the HTML-ARIA
   * mapping, `footer` only maps to `contentinfo` when it's NOT a descendant
   * of `main`/`article`/`aside`/`nav`/`section`), so this keeps it a sibling.
   */
  footer?: ReactNode;
}

// 16px side padding below \`md\` (was a flat 80px at every viewport, which
// left only ~215px of content width at 375px) growing to the full 80px
// Figma gutter from \`md\` up.
const Container = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(10)} ${({ theme }) => theme.spacing(4)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing(15)} ${({ theme }) => theme.spacing(20)};
  }
`;

// `display: contents` gives this a real `<main>` landmark without adding a
// box to the layout — `Container`'s padding/max-width applies exactly as if
// `children` were its direct children, unchanged from before this element
// existed.
const Main = styled.main`
  display: contents;
`;

/**
 * Full-width content container (1280px max, 80px side margins) for
 * non-wizard pages (Kontakt, O projekte): a `<main id="main-content">`
 * landmark (the skip-link target) around `children`, plus an optional
 * `footer` slot rendered outside it.
 */
export function PageLayout({ children, footer }: PageLayoutProps) {
  return (
    <Container>
      {/* tabIndex={-1}: skip-link target must be programmatically
          focusable so following `#main-content` hands DOM focus off in
          all browsers (APG skip-link pattern; same technique as
          `StepHeading` — out of the Tab order, focusable only via the
          fragment navigation). */}
      <Main id="main-content" tabIndex={-1}>
        {children}
      </Main>
      {footer}
    </Container>
  );
}
