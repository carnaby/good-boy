import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { initialDraft, useDonationStore, type PhonePrefix } from '../store';
import { Step2 } from './Step2';

/**
 * Same `next/navigation` mocking pattern as `Step1.test.tsx` — `useRouter`
 * needs a real Next.js router context that doesn't exist under plain
 * `render()`. `mockPush`/`mockReplace` keep their `mock` prefix because
 * Vitest hoists `vi.mock` above this file's imports.
 */
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: vi.fn() }),
}));

/**
 * Both REAL prefixes take 9-digit national numbers, so in production data a
 * prefix switch can never flip a number's validity — which would make the
 * "revalidate on prefix switch" test pass even with Step2's
 * `trigger('phoneNumber')` call deleted. Overriding +420 to expect 8 digits
 * makes that test falsifiable: a 9-digit number still passes the schema's
 * shape regex (`/^[1-9]\d{8}$/`, which pins 9 digits independently of this
 * map) but then FAILS the per-prefix length check in the object-level
 * `superRefine` — so the error appearing after the switch proves the
 * revalidation actually ran. `country` entries stay real (PrefixCombobox
 * reads them for flags/labels) and `normalizePhone` stays the original via
 * `importOriginal`. No other test in this file validates a +420 number, so
 * the override is inert outside the revalidation test.
 */
vi.mock('../phone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../phone')>();
  return {
    ...actual,
    PHONE_PREFIXES: {
      '+421': { country: 'SK', nationalLength: 9 },
      '+420': { country: 'CZ', nationalLength: 8 },
    },
  };
});

beforeEach(() => {
  sessionStorage.clear();
  useDonationStore.setState({ ...initialDraft, completedStep: 0 });
  mockPush.mockClear();
  mockReplace.mockClear();
});

/** Seeds a store state that's already past step 1, as if arriving from Step1. */
function seedPastStep1(overrides: Partial<ReturnType<typeof useDonationStore.getState>> = {}) {
  useDonationStore.setState({
    ...initialDraft,
    completedStep: 1,
    helpType: 'shelter',
    shelterId: 1,
    amount: 50,
    ...overrides,
  });
}

function makeContributor(index: number, phonePrefix: PhonePrefix = '+421') {
  return {
    firstName: `Donor${index}`,
    lastName: 'Test',
    email: `donor${index}@example.com`,
    phonePrefix,
    phoneNumber: '900000000',
  };
}

describe('Step2', () => {
  it('redirects to "/" when completedStep is 0 (step 1 not done) and never renders the form', async () => {
    renderWithProviders(<Step2 />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: 'Pokračovať' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Meno')).not.toBeInTheDocument();
  });

  it('renders with store-backed defaults for all fields, including the prefix combobox', async () => {
    seedPastStep1({
      contributors: [
        { firstName: 'Ján', lastName: 'Novák', email: 'jan@example.com', phonePrefix: '+420', phoneNumber: '902237207' },
      ],
    });
    renderWithProviders(<Step2 />);

    expect(await screen.findByLabelText('Meno')).toHaveValue('Ján');
    expect(screen.getByLabelText('Priezvisko')).toHaveValue('Novák');
    expect(screen.getByLabelText('E-mailová adresa')).toHaveValue('jan@example.com');
    expect(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' })).toHaveValue('902237207');
    expect(screen.getByRole('combobox')).toHaveAccessibleName(/\+420/);
    // The phone row's group semantics: one visible "Telefónne číslo" label
    // names the whole `role="group"` wrapper (combobox + number input),
    // per the PhoneField a11y contract.
    expect(screen.getByRole('group', { name: 'Telefónne číslo' })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows all 4 Slovak errors when submitting empty, each wired via aria-invalid + aria-describedby', async () => {
    seedPastStep1();
    const user = userEvent.setup();
    renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');

    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    const firstName = screen.getByLabelText('Meno');
    const lastName = screen.getByLabelText('Priezvisko');
    const email = screen.getByLabelText('E-mailová adresa');
    const phoneNumber = screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' });

    await waitFor(() => expect(firstName).toHaveAttribute('aria-invalid', 'true'));
    expect(lastName).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(phoneNumber).toHaveAttribute('aria-invalid', 'true');

    expect(firstName).toHaveAttribute('aria-describedby', 'contributors.0.firstName-error');
    expect(lastName).toHaveAttribute('aria-describedby', 'contributors.0.lastName-error');
    expect(email).toHaveAttribute('aria-describedby', 'contributors.0.email-error');
    expect(phoneNumber).toHaveAttribute('aria-describedby', 'contributors.0.phoneNumber-error');

    expect(document.getElementById('contributors.0.firstName-error')).toHaveTextContent('Zadajte Vaše meno');
    expect(document.getElementById('contributors.0.lastName-error')).toHaveTextContent('Zadajte Vaše priezvisko');
    expect(document.getElementById('contributors.0.email-error')).toHaveTextContent('Zadajte Váš e-mail');
    expect(document.getElementById('contributors.0.phoneNumber-error')).toHaveTextContent(
      'Zadajte Vaše telefónne číslo'
    );
  });

  it('revalidates the phone number after switching the prefix, once the field is already validated', async () => {
    seedPastStep1();
    const user = userEvent.setup();
    renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');

    // First submit (empty) so the form (and phoneNumber specifically) is
    // marked "submitted" — the revalidate-on-prefix-switch path only runs in
    // that state.
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));
    const phoneNumber = screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' });
    await waitFor(() => expect(phoneNumber).toHaveAttribute('aria-invalid', 'true'));

    // Valid for +421 (9 digits) — error clears via post-submit
    // revalidate-on-change.
    await user.type(phoneNumber, '902237207');
    await waitFor(() => expect(phoneNumber).not.toHaveAttribute('aria-invalid'));

    // Switch prefix via the combobox (open it, pick Czech +420 — mocked to
    // expect 8 digits, see the `../phone` mock above). The 9-digit number is
    // now too long for the selected prefix, so the error appearing here is
    // only possible if the prefix switch actually re-ran validation — RHF
    // by itself only revalidates the changed field (`phonePrefix`), never
    // its sibling.
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /\+420/ }));

    await waitFor(() => expect(phoneNumber).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('Zadajte platné telefónne číslo (9 číslic bez úvodnej nuly)')).toHaveAttribute(
      'id',
      'contributors.0.phoneNumber-error'
    );

    // And switching back to +421 (9 digits again) clears it — same path.
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /\+421/ }));

    await waitFor(() => expect(phoneNumber).not.toHaveAttribute('aria-invalid'));
    expect(screen.queryByText('Zadajte platné telefónne číslo (9 číslic bez úvodnej nuly)')).not.toBeInTheDocument();
  });

  it('clicking the static prefix inside the number box focuses the number input', async () => {
    seedPastStep1();
    const user = userEvent.setup();
    renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');

    // The static "+421" span sits visually inside the number box but is not
    // the input — clicking it must hand focus to the input so the compound
    // box behaves like one text field.
    await user.click(screen.getByText('+421'));

    expect(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' })).toHaveFocus();
  });

  it('submits valid data: updates the store, sets completedStep 2, and navigates to /potvrdenie', async () => {
    seedPastStep1();
    const user = userEvent.setup();
    renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');

    await user.type(screen.getByLabelText('Meno'), 'Ján');
    await user.type(screen.getByLabelText('Priezvisko'), 'Novák');
    await user.type(screen.getByLabelText('E-mailová adresa'), 'jan@example.com');
    await user.type(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' }), '902237207');

    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/potvrdenie'));
    expect(useDonationStore.getState()).toMatchObject({
      contributors: [
        { firstName: 'Ján', lastName: 'Novák', email: 'jan@example.com', phonePrefix: '+421', phoneNumber: '902237207' },
      ],
      completedStep: 2,
    });
  });

  it('"Späť" navigates back to "/" without saving unsubmitted edits', async () => {
    seedPastStep1();
    const user = userEvent.setup();
    renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');

    await user.type(screen.getByLabelText('Meno'), 'Nikto');

    await user.click(screen.getByRole('button', { name: 'Späť' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
    expect(useDonationStore.getState().contributors[0]?.firstName).toBe('');
  });

  describe('multiple donors', () => {
    it('clicking "Pridať ďalšieho darcu" appends a second donor fieldset and focuses its first input', async () => {
      seedPastStep1();
      const user = userEvent.setup();
      renderWithProviders(<Step2 />);
      await screen.findByLabelText('Meno');

      await user.click(screen.getByRole('button', { name: 'Pridať ďalšieho darcu' }));

      expect(await screen.findByText('Darca 2')).toBeInTheDocument();
      const firstNames = screen.getAllByLabelText('Meno');
      expect(firstNames).toHaveLength(2);
      await waitFor(() => expect(firstNames[1]).toHaveFocus());
      expect(screen.getByRole('button', { name: 'Odstrániť darcu 2' })).toBeInTheDocument();
    });

    it('removing the second donor returns to a single donor', async () => {
      seedPastStep1();
      const user = userEvent.setup();
      renderWithProviders(<Step2 />);
      await screen.findByLabelText('Meno');

      await user.click(screen.getByRole('button', { name: 'Pridať ďalšieho darcu' }));
      await screen.findByText('Darca 2');

      await user.click(screen.getByRole('button', { name: 'Odstrániť darcu 2' }));

      expect(screen.queryByText('Darca 2')).not.toBeInTheDocument();
      expect(screen.getAllByLabelText('Meno')).toHaveLength(1);
    });

    it('submits valid data for 2 donors: stores both contributors and navigates to /potvrdenie', async () => {
      seedPastStep1();
      const user = userEvent.setup();
      renderWithProviders(<Step2 />);
      await screen.findByLabelText('Meno');

      await user.type(screen.getByLabelText('Meno'), 'Ján');
      await user.type(screen.getByLabelText('Priezvisko'), 'Novák');
      await user.type(screen.getByLabelText('E-mailová adresa'), 'jan@example.com');
      await user.type(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' }), '902237207');

      await user.click(screen.getByRole('button', { name: 'Pridať ďalšieho darcu' }));
      await screen.findByText('Darca 2');

      const firstNames = screen.getAllByLabelText('Meno');
      const lastNames = screen.getAllByLabelText('Priezvisko');
      const emails = screen.getAllByLabelText('E-mailová adresa');
      const phones = screen.getAllByRole('textbox', { name: 'Telefónne číslo bez predvoľby' });

      await user.type(firstNames[1]!, 'Jana');
      await user.type(lastNames[1]!, 'Nováková');
      await user.type(emails[1]!, 'jana@example.com');
      await user.type(phones[1]!, '777123456');

      await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/potvrdenie'));
      expect(useDonationStore.getState().contributors).toEqual([
        { firstName: 'Ján', lastName: 'Novák', email: 'jan@example.com', phonePrefix: '+421', phoneNumber: '902237207' },
        { firstName: 'Jana', lastName: 'Nováková', email: 'jana@example.com', phonePrefix: '+421', phoneNumber: '777123456' },
      ]);
      expect(useDonationStore.getState().completedStep).toBe(2);
    });

    it('shows a second-donor error at the right field, independent of the (valid) first donor', async () => {
      seedPastStep1();
      const user = userEvent.setup();
      renderWithProviders(<Step2 />);
      await screen.findByLabelText('Meno');

      await user.type(screen.getByLabelText('Meno'), 'Ján');
      await user.type(screen.getByLabelText('Priezvisko'), 'Novák');
      await user.type(screen.getByLabelText('E-mailová adresa'), 'jan@example.com');
      await user.type(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' }), '902237207');

      await user.click(screen.getByRole('button', { name: 'Pridať ďalšieho darcu' }));
      await screen.findByText('Darca 2');

      // Donor 2 is left entirely empty.
      await user.click(screen.getByRole('button', { name: 'Pokračovať' }));

      const secondFirstName = screen.getAllByLabelText('Meno')[1]!;
      await waitFor(() => expect(secondFirstName).toHaveAttribute('aria-invalid', 'true'));
      expect(secondFirstName).toHaveAttribute('aria-describedby', 'contributors.1.firstName-error');
      expect(document.getElementById('contributors.1.firstName-error')).toHaveTextContent('Zadajte Vaše meno');

      // The first (valid) donor must not have picked up any error.
      const firstFirstName = screen.getAllByLabelText('Meno')[0]!;
      expect(firstFirstName).not.toHaveAttribute('aria-invalid');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('disables "Pridať ďalšieho darcu" once there are already 10 donors', async () => {
      seedPastStep1({
        contributors: Array.from({ length: 10 }, (_, i) => makeContributor(i)),
      });
      renderWithProviders(<Step2 />);
      await screen.findByText('Darca 10');

      expect(screen.getByRole('button', { name: 'Pridať ďalšieho darcu' })).toBeDisabled();
      expect(screen.getAllByLabelText('Meno')).toHaveLength(10);
    });
  });
});
