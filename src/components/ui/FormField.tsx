'use client';

import styled from 'styled-components';
import type { ReactNode } from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  optionalHint?: string;
  children: ReactNode;
}

/**
 * a11y wiring contract: `FormField` renders the `<label htmlFor={id}>` and
 * the error slot, but never clones `children` to inject `aria-invalid`/
 * `aria-describedby` onto the input — instead the caller spreads
 * `fieldA11yProps(id, error)` onto whatever form control it renders inside.
 * This keeps `FormField` agnostic of the input's implementation (works with
 * `TextInput`, a native `<select>`, etc.) at the cost of one extra spread at
 * the call site:
 *
 * ```tsx
 * <FormField id="email" label="E-mail" error={error}>
 *   <TextInput {...fieldA11yProps('email', error)} />
 * </FormField>
 * ```
 */
export function fieldA11yProps(id: string, error?: string) {
  return {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

/**
 * Id of this field's `<label>` element (see `Label` below). Exposed so a
 * `children` implementation that can't rely on native `<label for>`
 * association in one of its states — e.g. `ShelterSelect` swapping its
 * `<select>` for a non-labelable retry `role="group"` when the shelters
 * request fails — can still point an `aria-labelledby` at the real label
 * instead of going unlabelled.
 */
export function fieldLabelId(id: string): string {
  return `${id}-label`;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.labelMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.labelMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.labelMedium.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// `textTertiary`, not `textMuted` — this renders real, always-visible
// instructional text ("(Nepovinné)"), not a placeholder/decorative hint, and
// `textMuted` (#9CA3AF, ~2.5:1 on white) fails WCAG AA's 4.5:1 text
// contrast; `textTertiary` (~7.5:1) passes comfortably.
const OptionalHint = styled.span`
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;

export function FormField({ id, label, error, optionalHint, children }: FormFieldProps) {
  return (
    <Wrapper>
      <Label id={fieldLabelId(id)} htmlFor={id}>
        {label}
        {optionalHint ? <>{' '}<OptionalHint>({optionalHint})</OptionalHint></> : null}
      </Label>
      {children}
      {/* Always mounted so a later-appearing error is announced by AT;
          empty when there's nothing to say. */}
      <div aria-live="polite">{error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : null}</div>
    </Wrapper>
  );
}
