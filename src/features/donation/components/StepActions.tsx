'use client';

import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export interface StepActionsProps {
  onBack?: () => void;
  backDisabled?: boolean;
  nextLabel: string;
  nextType?: 'button' | 'submit';
}

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16 10H4M4 10L9 5M4 10L9 15"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10H16M16 10L11 5M16 10L11 15"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Bottom action row for a wizard step ("Späť" / next). The back button only
 * renders when `onBack` is supplied — Step 1 still passes `onBack` but with
 * `backDisabled` (per Figma, it renders disabled rather than being absent).
 */
export function StepActions({ onBack, backDisabled, nextLabel, nextType = 'submit' }: StepActionsProps) {
  const { t } = useTranslation('common');

  return (
    <Row>
      {onBack ? (
        <Button type="button" variant="secondary" iconLeft={<ArrowLeftIcon />} onClick={onBack} disabled={backDisabled}>
          {t('actions.back')}
        </Button>
      ) : (
        <span />
      )}
      <Button type={nextType} variant="primary" iconRight={<ArrowRightIcon />}>
        {nextLabel}
      </Button>
    </Row>
  );
}
