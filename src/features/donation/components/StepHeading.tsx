'use client';

import { forwardRef, useEffect, useRef, type ReactNode } from 'react';
import styled from 'styled-components';

export interface StepHeadingProps {
  children: ReactNode;
}

const Heading = styled.h1`
  width: 100%;
  margin: 0;
  font-size: ${({ theme }) => theme.typography.headingXl.fontSize};
  line-height: ${({ theme }) => theme.typography.headingXl.lineHeight};
  font-weight: ${({ theme }) => theme.typography.headingXl.fontWeight};
  letter-spacing: ${({ theme }) => theme.typography.headingXl.letterSpacing};
  color: ${({ theme }) => theme.colors.textPrimary};

  /* Programmatic focus (on mount) shouldn't show a ring — and since
     tabIndex={-1} takes it out of the tab order, a sighted keyboard user can
     never reach it via Tab to trigger :focus-visible in the first place. */
  &:focus {
    outline: none;
  }
`;

/**
 * Step title — h1, focused on mount so screen-reader users landing on a new
 * wizard step get an announcement (the "focus on step change" pattern:
 * mounting a new `StepHeading` per step, rather than updating text in place,
 * is what re-triggers this focus). Forwards its ref to the underlying `<h1>`
 * in addition to focusing it internally.
 */
export const StepHeading = forwardRef<HTMLHeadingElement, StepHeadingProps>(function StepHeading(
  { children },
  forwardedRef
) {
  const innerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    innerRef.current?.focus({ preventScroll: false });
  }, []);

  return (
    <Heading
      tabIndex={-1}
      ref={(node) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
    >
      {children}
    </Heading>
  );
});
