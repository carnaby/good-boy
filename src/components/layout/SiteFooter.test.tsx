import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('hides social links by default and links Kontakt/O projekte', () => {
    renderWithProviders(<SiteFooter />);

    expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt');
    expect(screen.getByRole('link', { name: 'O projekte' })).toHaveAttribute('href', '/o-projekte');
  });

  it('shows social links when showSocials is set', () => {
    renderWithProviders(<SiteFooter showSocials />);

    expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', 'https://www.facebook.com');
    expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://www.instagram.com');
  });
});
