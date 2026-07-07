'use client';

import { useId } from 'react';
import { useTheme } from 'styled-components';

/**
 * Inline 20×14 country flags for `PrefixCombobox` (SK/CZ phone prefixes).
 * Always `aria-hidden` — the accessible name for "this option is Slovensko"
 * comes from adjacent text (visible prefix code + `VisuallyHidden` country
 * name in the caller), never from the flag graphic itself.
 *
 * Colors: `theme.colors.flagBlue`/`flagRed` are flag-standard hex values
 * (#0052B4 / #D80027, see docs/design/tokens.md), not part of the app's UI
 * palette — they're modeled as dedicated theme tokens (rather than literals)
 * so this is the one file that reads them.
 *
 * Each flag clips its colored bands to a `rx=2` rounded rect via a
 * per-instance `<clipPath>` (id via `useId()`, not a shared static id) so
 * two flags rendered at once — the trigger's selected flag and the two
 * dropdown options — never collide on a duplicate DOM id.
 */

const FLAG_WIDTH = 20;
const FLAG_HEIGHT = 14;

export function SkFlag() {
  const theme = useTheme();
  const clipId = `${useId()}-flag-clip`;
  const stripeHeight = FLAG_HEIGHT / 3;

  return (
    <svg
      width={FLAG_WIDTH}
      height={FLAG_HEIGHT}
      viewBox={`0 0 ${FLAG_WIDTH} ${FLAG_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clipId}>
        <rect width={FLAG_WIDTH} height={FLAG_HEIGHT} rx="2" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width={FLAG_WIDTH} height={FLAG_HEIGHT} fill={theme.colors.white} />
        <rect y={stripeHeight} width={FLAG_WIDTH} height={stripeHeight} fill={theme.colors.flagBlue} />
        <rect
          y={stripeHeight * 2}
          width={FLAG_WIDTH}
          height={FLAG_HEIGHT - stripeHeight * 2}
          fill={theme.colors.flagRed}
        />
        {/* Simplified double-cross emblem: a small shield on the left third,
            white cross bars over a flag-red fill — not a heraldically exact
            rendering, just recognizable at 20px. */}
        <path d="M4 3H8.4V8C8.4 10 6.6 11.4 6.2 11.6C5.8 11.4 4 10 4 8V3Z" fill={theme.colors.flagRed} />
        <rect x="5.7" y="4" width="1" height="6" fill={theme.colors.white} />
        <rect x="4.6" y="5" width="3.2" height="1" fill={theme.colors.white} />
        <rect x="4.9" y="7.4" width="2.6" height="1" fill={theme.colors.white} />
      </g>
      <rect
        x="0.5"
        y="0.5"
        width={FLAG_WIDTH - 1}
        height={FLAG_HEIGHT - 1}
        rx="1.5"
        fill="none"
        stroke={theme.colors.border}
      />
    </svg>
  );
}

export function CzFlag() {
  const theme = useTheme();
  const clipId = `${useId()}-flag-clip`;

  return (
    <svg
      width={FLAG_WIDTH}
      height={FLAG_HEIGHT}
      viewBox={`0 0 ${FLAG_WIDTH} ${FLAG_HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clipId}>
        <rect width={FLAG_WIDTH} height={FLAG_HEIGHT} rx="2" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width={FLAG_WIDTH} height={FLAG_HEIGHT / 2} fill={theme.colors.white} />
        <rect y={FLAG_HEIGHT / 2} width={FLAG_WIDTH} height={FLAG_HEIGHT / 2} fill={theme.colors.flagRed} />
        <path
          d={`M0 0L${FLAG_WIDTH / 2} ${FLAG_HEIGHT / 2}L0 ${FLAG_HEIGHT}Z`}
          fill={theme.colors.flagBlue}
        />
      </g>
      <rect
        x="0.5"
        y="0.5"
        width={FLAG_WIDTH - 1}
        height={FLAG_HEIGHT - 1}
        rx="1.5"
        fill="none"
        stroke={theme.colors.border}
      />
    </svg>
  );
}
