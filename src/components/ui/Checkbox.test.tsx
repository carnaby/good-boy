import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('associates the label with the native checkbox and reports toggles via onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Checkbox id="consent" checked={false} onChange={onChange}>
        Súhlasím so spracovaním osobných údajov
      </Checkbox>
    );

    const checkbox = screen.getByLabelText('Súhlasím so spracovaním osobných údajov');
    expect(checkbox).toBeInstanceOf(HTMLInputElement);

    await userEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects the checked prop on the native input', () => {
    renderWithProviders(
      <Checkbox id="consent" checked onChange={() => {}}>
        Súhlasím
      </Checkbox>
    );

    expect(screen.getByLabelText('Súhlasím')).toBeChecked();
  });

  it('marks the input aria-invalid when error is set', () => {
    renderWithProviders(
      <Checkbox id="consent" checked={false} onChange={() => {}} error>
        Súhlasím
      </Checkbox>
    );

    expect(screen.getByLabelText('Súhlasím')).toHaveAttribute('aria-invalid', 'true');
  });
});
