'use client';

import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/layout/PageLayout';
import { SiteFooter } from '@/components/layout/SiteFooter';

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(8)};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.bodyMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.bodyMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodyMedium.fontWeight};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 8H3M3 8L7.5 3.5M3 8L7.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Heading = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing(15)};
  font-size: ${({ theme }) => theme.typography.headingXl.fontSize};
  line-height: ${({ theme }) => theme.typography.headingXl.lineHeight};
  font-weight: ${({ theme }) => theme.typography.headingXl.fontWeight};
  letter-spacing: ${({ theme }) => theme.typography.headingXl.letterSpacing};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// Single column below `md` (cards stack), three equal columns from `md` up
// (Figma: 384px cards in a 1216px row — reproduced here as fractional
// columns so it fits `PageLayout`'s actual content width instead).
const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing(15)};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const IconCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  border-radius: 9999px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};

  svg {
    width: 24px;
    height: 24px;
  }
`;

const CardTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  font-size: ${({ theme }) => theme.typography.section.fontSize};
  line-height: ${({ theme }) => theme.typography.section.lineHeight};
  font-weight: ${({ theme }) => theme.typography.section.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CardText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(4)};
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CardLink = styled.a`
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PhotoBand = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 1;
  margin-bottom: ${({ theme }) => theme.spacing(15)};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

// Hand-coded outline glyphs (Feather-style, 24px, `currentColor` stroke) —
// Figma's icon components require a desktop-app layer selection to export,
// which isn't available in this environment. Decorative only: `aria-hidden`
// inside the labelled card, same pattern as `SiteFooter`'s social glyphs.
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * `/kontakt` — back link + h1, a 3-card row (e-mail / office address / phone,
 * each with a `mailto:` / Google Maps / `tel:` link derived from
 * `contact.json` so the visible text and the href are always in sync), and
 * a decorative photo band. Static content, no data fetching.
 */
export function ContactContent() {
  const { t } = useTranslation('contact');
  const { t: tCommon } = useTranslation('common');

  const email = t('cards.email.value');
  const office = t('cards.office.value');
  const phone = t('cards.phone.value');

  const cards = [
    {
      key: 'email',
      icon: <MailIcon />,
      title: t('cards.email.title'),
      supportingText: t('cards.email.supportingText'),
      value: email,
      href: `mailto:${email}`,
    },
    {
      key: 'office',
      icon: <MapPinIcon />,
      title: t('cards.office.title'),
      supportingText: t('cards.office.supportingText'),
      value: office,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office)}`,
      external: true,
    },
    {
      key: 'phone',
      icon: <PhoneIcon />,
      title: t('cards.phone.title'),
      supportingText: t('cards.phone.supportingText'),
      value: phone,
      href: `tel:${phone.replace(/\s+/g, '')}`,
    },
  ];

  return (
    <PageLayout footer={<SiteFooter />}>
      <BackLink href="/">
        <ArrowLeftIcon />
        {tCommon('actions.back')}
      </BackLink>
      <Heading>{t('heading')}</Heading>
      <CardsGrid>
        {cards.map((card) => (
          <Card key={card.key}>
            <IconCircle>{card.icon}</IconCircle>
            <CardTitle>{card.title}</CardTitle>
            <CardText>{card.supportingText}</CardText>
            <CardLink href={card.href} {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {card.value}
            </CardLink>
          </Card>
        ))}
      </CardsGrid>
      <PhotoBand>
        <Image src="/images/dog-kontakt.jpg" alt="" fill sizes="100vw" style={{ objectFit: 'cover' }} />
      </PhotoBand>
    </PageLayout>
  );
}
