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

const OptionalHint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
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
      <Label htmlFor={id}>
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
