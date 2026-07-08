'use client';

import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

// Off-screen (not `VisuallyHidden`'s permanent clip — this needs to become
// visible again on focus) until focused, then pinned to the top-left corner
// above everything else. `:focus` (not `:focus-visible`) on purpose: a
// keyboard user tabbing from a fresh page load is by far the only realistic
// way to focus this link — it renders off-screen, so a mouse can't click it
// — and older Safari's patchy `:focus-visible` support on anchors would
// otherwise risk it never becoming visible at all.
const StyledSkipLink = styled.a`
  position: absolute;
  top: -100px;
  left: ${({ theme }) => theme.spacing(4)};
  z-index: 2000;
  padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.inverseText};
  font-size: ${({ theme }) => theme.typography.bodyMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.bodyMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodyMedium.fontWeight};

  &:focus {
    top: ${({ theme }) => theme.spacing(4)};
  }
`;

/**
 * "Preskočiť na obsah" — first focusable element in the document (rendered
 * by `RootLayout`, before `children`), letting keyboard/screen-reader users
 * jump straight past the header/stepper chrome to `#main-content` (the
 * `<main>` landmark every page renders — see `WizardLayout`/`PageLayout`).
 */
export function SkipLink() {
  const { t } = useTranslation('common');

  return <StyledSkipLink href="#main-content">{t('skipToContent')}</StyledSkipLink>;
}
