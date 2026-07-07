'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';

export interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  disabled?: boolean;
  /** Wires the hidden native input to an external error message, mirroring `fieldA11yProps`. */
  'aria-describedby'?: string;
  children: ReactNode;
}

// Native checkbox input, visually hidden (clip, not display:none, so it stays
// in the a11y tree and keyboard/AT-focusable) — the `Box` sibling renders the
// visible 20x20 square per Figma "Checkbox sm" and reacts to the real input's
// checked/focus-visible/disabled state via CSS.
const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const LabelRow = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  min-height: 44px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.32 : 1)};
`;

const Box = styled.span<{ $checked: boolean; $error?: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.white)};
  border: 1px solid
    ${({ theme, $checked, $error }) => {
      if ($error) return theme.colors.error;
      return $checked ? theme.colors.primary : theme.colors.border;
    }};

  ${HiddenInput}:focus-visible + & {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const LabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6L5 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  error,
  disabled,
  'aria-describedby': ariaDescribedBy,
  children,
}: CheckboxProps) {
  return (
    <LabelRow htmlFor={id} $disabled={disabled}>
      <HiddenInput
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      <Box $checked={checked} $error={error}>
        {checked ? <CheckIcon /> : null}
      </Box>
      <LabelText>{children}</LabelText>
    </LabelRow>
  );
}
