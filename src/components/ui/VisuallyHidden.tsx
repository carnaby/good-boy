import styled, { css } from 'styled-components';

/**
 * The "clip" technique itself, exported so other components can apply it
 * conditionally (e.g. `Stepper`'s non-active labels below `md`) without
 * duplicating the declarations — not `display: none` / `visibility: hidden`,
 * which would remove content from screen readers too.
 */
export const visuallyHiddenStyles = css`
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

/**
 * Visually hides content while keeping it in the accessibility tree — the
 * standard "clip" technique (not `display: none` / `visibility: hidden`,
 * which would remove it from screen readers too).
 */
export const VisuallyHidden = styled.span`
  ${visuallyHiddenStyles}
`;
