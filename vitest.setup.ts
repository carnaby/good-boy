import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/features/api/testing/handlers';

// MSW node server: intercepts every `fetch` call made from tests. Handlers
// reset to the success-path defaults after each test so overrides applied
// via `server.use(...)` in one test never leak into the next.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// `@testing-library/react` only auto-registers its `cleanup()` afterEach
// when it finds a *global* `afterEach` (true with Jest, or Vitest's
// `globals: true`). This project imports `afterEach` explicitly instead
// (see vitest.config.mts — `globals` is unset), so without this, a render()
// from one `it` would still be mounted in `document.body` for the next.
afterEach(() => {
  cleanup();
});
