import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and responds to clicks', async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button variant="primary" onClick={onClick}>
        Pokračovať
      </Button>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pokračovať' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('defaults to type="button" so it never accidentally submits a form', () => {
    renderWithProviders(<Button variant="secondary">Späť</Button>);

    expect(screen.getByRole('button', { name: 'Späť' })).toHaveAttribute('type', 'button');
  });

  it('lets the caller override type (e.g. "submit" inside StepActions)', () => {
    renderWithProviders(
      <Button variant="primary" type="submit">
        Pokračovať
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Pokračovať' })).toHaveAttribute('type', 'submit');
  });

  it('disables the button and reflects it in the accessibility tree', () => {
    renderWithProviders(
      <Button variant="secondary" disabled>
        Späť
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Späť' })).toBeDisabled();
  });
});
