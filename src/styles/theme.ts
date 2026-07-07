/**
 * Design tokens for GoodBoy — sourced from the confirmed Figma variables
 * (Components page, "Color Scheme" section). This is the single source of
 * truth for colors, typography, radii, spacing and breakpoints; all styling
 * in the app should consume these tokens rather than hard-coded values.
 */

export interface ThemeColors {
  /** action/primary — CTA buttons, active states, stepper active */
  primary: string;
  /** active/selected backgrounds */
  primaryLight: string;
  /** focus ring / subtle highlight */
  primaryFocus: string;
  /** headings, primary body text */
  textPrimary: string;
  /** secondary text */
  textSecondary: string;
  /** labels */
  textTertiary: string;
  /** placeholders, disabled text */
  textMuted: string;
  /** input borders, dividers */
  border: string;
  /** secondary-action backgrounds, chips */
  surface: string;
  /** page background */
  surfacePage: string;
  white: string;
  /** Figma `color/base/state/error/fg` — validation/error text & borders */
  error: string;
  /** text rendered on top of primary-colored buttons */
  inverseText: string;
  /** SK/CZ flag asset only (`flags.tsx`) — flag-standard blue, not a UI color */
  flagBlue: string;
  /** SK/CZ flag asset only (`flags.tsx`) — flag-standard red, not a UI color */
  flagRed: string;
}

export interface TypographyStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export interface ThemeTypography {
  /** step headings */
  headingXl: TypographyStyle;
  /** big numbers, O projekte */
  metric: TypographyStyle;
  /** section titles */
  section: TypographyStyle;
  /** emphasized body text, buttons */
  bodySemibold: TypographyStyle;
  /** inputs, nav */
  bodyMedium: TypographyStyle;
  /** body text (most common) */
  body: TypographyStyle;
  /** form labels, stepper */
  labelMedium: TypographyStyle;
  /** supporting text */
  caption: TypographyStyle;
}

export interface ThemeRadii {
  sm: string;
  md: string;
  lg: string;
  image: string;
}

export interface ThemeBreakpoints {
  md: string;
  lg: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  radii: ThemeRadii;
  /** `spacing(n)` returns `n * 4` px, e.g. `spacing(2)` -> `'8px'` */
  spacing: (n: number) => string;
  breakpoints: ThemeBreakpoints;
  /** CSS font-family stack; references the `next/font/google` CSS variable set on <html> */
  fontFamily: string;
}

export const theme: Theme = {
  colors: {
    primary: '#4F46E5',
    primaryLight: '#E0E7FF',
    primaryFocus: 'rgba(165, 180, 252, 0.1)',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#D1D5DB',
    surface: '#F3F4F6',
    surfacePage: '#FAFAFA',
    white: '#FFFFFF',
    error: '#BE123C',
    inverseText: '#FAFAFA',
    flagBlue: '#0052B4',
    flagRed: '#D80027',
  },
  typography: {
    headingXl: {
      fontSize: '48px',
      lineHeight: '56px',
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    metric: {
      fontSize: '60px',
      lineHeight: '72px',
      fontWeight: 400,
      letterSpacing: '-0.3px',
    },
    section: {
      fontSize: '20px',
      lineHeight: '32px',
      fontWeight: 600,
    },
    bodySemibold: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 600,
    },
    bodyMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
    },
    body: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    labelMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    caption: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
  },
  radii: {
    sm: '8px',
    md: '16px',
    lg: '32px',
    image: '20px',
  },
  spacing: (n: number) => `${n * 4}px`,
  breakpoints: {
    md: '768px',
    lg: '1200px',
  },
  fontFamily:
    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};
