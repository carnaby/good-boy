import type { PhonePrefix } from './store';

/**
 * Per-prefix phone metadata (country + expected national-number length,
 * digits only, prefix excluded). Both currently-supported prefixes take
 * 9-digit national numbers, but `stepPersonalSchema` looks this up per
 * `phonePrefix` rather than hardcoding 9 so the table is the single source
 * of truth if that ever changes.
 */
export const PHONE_PREFIXES: Record<PhonePrefix, { country: 'SK' | 'CZ'; nationalLength: number }> = {
  '+421': { country: 'SK', nationalLength: 9 },
  '+420': { country: 'CZ', nationalLength: 9 },
};

/** Strips all whitespace from a phone number, e.g. '902 237 207' -> '902237207'. */
export function normalizePhone(input: string): string {
  return input.replace(/\s/g, '');
}
