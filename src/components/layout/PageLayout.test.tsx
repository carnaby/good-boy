import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { PageLayout } from './PageLayout';

describe('PageLayout', () => {
  it('renders exactly one <main id="main-content"> landmark holding the children', () => {
    renderWithProviders(
      <PageLayout>
        <p>Page body</p>
      </PageLayout>
    );

    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveAttribute('id', 'main-content');
    expect(mains[0]).toHaveTextContent('Page body');
  });

  it('renders the `footer` prop outside <main>, so it keeps its own landmark role', () => {
    renderWithProviders(
      <PageLayout footer={<footer>Site footer</footer>}>
        <p>Page body</p>
      </PageLayout>
    );

    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');
    expect(main).not.toContainElement(footer);
  });

  it('renders nothing extra when `footer` is omitted', () => {
    renderWithProviders(
      <PageLayout>
        <p>Page body</p>
      </PageLayout>
    );

    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
