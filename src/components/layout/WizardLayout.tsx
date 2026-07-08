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

// Symmetric split: at >=lg the content column and the
// photo panel each get exactly half the viewport (1fr 1fr); below lg it's a
// single column with the photo hidden.
//
// `max-width: 1440px` + `margin: 0 auto` (fix #1): 1440 is
// the Figma canvas width — beyond it the shell stops growing and centers,
// so `surfacePage` (set on `<body>`, see `src/styles/global.ts`) shows
// through on both sides instead of the grid stretching indefinitely on
// ultrawide monitors.
// `minmax(0, 1fr)` rather than bare `1fr` (fix, round 2):
// `1fr` means `minmax(auto, 1fr)`, and that *auto minimum* honors the grid
// item's min-content — so any descendant with a large intrinsic width (the
// concrete case: Step 2's phone `<input>`, whose ~220px default min-content
// propagated up through flex intrinsic sizing even though every box on the
// way had `min-width: 0`, which only helps at layout time) silently grew
// the track past the viewport and gave the page a horizontal scrollbar on
// mobile. A zero track minimum means the column is always sized by the
// available width, never by content, and descendants shrink at layout time
// as intended.
const Shell = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  min-height: 100vh;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`;

// Fix #2: below `lg` this is a single full-width column, so
// `max-width: 658px` + `margin: 0 auto` alone already guarantees a side
// gutter (the column is far wider than 658px until deep into mobile, where
// the 16px padding below takes over instead). The bug was at/above `lg`:
// once the 50/50 grid activates, this column's own track is only
// `viewport / 2` wide, which is *narrower* than 658px up to ~1316px viewport
// width (e.g. exactly 650px at 1300px) — `width: 100%` then rendered the
// column at the FULL track width with zero side margin, gluing content to
// the viewport edge. `width: min(658px, 100% - 2*gutter)` reserves at least
// CONTENT_GUTTER_PX on each side no matter how narrow the track is, only
// growing to the full 658px once the track can afford 658px + 2*gutter;
// `margin: 0 auto` centers whichever value wins — which is what produces
// the ~31px gutter at 1440 (720px track) once the shell cap above kicks in.
const CONTENT_GUTTER_PX = 24;

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
    width: min(658px, calc(100% - ${CONTENT_GUTTER_PX * 2}px));
    padding-left: 0;
    padding-right: 0;
  }
`;

// Step-transition enter animation: each wizard page (Step1/2/3) mounts its
// own `WizardLayout`, so a fresh mount of THIS element is exactly what
// happens on every step-to-step route change — the animation runs once per
// navigation without any router-transition plumbing. Scoped to the content
// column only (image panel + footer stay static).
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
// content column becomes full width on narrower viewports. The 20px inset
// is a fixed margin (not viewport-relative), so it stays a sane, consistent
// border around the photo at 1300/1440/1600+ alike — verified unaffected by
// the `Shell` max-width cap above, since that only stops the column's own
// width from growing past 720px (1440 / 2).
const ImagePanel = styled.div`
  display: none;
  position: relative;
  margin: ${({ theme }) => theme.spacing(5)};
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
