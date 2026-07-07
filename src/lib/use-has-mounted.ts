'use client';

import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};

/**
 * `useDonationStore` persists to `sessionStorage` and only has the real
 * (possibly mid-wizard) draft once the browser has rehydrated it — on the
 * server, and on the very first client render (the one React matches
 * against the server HTML), it's still the pristine initial draft. Reading
 * the store straight into a form's `defaultValues` would capture whichever
 * of those two snapshots happened to render first, sometimes the wrong one,
 * and — worse — risks a hydration mismatch if any store-derived text ever
 * differed between the two passes. Gating the form behind this flag defers
 * mounting it (and reading the store into `useForm`'s `defaultValues`) to
 * the first *client-only* render, by which point rehydration has settled.
 *
 * Built on `useSyncExternalStore`'s server/client snapshot split rather than
 * the classic `useState(false)` + `useEffect(() => setState(true))` "mount
 * flag": that pattern calls `setState` synchronously inside an effect, which
 * `react-hooks/set-state-in-effect` flags — `useSyncExternalStore` is the
 * mechanism React actually ships for "render one thing during hydration,
 * then something else once mounted" without that cascading-render footgun.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
