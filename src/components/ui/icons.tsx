export interface CheckIconProps {
  size: 12 | 16;
}

// Hand-tuned per size (not a uniform scale of one path) to match the
// original per-component SVGs — `Checkbox`'s 12px check-state glyph and
// `Stepper`'s 16px "done" glyph — pixel-for-pixel.
const CHECK_PATHS: Record<CheckIconProps['size'], string> = {
  12: 'M2.5 6L5 8.5L9.5 3.5',
  16: 'M3.5 8.5L6.5 11.5L12.5 4.5',
};

/**
 * Shared checkmark glyph, deduplicated out of `Checkbox` (12px, inside its
 * checked-state box) and `Stepper` (16px, inside a "done" step circle) —
 * both used the same stroke treatment, just at different sizes.
 */
export function CheckIcon({ size }: CheckIconProps) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <path
        d={CHECK_PATHS[size]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
