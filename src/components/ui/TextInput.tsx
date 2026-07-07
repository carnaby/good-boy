'use client';

import styled from 'styled-components';
import type { InputHTMLAttributes } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  error?: boolean;
}

/**
 * Text field — h56, `radii.sm`, `surface` background, no visible border by
 * default (Figma Components page "Input field / State=Base"); a 1px `error`
 * border appears only when `error` is set ("State=Error"), with the border
 * always reserved (transparent) so toggling `error` never shifts layout.
 */
const StyledInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.error : 'transparent')};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  font-weight: ${({ theme }) => theme.typography.body.fontWeight};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:disabled {
    opacity: 0.32;
    cursor: not-allowed;
  }
`;

export function TextInput({ error, ...rest }: TextInputProps) {
  return <StyledInput $error={error} {...rest} />;
}
