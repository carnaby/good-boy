'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';

export interface SiteFooterProps {
  /** Wizard steps show social links; standalone pages (Kontakt, O projekte)
   * don't (per Figma). Defaults to hidden. */
  showSocials?: boolean;
}

const Wrapper = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
  padding-top: ${({ theme }) => theme.spacing(6)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const RightContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(8)};
`;

const Socials = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textTertiary};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const NavLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

// Hand-coded minimalist glyphs (Figma's Social Icon components require a
// desktop-app layer selection to export, which isn't available in this
// environment) — decorative only, `aria-hidden` inside the labelled <a>.
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10.6667 2H8.66667C7.78261 2 6.93477 2.35119 6.30965 2.97631C5.68453 3.60143 5.33333 4.44928 5.33333 5.33333V7.33333H3.33333V9.66667H5.33333V14H7.66667V9.66667H9.66667L10 7.33333H7.66667V5.33333C7.66667 5.05711 7.77625 4.79213 7.97141 4.59697C8.16658 4.4018 8.43155 4.29222 8.70778 4.29222H10.6667V2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Site-wide footer: Logo, optional social links, and Kontakt/O projekte
 * nav — sits at the bottom of the wizard content column (via
 * `WizardLayout`) or is rendered directly by standalone pages.
 */
export function SiteFooter({ showSocials = false }: SiteFooterProps) {
  const { t } = useTranslation('common');

  return (
    <Wrapper>
      <Logo />
      <RightContent>
        {showSocials ? (
          <Socials>
            <SocialLink
              href="https://www.facebook.com"
              aria-label={t('social.facebook')}
              target="_blank"
              rel="noreferrer"
            >
              <FacebookGlyph />
            </SocialLink>
            <SocialLink
              href="https://www.instagram.com"
              aria-label={t('social.instagram')}
              target="_blank"
              rel="noreferrer"
            >
              <InstagramGlyph />
            </SocialLink>
          </Socials>
        ) : null}
        <NavLink href="/kontakt">{t('nav.contact')}</NavLink>
        <NavLink href="/o-projekte">{t('nav.about')}</NavLink>
      </RightContent>
    </Wrapper>
  );
}
