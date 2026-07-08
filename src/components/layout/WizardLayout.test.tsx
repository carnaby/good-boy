import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { WizardLayout } from './WizardLayout';

describe('WizardLayout', () => {
  it('renders exactly one <main id="main-content"> landmark holding the step content', () => {
    renderWithProviders(
      <WizardLayout image="/images/dog-steps.jpg">
        <p>Step content</p>
      </WizardLayout>
    );

    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveAttribute('id', 'main-content');
    expect(mains[0]).toHaveTextContent('Step content');
  });

  it('renders the footer as a contentinfo landmark, a sibling of <main> (not nested inside it)', () => {
    renderWithProviders(
      <WizardLayout image="/images/dog-steps.jpg">
        <p>Step content</p>
      </WizardLayout>
    );

    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');
    expect(main).not.toContainElement(footer);
  });
});
