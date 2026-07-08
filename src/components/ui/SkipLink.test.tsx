import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('renders a link to #main-content with the Slovak "skip to content" label', () => {
    renderWithProviders(<SkipLink />);

    expect(screen.getByRole('link', { name: 'Preskočiť na obsah' })).toHaveAttribute('href', '#main-content');
  });
});
