import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import donation from '@/locales/sk/donation.json';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('renders all 3 steps with labels from i18n', () => {
    renderWithProviders(<Stepper current={1} />);

    expect(screen.getByText(donation.steps.help)).toBeVisible();
    expect(screen.getByText(donation.steps.personal)).toBeVisible();
    expect(screen.getByText(donation.steps.confirmation)).toBeVisible();
  });

  it('marks only the active item with aria-current="step"', () => {
    renderWithProviders(<Stepper current={2} />);

    const items = screen.getAllByRole('listitem');
    const current = items.filter((item) => item.getAttribute('aria-current') === 'step');

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(donation.steps.personal);
  });

  it('gives the nav landmark an accessible name from i18n', () => {
    renderWithProviders(<Stepper current={1} />);

    expect(screen.getByRole('navigation', { name: donation.steps.ariaLabel })).toBeInTheDocument();
  });

  it('marks steps before the current one as done', () => {
    renderWithProviders(<Stepper current={2} />);

    // The first step (index < current) is done — surfaced via the
    // VisuallyHidden "done" text next to its check icon.
    expect(screen.getByText(donation.steps.done)).toBeInTheDocument();
  });
});
