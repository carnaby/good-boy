import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ApiMessage } from '../schemas';

/**
 * MSW handlers + fixtures for the shelters API, used by both `client.test.ts`
 * (direct `apiFetch` calls) and any hook-level tests (`server.use(...)` to
 * override a single endpoint per test). `*` prefixes match the request path
 * regardless of origin, so these work whether or not `NEXT_PUBLIC_API_BASE`
 * is set in the test environment.
 */

export const defaultShelters: { id: number; name: string }[] = [
  { id: 1, name: 'Shelter One' },
  { id: 2, name: 'Shelter Two' },
];

export const defaultResults: { contributors: number; contribution: number | null } = {
  contributors: 128,
  contribution: 45230.5,
};

export const defaultContributeMessages: ApiMessage[] = [
  { message: 'Thank you for your contribution!', type: 'SUCCESS' },
];

/** Success handlers for all 3 endpoints; the baseline passed to `setupServer`. */
export const handlers = [
  http.get('*/api/v1/shelters/', () => HttpResponse.json({ shelters: defaultShelters })),
  http.get('*/api/v1/shelters/results', () => HttpResponse.json(defaultResults)),
  http.post('*/api/v1/shelters/contribute', () =>
    HttpResponse.json({ messages: defaultContributeMessages })
  ),
];

/** 400 response shaped like the API's joi validation errors for the given field paths. */
export function contributeValidationError(paths: string[]) {
  return http.post('*/api/v1/shelters/contribute', () =>
    HttpResponse.json(
      {
        messages: paths.map((path) => ({
          type: 'ERROR' as const,
          message: `joi.${path}`,
          path,
        })),
      },
      { status: 400 }
    )
  );
}

/** 500 response with a non-JSON body, as the real API returns for unhandled errors. */
export function contributeServerError() {
  return http.post(
    '*/api/v1/shelters/contribute',
    () => new HttpResponse('Internal Server Error', { status: 500 })
  );
}

/** Simulates a request that never reaches the server (offline, DNS failure, CORS, …). */
export function networkError(url: string) {
  return http.all(url, () => HttpResponse.error());
}

/** Node MSW server; lifecycle (listen/resetHandlers/close) is wired in `vitest.setup.ts`. */
export const server = setupServer(...handlers);
