'use client';

import styled, { css } from 'styled-components';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

// Figma "Button" component (Components page, node 273:2331 Primary/xl/Base and
// its Secondary/Disable siblings) renders every size at `rounded-[8px]` — a
// radius measured directly from the real button instances (both here and in
// the Step 1 frame), so this uses `theme.radii.sm` rather than the larger
// `md` (16) token its name might otherwise suggest.
const StyledButton = styled.button<{ $variant: ButtonProps['variant'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  height: 56px;
  padding: 0 ${({ theme }) => theme.spacing(8)};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  white-space: nowrap;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast} ease,
    color ${({ theme }) => theme.motion.fast} ease, opacity ${({ theme }) => theme.motion.fast} ease;

  ${({ $variant, theme }) =>
    $variant === 'primary'
      ? css`
          background: ${theme.colors.primary};
          color: ${theme.colors.inverseText};
        `
      : css`
          background: ${theme.colors.surface};
          /* Figma's Secondary/Base button text is #374151 = theme.colors.textSecondary,
             sampled directly from the live component instance. */
          color: ${theme.colors.textSecondary};
        `}

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    /* Figma Components page: disabled buttons render at 32% opacity
       (opacity-32 on both Primary and Secondary/Disable variants). */
    opacity: 0.32;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

/**
 * Primary/secondary action button — h56, `radii.sm`, Body Semi Bold label.
 * `:focus-visible` styling is inherited from the global reset (no override
 * here), so keyboard focus always shows a ring.
 */
export function Button({ variant, iconLeft, iconRight, children, ...rest }: ButtonProps) {
  return (
    <StyledButton type="button" {...rest} $variant={variant}>
      {iconLeft}
      {children}
      {iconRight}
    </StyledButton>
  );
}
