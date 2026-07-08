'use client';

import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { VisuallyHidden, visuallyHiddenStyles } from '@/components/ui/VisuallyHidden';
import { CheckIcon } from '@/components/ui/icons';

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

// Mobile overflow fix: labels collapse to the active step below \`md\` so the
// row can never overflow narrow viewports; hidden labels stay in the
// accessibility tree (see \`Label\` below). Below \`md\`, a non-active,
// non-last item's only in-flow content is its 32px circle — \`flex: 0 0 auto\`
// sizes it to exactly that instead of stretching it to an equal third,
// freeing up the row for the active item's label. The active item gets
// \`1 1 auto\` so it can grow into that freed space (and still shrink under
// \`min-width: 0\` as a last resort — see \`Label\`'s own overflow/ellipsis
// fallback). \`≥md\` restores the original equal-thirds split unconditionally,
// since every label is visible there again. The last item is always
// content-sized (never has a connector to stretch), at every width and
// status — that higher-specificity \`:last-child\` rule wins over both the
// status-based default and the \`≥md\` override below.
const Item = styled.li<{ $status: StepStatus }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  height: 32px;
  min-width: 0;
  flex: ${({ $status }) => ($status === 'current' ? '1 1 auto' : '0 0 auto')};

  &:last-child {
    flex: 0 0 auto;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex: 1 0 0;
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

// Mobile overflow fix, part 2: below \`md\`, a non-active label is visually
// hidden via the same clip-rect technique as \`VisuallyHidden\` (NOT
// \`display: none\`, which would drop it from the accessibility tree) —
// screen readers still announce it, but \`position: absolute\` also takes it
// out of flow so it stops competing with the other items for row width.
// \`≥md\` resets it back to normal flow so every label is visible again,
// unchanged from before this fix. \`min-width: 0\` + \`overflow/text-overflow\`
// on the active label is a belt-and-suspenders truncation fallback: even if
// some future translation is too long for the space \`Item\` above frees up
// at the very narrowest supported width (320px), it ellipsizes instead of
// forcing a horizontal scrollbar.
const Label = styled.span<{ $status: StepStatus }>`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme, $status }) => ($status === 'upcoming' ? theme.colors.border : theme.colors.textPrimary)};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ $status, theme }) =>
    $status !== 'current' &&
    css`
      ${visuallyHiddenStyles}

      @media (min-width: ${theme.breakpoints.md}) {
        position: static;
        width: auto;
        height: auto;
        margin: 0;
        overflow: visible;
        clip: auto;
      }
    `}
`;

const Connector = styled.span`
  flex: 1 0 0;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

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
            <Item key={key} $status={status} aria-current={status === 'current' ? 'step' : undefined}>
              <Circle $status={status}>
                {status === 'done' ? (
                  <>
                    <CheckIcon size={16} />
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
