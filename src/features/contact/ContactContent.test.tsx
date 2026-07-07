import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import contact from '@/locales/sk/contact.json';
import { ContactContent } from './ContactContent';

describe('ContactContent', () => {
  it('renders the h1 "Kontakt" and a back link to "/"', () => {
    renderWithProviders(<ContactContent />);

    expect(screen.getByRole('heading', { level: 1, name: contact.heading })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Späť/ })).toHaveAttribute('href', '/');
  });

  it('renders all three cards with their titles and supporting texts verbatim from contact.json', () => {
    renderWithProviders(<ContactContent />);

    for (const card of Object.values(contact.cards)) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
      expect(screen.getByText(card.supportingText)).toBeInTheDocument();
      expect(screen.getByText(card.value)).toBeInTheDocument();
    }
  });

  it('links the e-mail card with a mailto: href containing the JSON e-mail value', () => {
    renderWithProviders(<ContactContent />);

    const link = screen.getByRole('link', { name: contact.cards.email.value });
    expect(link).toHaveAttribute('href', `mailto:${contact.cards.email.value}`);
  });

  it('links the phone card with a tel: href, spaces stripped from the JSON phone value', () => {
    renderWithProviders(<ContactContent />);

    const link = screen.getByRole('link', { name: contact.cards.phone.value });
    expect(link).toHaveAttribute('href', `tel:${contact.cards.phone.value.replace(/\s+/g, '')}`);
  });

  it('links the address/office card to a Google Maps search, opened in a new tab', () => {
    renderWithProviders(<ContactContent />);

    const link = screen.getByRole('link', { name: contact.cards.office.value });
    expect(link.getAttribute('href')).toContain('google.com/maps');
    expect(link.getAttribute('href')).toContain(encodeURIComponent(contact.cards.office.value));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('renders the decorative photo band with an empty alt', () => {
    const { container } = renderWithProviders(<ContactContent />);

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('alt', '');
  });
});
