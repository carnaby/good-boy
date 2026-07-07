'use client';

import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';

export interface StepperProps {
  current: 1 | 2 | 3;
}

type StepStatus = 'done' | 'current' | 'upcoming';

// Order matches the Figma "Step 1" frame (node 6513:292): the i18n keys under
// `donation:steps.*` resolve the visible labels.
const STEP_KEYS = ['help', 'personal', 'confirmation'] as const;

const Nav = styled.nav`
  width: 100%;
`;

const List = styled.ol`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  height: 32px;
  flex: 1 0 0;
  min-width: 0;

  &:last-child {
    flex: 0 0 auto;
  }
`;

const Circle = styled.span<{ $status: StepStatus }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};

  ${({ $status, theme }) => {
    if ($status === 'current') {
      return css`
        background: ${theme.colors.primary};
        border: 1px solid ${theme.colors.primary};
        color: ${theme.colors.inverseText};
      `;
    }
    if ($status === 'done') {
      return css`
        background: ${theme.colors.white};
        border: 1px solid ${theme.colors.primary};
        color: ${theme.colors.primary};
      `;
    }
    return css`
      background: ${theme.colors.white};
      border: 1px solid ${theme.colors.surface};
      color: ${theme.colors.border};
    `;
  }}
`;

const Label = styled.span<{ $status: StepStatus }>`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme, $status }) => ($status === 'upcoming' ? theme.colors.border : theme.colors.textPrimary)};
  white-space: nowrap;
`;

const Connector = styled.span`
  flex: 1 0 0;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function statusOf(stepNumber: number, current: number): StepStatus {
  if (stepNumber < current) return 'done';
  if (stepNumber === current) return 'current';
  return 'upcoming';
}

/**
 * 3-step donation-form progress indicator. `current` is the 1-indexed active
 * step; steps before it render as "done" (outlined check), the active one as
 * a filled circle with its number, and steps after it as muted/"upcoming".
 */
export function Stepper({ current }: StepperProps) {
  const { t } = useTranslation('donation');

  return (
    <Nav aria-label={t('steps.ariaLabel')}>
      <List>
        {STEP_KEYS.map((key, index) => {
          const stepNumber = index + 1;
          const status = statusOf(stepNumber, current);
          const isLast = index === STEP_KEYS.length - 1;

          return (
            <Item key={key} aria-current={status === 'current' ? 'step' : undefined}>
              <Circle $status={status}>
                {status === 'done' ? (
                  <>
                    <CheckIcon />
                    <VisuallyHidden>{t('steps.done')}</VisuallyHidden>
                  </>
                ) : (
                  stepNumber
                )}
              </Circle>
              <Label $status={status}>{t(`steps.${key}`)}</Label>
              {isLast ? null : <Connector aria-hidden="true" />}
            </Item>
          );
        })}
      </List>
    </Nav>
  );
}
