'use client';

import styled, { keyframes } from 'styled-components';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';

export interface WizardLayoutProps {
  /** Right-hand panel photo, e.g. `/images/dog-steps.jpg`. */
  image: string;
  children: ReactNode;
}

// Symmetric split (owner decision): at >=lg the content column and the
// photo panel each get exactly half the viewport (1fr 1fr); below lg it's a
// single column with the photo hidden.
const Shell = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  min-height: 100vh;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }
`;

// `margin: 0 auto` centers the 658px content block inside its half — at
// 1440px that's a 720px cell, leaving ~31px side gutters, which still reads
// like the Figma 1440 layout.
const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
  max-width: 658px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(15)} ${({ theme }) => theme.spacing(4)};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-left: 0;
    padding-right: 0;
  }
`;

// `keyframes`d enter animation (Task 15, step transitions): each wizard page
// (Step1/2/3) mounts its own `WizardLayout`, so a fresh mount of THIS element
// is exactly what happens on every step-to-step route change — the animation
// runs once per navigation without any router-transition plumbing. Scoped to
// the content column only (image panel + footer stay static, per spec).
const stepEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
  animation: ${stepEnter} 200ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Hidden below `lg` (Figma: the photo panel is desktop-only) — the wizard
// content column becomes full width on narrower viewports.
const ImagePanel = styled.div`
  display: none;
  position: relative;
  margin: 20px;
  border-radius: ${({ theme }) => theme.radii.image};
  overflow: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

/**
 * Two-column wizard shell, split 50/50 at `lg`: the left half holds the
 * 658px content column (`children`, then `SiteFooter` pinned to the bottom
 * via `justify-content: space-between`), the right half the photo panel
 * (hidden below the `lg` breakpoint).
 */
export function WizardLayout({ image, children }: WizardLayoutProps) {
  return (
    <Shell>
      <Content>
        {/* tabIndex={-1}: skip-link target must be programmatically
            focusable so following `#main-content` hands DOM focus off in
            all browsers (APG skip-link pattern; same technique as
            `StepHeading` — out of the Tab order, focusable only via the
            fragment navigation). */}
        <Main id="main-content" tabIndex={-1}>
          {children}
        </Main>
        <SiteFooter showSocials />
      </Content>
      <ImagePanel>
        <Image src={image} alt="" fill sizes="50vw" style={{ objectFit: 'cover' }} priority />
      </ImagePanel>
    </Shell>
  );
}
