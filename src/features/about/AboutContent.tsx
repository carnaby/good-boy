'use client';

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/layout/PageLayout';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Toast } from '@/components/ui/Toast';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { useResults } from '@/features/api/queries';

// The query param Step3 pushes to (`router.push('/o-projekte?stav=dakujeme')`)
// on a successful contribution, and the value that means "show the success toast".
const TOAST_QUERY_PARAM = 'stav';
const TOAST_QUERY_VALUE = 'dakujeme';

function formatCollected(contribution: number | null): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(contribution ?? 0);
}

function formatContributors(contributors: number): string {
  return new Intl.NumberFormat('sk-SK').format(contributors);
}

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
  margin: 0 0 ${({ theme }) => theme.spacing(8)};
  font-size: ${({ theme }) => theme.typography.headingXl.fontSize};
  line-height: ${({ theme }) => theme.typography.headingXl.lineHeight};
  font-weight: ${({ theme }) => theme.typography.headingXl.fontWeight};
  letter-spacing: ${({ theme }) => theme.typography.headingXl.letterSpacing};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Paragraph = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// Stacked below \`md\` (the 60px metric numerals need their own line on a
// phone), side by side from \`md\` up.
const MetricsBand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(10)};
  width: 100%;
  margin: ${({ theme }) => theme.spacing(10)} 0;
  padding: ${({ theme }) => theme.spacing(10)} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  }
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing(2)};
  /* metric.lineHeight (72px) + gap (8px) + body.lineHeight (24px) — fixed so
     the loading -> loaded swap never shifts surrounding layout. */
  min-height: 104px;
`;

const MetricValue = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.metric.fontSize};
  line-height: ${({ theme }) => theme.typography.metric.lineHeight};
  font-weight: ${({ theme }) => theme.typography.metric.fontWeight};
  letter-spacing: ${({ theme }) => theme.typography.metric.letterSpacing};
  color: ${({ theme }) => theme.colors.primary};
`;

const MetricLabel = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const MetricSkeleton = styled.div`
  width: 220px;
  max-width: 100%;
  height: ${({ theme }) => theme.typography.metric.lineHeight};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
`;

// Punctuation, not copy (same convention as Step3's shelter-name fallback) —
// shown instead of the zero-fallback numbers on a failed `useResults`, since
// "0 €" / "0" would otherwise read as "nobody has donated" rather than "we
// don't know right now".
const METRIC_ERROR_FALLBACK = '—';

/**
 * `/o-projekte` — static intro/outro copy (verbatim from Figma) around a
 * live metrics band (`useResults`, already polled every 15s by the hook
 * itself; nothing extra to wire up here), plus the post-donation success
 * toast: Step3 redirects here with `?stav=dakujeme` on a successful submit,
 * and this component is responsible for showing the toast AND cleaning the
 * URL back to the bare route so a refresh/share never re-triggers it.
 */
export function AboutContent() {
  const { t } = useTranslation('about');
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useResults();

  // Captured once, at mount — NOT re-derived on every render off
  // `searchParams`, so the toast stays visible even after the `replace`
  // below strips the query param from the URL.
  const [showToast, setShowToast] = useState(() => searchParams.get(TOAST_QUERY_PARAM) === TOAST_QUERY_VALUE);

  useEffect(() => {
    // Truthfully depends on `showToast`: it only ever flips true -> false
    // (via the Toast's onClose below), at which point this re-runs but the
    // condition is already false, so `replace` still fires exactly once.
    if (showToast) {
      router.replace('/o-projekte');
    }
  }, [showToast, router]);

  return (
    <PageLayout footer={<SiteFooter />}>
      <BackLink href="/">
        <ArrowLeftIcon />
        {tCommon('actions.back')}
      </BackLink>
      <Heading>{t('heading')}</Heading>
      <Paragraph>{t('intro')}</Paragraph>
      <MetricsBand>
        {/* `role="status"` (implicit `aria-live="polite"` + `aria-atomic`) so
            screen readers announce the loading state instead of silently
            swapping to the skeletons. */}
        {isLoading ? <VisuallyHidden role="status">{t('metrics.loading')}</VisuallyHidden> : null}
        <MetricItem>
          {isLoading ? (
            <MetricSkeleton aria-hidden="true" />
          ) : (
            <MetricValue>
              {isError ? METRIC_ERROR_FALLBACK : formatCollected(data?.contribution ?? null)}
            </MetricValue>
          )}
          <MetricLabel>{t('metrics.collectedLabel')}</MetricLabel>
        </MetricItem>
        <MetricItem>
          {isLoading ? (
            <MetricSkeleton aria-hidden="true" />
          ) : (
            <MetricValue>
              {isError ? METRIC_ERROR_FALLBACK : formatContributors(data?.contributors ?? 0)}
            </MetricValue>
          )}
          <MetricLabel>{t('metrics.contributorsLabel')}</MetricLabel>
        </MetricItem>
      </MetricsBand>
      <Paragraph>{t('outro')}</Paragraph>
      {showToast ? <Toast message={t('toast.success')} onClose={() => setShowToast(false)} /> : null}
    </PageLayout>
  );
}
