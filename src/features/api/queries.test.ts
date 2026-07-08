import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook } from '@testing-library/react';
import { Providers } from '@/lib/providers';
import { useResults } from './queries';
import { defaultResults, server } from './testing/handlers';

/**
 * `useResults` polls the live metrics endpoint via `refetchInterval: 15_000`
 * (see `queries.ts`) so the counter on `/o-projekte` stays live without a
 * manual refresh. This pins that behavior end to end: fake timers stand in
 * for the real 15s wait, and a request counter in the MSW handler proves a
 * second (then third) request actually fires rather than the interval being
 * a one-shot delay.
 *
 * Fake timers must be installed BEFORE the hook mounts: TanStack Query's
 * `refetchInterval` is scheduled via a plain `setInterval` call made the
 * moment the first fetch settles, so faking the clock only after that point
 * would leave the real interval already ticking on the real clock instead.
 * `advanceTimersByTimeAsync` (not the sync `advanceTimersByTime`) is required
 * throughout because settling a query is itself async (the mocked `fetch`
 * response resolves via a promise chain) — the async variant flushes
 * microtasks between each simulated tick so that chain gets to run.
 */
describe('useResults polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires a new request every 15s while mounted', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/api/v1/shelters/results', () => {
        requestCount += 1;
        return HttpResponse.json(defaultResults);
      })
    );

    const { result } = renderHook(() => useResults(), { wrapper: Providers });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestCount).toBe(1);

    await vi.advanceTimersByTimeAsync(15_000);
    expect(requestCount).toBe(2);

    await vi.advanceTimersByTimeAsync(15_000);
    expect(requestCount).toBe(3);
  });
});
