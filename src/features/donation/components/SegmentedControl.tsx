'use client';

import { useRef, type KeyboardEvent } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import type { HelpType } from '../store';

export interface SegmentedControlProps {
  value: HelpType;
  onChange: (value: HelpType) => void;
}

// Order matches the Figma "Step 1" frame — left option contributes to a
// single shelter, right option to the foundation as a whole.
const OPTIONS = ['shelter', 'foundation'] as const satisfies readonly HelpType[];

const LABEL_KEYS: Record<HelpType, string> = {
  shelter: 'step1.helpShelter',
  foundation: 'step1.helpFoundation',
};

const Group = styled.div`
  display: flex;
  width: 100%;
  /* min-height instead of a fixed height: long labels may wrap on narrow
     viewports and the whole control must grow rather than clip the text. */
  min-height: 60px;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.white};
`;

const Option = styled.button<{ $active: boolean }>`
  flex: 1 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  /* Figma renders the inner pill at a slightly tighter radius than the
     60px-tall outer track (theme.radii.md = 16px) — no token matches this
     exactly, so it's a literal measured off the design PNG. */
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast} ease, color ${({ theme }) => theme.motion.fast} ease;

  ${({ $active, theme }) =>
    $active
      ? css`
          background: ${theme.colors.primary};
          color: ${theme.colors.inverseText};
        `
      : css`
          background: transparent;
          color: ${theme.colors.textPrimary};
        `}
`;

/**
 * Two-way "help a shelter" / "help the foundation" toggle, modeled as an
 * ARIA `radiogroup` (two `radio` buttons) rather than native radio inputs so
 * it can be styled as a segmented control while keeping the standard
 * roving-tabindex + arrow-key keyboard pattern screen readers expect from a
 * radio group.
 */
export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const { t } = useTranslation('donation');
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();

    const nextIndex =
      event.key === 'ArrowRight' ? (index + 1) % OPTIONS.length : (index - 1 + OPTIONS.length) % OPTIONS.length;

    onChange(OPTIONS[nextIndex]);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <Group role="radiogroup" aria-label={t('step1.helpAriaLabel')}>
      {OPTIONS.map((option, index) => {
        const active = value === option;
        return (
          <Option
            key={option}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            $active={active}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {t(LABEL_KEYS[option])}
          </Option>
        );
      })}
    </Group>
  );
}
