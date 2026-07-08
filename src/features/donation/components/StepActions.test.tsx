import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { StepActions } from './StepActions';

describe('StepActions', () => {
  it('hides the back button when onBack is not provided', () => {
    renderWithProviders(<StepActions nextLabel="Pokračovať" />);

    expect(screen.queryByRole('button', { name: /späť/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pokračovať' })).toBeInTheDocument();
  });

  it('renders a disabled back button when backDisabled is set', () => {
    renderWithProviders(<StepActions onBack={() => {}} backDisabled nextLabel="Pokračovať" />);

    expect(screen.getByRole('button', { name: /späť/i })).toBeDisabled();
  });

  it('always renders the next button as type="submit"', () => {
    renderWithProviders(<StepActions nextLabel="Pokračovať" />);

    expect(screen.getByRole('button', { name: 'Pokračovať' })).toHaveAttribute('type', 'submit');
  });
});
