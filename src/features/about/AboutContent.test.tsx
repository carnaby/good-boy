import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test-utils';
import { server } from '@/features/api/testing/handlers';
import { AboutContent } from './AboutContent';

/**
 * Same `next/navigation` mocking pattern as the donation steps' tests
 * (`useRouter`), plus a controllable `useSearchParams` so each test can
 * decide whether `?stav=dakujeme` is present.
 *
 * `mockRouter` is a single object built once at module scope (not a fresh
 * object literal returned per call) so `useRouter()` is referentially STABLE
 * across re-renders, same as the real Next.js hook — `AboutContent`'s
 * `useEffect(() => { if (showToast) router.replace(...) }, [showToast, router])`
 * relies on that stability to only fire once per `showToast` transition; an
 * unstable mock would re-run it (and double-call `replace`) on every
 * unrelated re-render (e.g. `useResults()` settling).
 */
const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace, push: vi.fn(), prefetch: vi.fn() };
let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockSearchParams = new URLSearchParams();
});

describe('AboutContent', () => {
  it('renders the h1, both paragraphs verbatim, and a back link to "/"', () => {
    renderWithProviders(<AboutContent />);

    expect(screen.getByRole('heading', { level: 1, name: 'O projekte' })).toBeInTheDocument();
    expect(
      screen.getByText(/^Nadácia Good Boy sa venuje zlepšovaniu života psov v Žiline na Slovensku\./)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Naša práca je možná vďaka podpore vášnivých dobrovoľníkov/)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Späť/ })).toHaveAttribute('href', '/');
  });

  it('renders metrics from the API with their labels: formatted collected sum and contributor count', async () => {
    server.use(
      http.get('*/api/v1/shelters/results', () => HttpResponse.json({ contributors: 3, contribution: 2.5 }))
    );
    renderWithProviders(<AboutContent />);

    // `Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR',
    // minimumFractionDigits: 0, maximumFractionDigits: 2 })` trims 2.5's
    // trailing zero (minimumFractionDigits: 0), so the real formatted output
    // is "2,5 €" (not "2,50 €") — asserted tolerant of the NBSP/narrow-NBSP
    // Intl inserts before the currency symbol.
    expect(await screen.findByText(/^2,5\s€$/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Celková vyzbieraná hodnota')).toBeInTheDocument();
    expect(screen.getByText('Počet darcov')).toBeInTheDocument();
  });

  it('renders formatted 0 when contribution is null', async () => {
    server.use(
      http.get('*/api/v1/shelters/results', () => HttpResponse.json({ contributors: 0, contribution: null }))
    );
    renderWithProviders(<AboutContent />);

    expect(await screen.findByText(/^0\s€$/)).toBeInTheDocument();
  });

  it('shows skeleton placeholders + a hidden loading announcement while useResults is still loading', async () => {
    server.use(
      http.get('*/api/v1/shelters/results', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ contributors: 3, contribution: 2.5 });
      })
    );
    const { container } = renderWithProviders(<AboutContent />);

    // `role="status"` carries an implicit `aria-live="polite"` so screen
    // readers announce the loading state instead of silently jumping to the
    // resolved metrics.
    expect(screen.getByRole('status')).toHaveTextContent('Načítavam…');
    // Skeleton placeholders: `aria-hidden` `div`s (as opposed to the
    // likewise-`aria-hidden` decorative icon `svg`s elsewhere on the page).
    expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.queryByText('3')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/^2,5\s€$/)).toBeInTheDocument());
    expect(screen.queryByText('Načítavam…')).not.toBeInTheDocument();
    expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('?stav=dakujeme shows the success toast and cleans the URL via router.replace; closing hides it', async () => {
    mockSearchParams = new URLSearchParams('stav=dakujeme');
    const user = userEvent.setup();
    renderWithProviders(<AboutContent />);

    const toast = await screen.findByRole('status');
    expect(toast).toHaveTextContent('Ďakujeme za váš príspevok');
    expect(mockReplace).toHaveBeenCalledWith('/o-projekte');
    expect(mockReplace).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Zavrieť' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows no toast and never calls replace when there is no "stav" param', async () => {
    renderWithProviders(<AboutContent />);

    // The metrics-loading announcement is ALSO `role="status"` — wait for
    // that transient one to clear so this only asserts on the toast (there
    // shouldn't be one, with or without a still-loading metrics band).
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
