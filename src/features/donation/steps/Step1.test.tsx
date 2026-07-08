import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test-utils';
import { defaultShelters, server } from '@/features/api/testing/handlers';
import { initialDraft, useDonationStore } from '../store';
import { Step1 } from './Step1';

/**
 * `next/navigation`'s `useRouter` needs a real Next.js router context that
 * doesn't exist under plain `render()` — mocked the same way the rest of the
 * app router ecosystem is normally tested. Vitest hoists `vi.mock` above this
 * file's imports, so `mockPush` (referenced inside the factory) must keep its
 * `mock` prefix for the hoisting-safe reference to work.
 */
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

// `Intl.NumberFormat('sk-SK', { style: 'currency', ... }).format(50)` renders
// "50 €" with a non-breaking space, not a plain ASCII one.
const chip50 = /^50\s€$/;

beforeEach(() => {
  sessionStorage.clear();
  useDonationStore.setState({ ...initialDraft, completedStep: 0 });
  mockPush.mockClear();
});

async function waitForSheltersLoaded() {
  return screen.findByRole('option', { name: 'Shelter One' });
}

describe('Step1', () => {
  it('renders shelters fetched from the API as select options', async () => {
    renderWithProviders(<Step1 />);

    expect(await screen.findByRole('option', { name: 'Shelter One' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shelter Two' })).toBeInTheDocument();
  });

  it('shows BOTH Slovak errors when submitting with nothing filled in (default help type)', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<Step1 />);
    await waitForSheltersLoaded();

    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    const select = screen.getByRole('combobox');
    await waitFor(() => expect(select).toHaveAttribute('aria-invalid', 'true'));
    expect(select).toHaveAttribute('aria-describedby', 'shelterId-error');

    // The placeholder option text ("Vyberte útulok zo zoznamu") is
    // identical to the validation message, so asserting via `getByText`
    // alone would be ambiguous — scope to the error paragraph by id instead.
    expect(container.querySelector('#shelterId-error')).toHaveTextContent('Vyberte útulok zo zoznamu');

    // The amount "required" error must appear alongside the shelter one on
    // this same first submit — `stepHelpSchema` keeps `amount` nullable in
    // the base object precisely so its superRefine can report both at once.
    expect(screen.getByText('Zadajte sumu, ktorou chcete prispieť')).toHaveAttribute('id', 'amount-error');
    expect(screen.getByRole('textbox', { name: 'Vlastná suma' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('switching to "celej nadácii" clears the shelter error, marks it optional, and submits with shelterId null', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Step1 />);
    await waitForSheltersLoaded();

    await user.click(screen.getByRole('button', { name: chip50 }));
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));
    const select = screen.getByRole('combobox');
    await waitFor(() => expect(select).toHaveAttribute('aria-invalid', 'true'));

    await user.click(screen.getByRole('radio', { name: 'Prispieť celej nadácii' }));

    await waitFor(() => {
      expect(select).not.toHaveAttribute('aria-invalid');
    });
    // `FormField` renders the hint wrapped in parens: "(Nepovinné)".
    expect(screen.getByText('(Nepovinné)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/osobne-udaje');
    });
    expect(useDonationStore.getState()).toMatchObject({
      helpType: 'foundation',
      shelterId: null,
      amount: 50,
    });
  });

  it('typing a custom amount after selecting a chip un-presses the chip and wins on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Step1 />);
    await waitForSheltersLoaded();

    await user.selectOptions(screen.getByRole('combobox'), 'Shelter One');
    await user.click(screen.getByRole('button', { name: chip50 }));

    // Two-way sync: a chip click writes its value into the custom input.
    const input = screen.getByRole('textbox', { name: 'Vlastná suma' });
    expect(input).toHaveValue('50');

    await user.clear(input);
    await user.type(input, '33');

    expect(screen.getByRole('button', { name: chip50 })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    await waitFor(() => {
      expect(useDonationStore.getState().amount).toBe(33);
    });
  });

  it('submits valid data (shelter + preset amount), updates the store, and navigates on', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Step1 />);
    await waitForSheltersLoaded();

    await user.selectOptions(screen.getByRole('combobox'), 'Shelter One');
    await user.click(screen.getByRole('button', { name: chip50 }));
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/osobne-udaje');
    });
    expect(useDonationStore.getState()).toMatchObject({ helpType: 'shelter', shelterId: 1, amount: 50 });
  });

  it('shows a retry button when the shelters request fails, and loads shelters after retrying', async () => {
    server.use(http.get('*/api/v1/shelters/', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderWithProviders(<Step1 />);

    // The QueryClient (see src/lib/providers.tsx) retries a failing query
    // once with a ~1s backoff before settling into the error state — longer
    // than the default `findBy*` timeout, so this needs an explicit one.
    await screen.findByText('Útulky sa nepodarilo načítať.', {}, { timeout: 3000 });
    const retryButton = screen.getByRole('button', { name: 'Skúsiť znova' });

    // The retry UI replaces the `<select>` the "Útulok" label's `htmlFor`
    // normally points at — it must still carry that label as an accessible
    // group name (`role="group"` + `aria-labelledby`), not go unlabelled.
    expect(screen.getByRole('group', { name: 'Útulok' })).toContainElement(retryButton);

    server.use(http.get('*/api/v1/shelters/', () => HttpResponse.json({ shelters: defaultShelters })));
    await user.click(retryButton);

    expect(await screen.findByRole('option', { name: 'Shelter One' })).toBeInTheDocument();
  });

  it('moves selection and focus with the arrow keys in the help radiogroup (a11y)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Step1 />);

    const shelterRadio = screen.getByRole('radio', { name: 'Prispieť konkrétnemu útulku' });
    const foundationRadio = screen.getByRole('radio', { name: 'Prispieť celej nadácii' });

    shelterRadio.focus();
    await user.keyboard('{ArrowRight}');

    expect(foundationRadio).toHaveAttribute('aria-checked', 'true');
    expect(foundationRadio).toHaveFocus();
  });

  it('renders the back button disabled on step 1', async () => {
    renderWithProviders(<Step1 />);

    expect(screen.getByRole('button', { name: 'Späť' })).toBeDisabled();
  });
});
