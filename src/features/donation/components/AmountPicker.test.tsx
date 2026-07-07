import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { AmountPicker } from './AmountPicker';

// `Intl.NumberFormat('sk-SK', { style: 'currency', ... }).format(20)` renders
// "20 €" (a non-breaking space), not a plain ASCII space — matching
// against a regex keeps these assertions from being tied to that exact
// whitespace character.
const chipName = (amount: number) => new RegExp(`^${amount}\\s€$`);

/**
 * `AmountPicker` is a controlled component (`value`/`onChange`), so exercising
 * "click a chip, see it highlighted" needs a stateful host — a bare
 * `onChange` spy alone can't reflect back into `value`. `Harness` plays the
 * role RHF's `Controller` plays in `Step1`.
 */
function Harness({ onChange }: { onChange: (value: number | null) => void }) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <AmountPicker
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('AmountPicker', () => {
  it('renders the 6 preset chips formatted as EUR currency', () => {
    renderWithProviders(<Harness onChange={vi.fn()} />);

    for (const amount of [5, 10, 20, 30, 50, 100]) {
      expect(screen.getByRole('button', { name: chipName(amount) })).toBeInTheDocument();
    }
  });

  it('clicking a chip calls onChange with its value, marks it pressed, and shows the value in the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: chipName(20) }));

    expect(onChange).toHaveBeenLastCalledWith(20);
    expect(screen.getByRole('button', { name: chipName(20) })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Vlastná suma' })).toHaveValue('20');
  });

  it('clicking a second chip moves the active state and updates the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: chipName(20) }));
    await user.click(screen.getByRole('button', { name: chipName(50) }));

    expect(screen.getByRole('button', { name: chipName(20) })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: chipName(50) })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Vlastná suma' })).toHaveValue('50');
  });

  it('typing a preset value activates the matching chip', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Vlastná suma' }), '20');

    expect(onChange).toHaveBeenLastCalledWith(20);
    expect(screen.getByRole('button', { name: chipName(20) })).toHaveAttribute('aria-pressed', 'true');
  });

  it('typing a non-preset value leaves no chip active', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Vlastná suma' });
    await user.click(screen.getByRole('button', { name: chipName(50) }));
    await user.clear(input);
    await user.type(input, '33');

    expect(onChange).toHaveBeenLastCalledWith(33);
    expect(input).toHaveValue('33');
    for (const amount of [5, 10, 20, 30, 50, 100]) {
      expect(screen.getByRole('button', { name: chipName(amount) })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('accepts a comma as the decimal separator', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    await user.type(screen.getByRole('textbox', { name: 'Vlastná suma' }), '7,5');

    expect(onChange).toHaveBeenLastCalledWith(7.5);
  });

  it('clearing the custom input reports null and deactivates chips', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Vlastná suma' });
    await user.click(screen.getByRole('button', { name: chipName(5) }));
    expect(onChange).toHaveBeenLastCalledWith(5);

    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('button', { name: chipName(5) })).toHaveAttribute('aria-pressed', 'false');
  });
});
