'use client';

import styled from 'styled-components';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';

export interface WizardLayoutProps {
  /** Right-hand panel photo, e.g. `/images/dog-steps.jpg`. */
  image: string;
  children: ReactNode;
}

const Shell = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100vh;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: flex-start;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
  max-width: 658px;
  padding: ${({ theme }) => theme.spacing(15)} ${({ theme }) => theme.spacing(4)};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-left: 80px;
    padding-left: 0;
    padding-right: 0;
  }
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
`;

// Hidden below `lg` (Figma: the photo panel is desktop-only) — the wizard
// content column becomes full width on narrower viewports.
const ImagePanel = styled.div`
  display: none;
  position: relative;
  flex: 1;
  margin: 20px;
  border-radius: ${({ theme }) => theme.radii.image};
  overflow: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

/**
 * Two-column wizard shell: a 658px content column (`children`, then
 * `SiteFooter` pinned to the bottom via `justify-content: space-between`)
 * and a right-hand photo panel that's hidden below the `lg` breakpoint.
 */
export function WizardLayout({ image, children }: WizardLayoutProps) {
  return (
    <Shell>
      <Content>
        <Main>{children}</Main>
        <SiteFooter showSocials />
      </Content>
      <ImagePanel>
        <Image src={image} alt="" fill sizes="602px" style={{ objectFit: 'cover' }} priority />
      </ImagePanel>
    </Shell>
  );
}
