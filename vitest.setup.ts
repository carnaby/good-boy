import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/features/api/testing/handlers';

// MSW node server: intercepts every `fetch` call made from tests. Handlers
// reset to the success-path defaults after each test so overrides applied
// via `server.use(...)` in one test never leak into the next.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
