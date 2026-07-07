'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';

export interface PageLayoutProps {
  children: ReactNode;
}

const Container = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(15)} ${({ theme }) => theme.spacing(20)};
`;

/**
 * Full-width content container (1280px max, 80px side margins) for
 * non-wizard pages (Kontakt, O projekte). Deliberately minimal — Tasks 13/14
 * flesh out how it's used (headings, back link, footer placement, etc).
 */
export function PageLayout({ children }: PageLayoutProps) {
  return <Container>{children}</Container>;
}
