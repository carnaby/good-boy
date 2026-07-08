import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test-utils';
import { defaultContributeMessages, server } from '@/features/api/testing/handlers';
import type { ContributeRequest } from '@/features/api/schemas';
import { initialDraft, useDonationStore } from '../store';
import { toContributeRequest } from '../mapper';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';

/**
 * Same `next/navigation` mocking pattern as `Step1.test.tsx`/`Step2.test.tsx`
 * — `useRouter` needs a real Next.js router context that doesn't exist under
 * plain `render()`.
 */
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: vi.fn() }),
}));

beforeEach(() => {
  sessionStorage.clear();
  useDonationStore.setState({ ...initialDraft, completedStep: 0 });
  mockPush.mockClear();
  mockReplace.mockClear();
});

/** Seeds a store state that's past both steps 1 and 2, ready for step 3. */
function seedFullDraft(overrides: Partial<ReturnType<typeof useDonationStore.getState>> = {}) {
  useDonationStore.setState({
    ...initialDraft,
    completedStep: 2,
    helpType: 'shelter',
    shelterId: 1,
    amount: 50,
    contributors: [
      {
        firstName: 'Peter',
        lastName: 'Reguli',
        email: 'peter.reguli@example.com',
        phonePrefix: '+421',
        phoneNumber: '902237207',
      },
    ],
    ...overrides,
  });
}

describe('Step3', () => {
  it('redirects to "/" when completedStep < 2 and never renders the form', async () => {
    useDonationStore.setState({ ...initialDraft, completedStep: 1 });
    renderWithProviders(<Step3 />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: 'Odoslať formulár' })).not.toBeInTheDocument();
  });

  it('renders the summary rows: help type, shelter name (from API), formatted amount, full name, e-mail, grouped phone', async () => {
    seedFullDraft();
    renderWithProviders(<Step3 />);

    expect(await screen.findByText('Finančný príspevok útulku')).toBeInTheDocument();
    expect(await screen.findByText('Shelter One')).toBeInTheDocument();
    expect(screen.getByText(/^50\s€$/)).toBeInTheDocument();
    expect(screen.getByText('Peter Reguli')).toBeInTheDocument();
    expect(screen.getByText('peter.reguli@example.com')).toBeInTheDocument();
    expect(screen.getByText('+421 902 237 207')).toBeInTheDocument();
    // Regression: a single donor renders with NO "Darca N" heading at all —
    // multi-donor sub-headings must only appear once there's more than one.
    expect(screen.queryByText(/^Darca /)).not.toBeInTheDocument();
  });

  it('shows an em dash for the shelter name when the shelters query fails, never a blank value', async () => {
    seedFullDraft();
    server.use(http.get('*/api/v1/shelters/', () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<Step3 />);

    // Same retry-backoff rationale as Step1's shelters-failure test: the
    // QueryClient (src/lib/providers.tsx) retries once before settling into
    // the error state, well past the default `findBy*` timeout.
    const label = await screen.findByText('Útulok', {}, { timeout: 3000 });
    expect(label.nextElementSibling).toHaveTextContent('—');
  });

  it('omits the "Útulok" row entirely when shelterId is null (foundation donation without a shelter)', async () => {
    seedFullDraft({ helpType: 'foundation', shelterId: null });
    renderWithProviders(<Step3 />);

    await screen.findByText('Finančný príspevok celej nadácii');
    expect(screen.queryByText('Útulok')).not.toBeInTheDocument();
  });

  it('renders edit links back to step 1 and step 2 with descriptive aria-labels', async () => {
    seedFullDraft();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    // The visible text of both edit links is "Upraviť" — their accessible
    // names (what `getByRole` matches on) come from the more descriptive
    // `aria-label`s instead, which is what's asserted below.
    expect(screen.getAllByText('Upraviť')).toHaveLength(2);

    expect(screen.getByRole('link', { name: 'Upraviť výber pomoci a sumy' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Upraviť osobné údaje' })).toHaveAttribute('href', '/osobne-udaje');
  });

  it('shows the consentRequired Slovak error, aria-wired, and never fires a request when submitting unchecked', async () => {
    seedFullDraft();
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    const checkbox = screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov');
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-invalid', 'true'));
    expect(checkbox).toHaveAttribute('aria-describedby', 'consent-error');
    expect(screen.getByText('Pre pokračovanie je potrebný súhlas so spracovaním osobných údajov')).toHaveAttribute(
      'id',
      'consent-error'
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits successfully: POST body matches toContributeRequest exactly, store resets, navigates to the thank-you page', async () => {
    seedFullDraft();
    let capturedBody: unknown;
    server.use(
      http.post('*/api/v1/shelters/contribute', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ messages: defaultContributeMessages });
      })
    );
    const draftAtSubmitTime = useDonationStore.getState();
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/o-projekte?stav=dakujeme'));
    expect(capturedBody).toEqual(toContributeRequest(draftAtSubmitTime));
    expect(useDonationStore.getState()).toMatchObject({ ...initialDraft, completedStep: 0 });
    // Regression: reset() drops completedStep back to 0, which must NOT
    // re-arm the "not far enough into the wizard" guard — a replace('/')
    // here would race (and typically beat) the thank-you push above,
    // stranding the user on "/" after a successful donation.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the submit button as disabled + aria-busy while the mutation is pending', async () => {
    seedFullDraft();
    server.use(
      http.post(
        '*/api/v1/shelters/contribute',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({ messages: defaultContributeMessages });
        }
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    const submitButton = screen.getByRole('button', { name: 'Odoslať formulár' });
    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(submitButton).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/o-projekte?stav=dakujeme'));
  });

  it('400 validation naming contributors.0.email: generic message + the e-mail field named + link to step 2, no retry button', async () => {
    seedFullDraft();
    server.use(
      http.post('*/api/v1/shelters/contribute', () =>
        HttpResponse.json(
          {
            messages: [{ type: 'ERROR', message: 'joi.body.contributors.0.email', path: 'body.contributors.0.email' }],
          },
          { status: 400 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server odmietol odoslané údaje. Skontrolujte ich, prosím, a skúste to znova.');
    expect(alert).toHaveTextContent('e-mail');
    // Scoped to the alert: the step-3 summary above it also has an
    // "Upraviť osobné údaje"-named edit link pointing at the same href.
    expect(within(alert).getByRole('link', { name: 'Upraviť osobné údaje' })).toHaveAttribute(
      'href',
      '/osobne-udaje'
    );
    expect(screen.queryByRole('button', { name: 'Skúsiť znova' })).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('500 shows the server message with a retry button; retrying (after the handler recovers) completes the success flow with 2 POSTs total', async () => {
    seedFullDraft();
    let postCount = 0;
    server.use(
      http.post('*/api/v1/shelters/contribute', () => {
        postCount += 1;
        return new HttpResponse('Internal Server Error', { status: 500 });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Na serveri nastala chyba. Skúste to znova o chvíľu.');
    const retryButton = screen.getByRole('button', { name: 'Skúsiť znova' });

    server.use(
      http.post('*/api/v1/shelters/contribute', () => {
        postCount += 1;
        return HttpResponse.json({ messages: defaultContributeMessages });
      })
    );
    await user.click(retryButton);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/o-projekte?stav=dakujeme'));
    expect(postCount).toBe(2);
  });

  it('network error shows the network message with a retry button', async () => {
    seedFullDraft();
    server.use(http.post('*/api/v1/shelters/contribute', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Nepodarilo sa pripojiť k serveru. Skontrolujte internetové pripojenie a skúste to znova.'
    );
    expect(screen.getByRole('button', { name: 'Skúsiť znova' })).toBeInTheDocument();
  });

  it('"Späť" navigates back to /osobne-udaje', async () => {
    seedFullDraft();
    const user = userEvent.setup();
    renderWithProviders(<Step3 />);
    await screen.findByText('Shelter One');

    await user.click(screen.getByRole('button', { name: 'Späť' }));

    expect(mockPush).toHaveBeenCalledWith('/osobne-udaje');
  });

  it('completes the full wizard (step 1 -> step 2 -> step 3) with an exact captured POST payload', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('*/api/v1/shelters/contribute', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ messages: defaultContributeMessages });
      })
    );
    const user = userEvent.setup();

    const step1 = renderWithProviders(<Step1 />);
    await screen.findByRole('option', { name: 'Shelter One' });
    await user.click(screen.getByRole('radio', { name: 'Prispieť celej nadácii' }));
    await user.type(screen.getByRole('textbox', { name: 'Vlastná suma' }), '25');
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/osobne-udaje'));
    step1.unmount();

    const step2 = renderWithProviders(<Step2 />);
    await screen.findByLabelText('Meno');
    await user.type(screen.getByLabelText('Meno'), 'Ján');
    await user.type(screen.getByLabelText('Priezvisko'), 'Novák');
    await user.type(screen.getByLabelText('E-mailová adresa'), 'jan@example.com');
    await user.type(screen.getByRole('textbox', { name: 'Telefónne číslo bez predvoľby' }), '902237207');
    await user.click(screen.getByRole('button', { name: 'Pokračovať' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/potvrdenie'));
    step2.unmount();

    renderWithProviders(<Step3 />);
    await screen.findByText('Finančný príspevok celej nadácii');
    await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
    await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/o-projekte?stav=dakujeme'));
    expect(capturedBody).toEqual({
      contributors: [{ firstName: 'Ján', lastName: 'Novák', email: 'jan@example.com', phone: '+421902237207' }],
      shelterID: null,
      value: 25,
    } satisfies ContributeRequest);
    // Regression (same as the direct success test): the post-success store
    // reset must never re-arm Step3's guard redirect.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  describe('multiple donors', () => {
    function seedTwoDonorDraft(overrides: Partial<ReturnType<typeof useDonationStore.getState>> = {}) {
      seedFullDraft({
        contributors: [
          {
            firstName: 'Peter',
            lastName: 'Reguli',
            email: 'peter.reguli@example.com',
            phonePrefix: '+421',
            phoneNumber: '902237207',
          },
          {
            firstName: 'Jana',
            lastName: 'Nováková',
            email: 'jana@example.com',
            phonePrefix: '+420',
            phoneNumber: '777123456',
          },
        ],
        ...overrides,
      });
    }

    it('shows both donors under "Darca 1"/"Darca 2" sub-headings, with one edit link for the whole group', async () => {
      seedTwoDonorDraft();
      renderWithProviders(<Step3 />);
      await screen.findByText('Shelter One');

      expect(screen.getByText('Darca 1')).toBeInTheDocument();
      expect(screen.getByText('Darca 2')).toBeInTheDocument();
      expect(screen.getByText('Peter Reguli')).toBeInTheDocument();
      expect(screen.getByText('peter.reguli@example.com')).toBeInTheDocument();
      expect(screen.getByText('+421 902 237 207')).toBeInTheDocument();
      expect(screen.getByText('Jana Nováková')).toBeInTheDocument();
      expect(screen.getByText('jana@example.com')).toBeInTheDocument();
      expect(screen.getByText('+420 777 123 456')).toBeInTheDocument();

      // Still just ONE "Upraviť" pair (help+amount, personal) even with 2
      // donors listed under the personal group.
      expect(screen.getAllByText('Upraviť')).toHaveLength(2);
      expect(screen.getByRole('link', { name: 'Upraviť osobné údaje' })).toHaveAttribute('href', '/osobne-udaje');
    });

    it('submits successfully with 2 donors: POST body matches toContributeRequest exactly (both contributors)', async () => {
      seedTwoDonorDraft();
      let capturedBody: unknown;
      server.use(
        http.post('*/api/v1/shelters/contribute', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ messages: defaultContributeMessages });
        })
      );
      const draftAtSubmitTime = useDonationStore.getState();
      const user = userEvent.setup();
      renderWithProviders(<Step3 />);
      await screen.findByText('Shelter One');

      await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
      await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/o-projekte?stav=dakujeme'));
      const expectedBody = toContributeRequest(draftAtSubmitTime);
      expect(expectedBody.contributors).toHaveLength(2);
      expect(capturedBody).toEqual(expectedBody);
      expect(capturedBody).toEqual({
        contributors: [
          { firstName: 'Peter', lastName: 'Reguli', email: 'peter.reguli@example.com', phone: '+421902237207' },
          { firstName: 'Jana', lastName: 'Nováková', email: 'jana@example.com', phone: '+420777123456' },
        ],
        shelterID: 1,
        value: 50,
      } satisfies ContributeRequest);
      expect(useDonationStore.getState()).toMatchObject({ ...initialDraft, completedStep: 0 });
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('400 validation naming contributors.1.email (second donor): field named + link to step 2, same as index 0', async () => {
      seedTwoDonorDraft();
      server.use(
        http.post('*/api/v1/shelters/contribute', () =>
          HttpResponse.json(
            {
              messages: [
                { type: 'ERROR', message: 'joi.body.contributors.1.email', path: 'body.contributors.1.email' },
              ],
            },
            { status: 400 }
          )
        )
      );
      const user = userEvent.setup();
      renderWithProviders(<Step3 />);
      await screen.findByText('Shelter One');

      await user.click(screen.getByLabelText('Súhlasím so spracovaním mojich osobných údajov'));
      await user.click(screen.getByRole('button', { name: 'Odoslať formulár' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Server odmietol odoslané údaje. Skontrolujte ich, prosím, a skúste to znova.');
      expect(alert).toHaveTextContent('e-mail');
      // Scoped to the alert: the step-3 summary above it also has an
      // "Upraviť osobné údaje"-named edit link pointing at the same href.
      expect(within(alert).getByRole('link', { name: 'Upraviť osobné údaje' })).toHaveAttribute(
        'href',
        '/osobne-udaje'
      );
      expect(screen.queryByRole('button', { name: 'Skúsiť znova' })).not.toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
