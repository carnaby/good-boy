import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { PrefixCombobox } from './PrefixCombobox';
import type { PhonePrefix } from '../store';

/**
 * `PrefixCombobox` is controlled (`value`/`onChange`) — a stateful host plays
 * the role RHF's `Controller` plays in `Step2`, mirroring the `AmountPicker`
 * test harness pattern.
 */
function Harness({
  onChange,
  initialValue = '+421',
}: {
  onChange: (value: PhonePrefix) => void;
  initialValue?: PhonePrefix;
}) {
  const [value, setValue] = useState<PhonePrefix>(initialValue);
  return (
    <PrefixCombobox
      id="phonePrefix"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('PrefixCombobox', () => {
  it('is closed by default and exposes the select-only combobox contract', () => {
    renderWithProviders(<Harness onChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
    // The popup unmounts when closed, so a permanent `aria-controls` would
    // be a dangling ARIA reference (axe `aria-valid-attr-value`).
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('opens on ArrowDown with the current value as the active option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    const skOption = screen.getByRole('option', { name: /\+421/ });
    expect(trigger).toHaveAttribute('aria-activedescendant', skOption.id);
  });

  it('opens on Enter and on Space with the current value as the active option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');
    const activeOptionId = () => screen.getByRole('option', { name: /\+421/ }).id;

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', activeOptionId());

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', activeOptionId());
  });

  it('opens on ArrowUp, Home, and End too (closed-state open keys)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    for (const key of ['{ArrowUp}', '{Home}', '{End}']) {
      await user.keyboard(key);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Opening always starts from the current value, whatever the key.
      expect(trigger).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: /\+421/ }).id
      );
      await user.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('ArrowDown/ArrowUp move aria-activedescendant between options, clamping at the ends', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const skOption = screen.getByRole('option', { name: /\+421/ });
    const czOption = screen.getByRole('option', { name: /\+420/ });

    expect(trigger).toHaveAttribute('aria-activedescendant', skOption.id);

    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-activedescendant', czOption.id);

    await user.keyboard('{ArrowDown}'); // clamp at the last option
    expect(trigger).toHaveAttribute('aria-activedescendant', czOption.id);

    await user.keyboard('{ArrowUp}');
    expect(trigger).toHaveAttribute('aria-activedescendant', skOption.id);

    await user.keyboard('{ArrowUp}'); // clamp at the first option
    expect(trigger).toHaveAttribute('aria-activedescendant', skOption.id);
  });

  it('Home/End jump to the first/last option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const skOption = screen.getByRole('option', { name: /\+421/ });
    const czOption = screen.getByRole('option', { name: /\+420/ });

    await user.keyboard('{End}');
    expect(trigger).toHaveAttribute('aria-activedescendant', czOption.id);

    await user.keyboard('{Home}');
    expect(trigger).toHaveAttribute('aria-activedescendant', skOption.id);
  });

  it('Enter selects the active option, calls onChange, closes the listbox, and keeps focus on the trigger', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open, active = +421
    await user.keyboard('{ArrowDown}'); // move active to +420
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('+420');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('Space selects the active option too', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('+420');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Escape closes the listbox without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Harness onChange={vi.fn()} />
        <button type="button">outside</button>
      </>
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Tab closes the listbox without changing the selection and lets focus move on naturally', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <>
        <Harness onChange={onChange} />
        <button type="button">next</button>
      </>
    );
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}'); // move active to +420, but don't select it
    await user.keyboard('{Tab}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
  });

  it('marks exactly the selected option aria-selected, independent of the keyboard-active one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open; active = +421 (selected)
    await user.keyboard('{ArrowDown}'); // active moves to +420 (not selected)

    const skOption = screen.getByRole('option', { name: /\+421/ });
    const czOption = screen.getByRole('option', { name: /\+420/ });
    expect(skOption).toHaveAttribute('aria-selected', 'true');
    expect(czOption).toHaveAttribute('aria-selected', 'false');
  });

  it('each option renders a hidden flag and its prefix code as accessible text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    const skOption = screen.getByRole('option', { name: /\+421/ });
    const czOption = screen.getByRole('option', { name: /\+420/ });

    expect(skOption.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(czOption.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(skOption).toHaveTextContent('+421');
    expect(czOption).toHaveTextContent('+420');
  });

  it('selecting an option by click updates the selection and closes the listbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Harness onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /\+420/ }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('+420');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('without labelledBy: aria-label conveys the current selection and updates when value changes', () => {
    const { rerender } = renderWithProviders(<PrefixCombobox id="phonePrefix" value="+421" onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    expect(trigger).toHaveAccessibleName(/\+421/);

    rerender(<PrefixCombobox id="phonePrefix" value="+420" onChange={vi.fn()} />);
    expect(trigger).toHaveAccessibleName(/\+420/);
  });

  it('with labelledBy: aria-labelledby wires the external label plus the current selection, and tracks value changes', () => {
    const { rerender } = renderWithProviders(
      <>
        <span id="external-label">Predvoľba krajiny</span>
        <PrefixCombobox id="phonePrefix" value="+421" onChange={vi.fn()} labelledBy="external-label" />
      </>
    );
    const trigger = screen.getByRole('combobox');

    const labelledBy = trigger.getAttribute('aria-labelledby');
    expect(labelledBy).toContain('external-label');
    expect(trigger).not.toHaveAttribute('aria-label');
    expect(trigger).toHaveAccessibleName(/Predvoľba krajiny/);
    expect(trigger).toHaveAccessibleName(/\+421/);

    rerender(
      <>
        <span id="external-label">Predvoľba krajiny</span>
        <PrefixCombobox id="phonePrefix" value="+420" onChange={vi.fn()} labelledBy="external-label" />
      </>
    );
    expect(trigger).toHaveAccessibleName(/Predvoľba krajiny/);
    expect(trigger).toHaveAccessibleName(/\+420/);
  });

  it('shows no visible prefix text inside the trigger (flag + chevron only)', () => {
    renderWithProviders(<Harness onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox');

    // The trigger conveys the selection to AT via its accessible name, but
    // renders no prefix digits — those live inside the phone number input
    // (PhoneField, Task 11). Without `labelledBy` there is no hidden span
    // either, so the trigger has NO text content at all.
    expect(trigger).not.toHaveTextContent(/\+42/);
    expect(trigger.textContent).toBe('');
  });

  it('is fully controlled: an onChange the parent ignores never changes the rendered selection, only the value prop does', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn(); // deliberately not fed back into `value`
    const { rerender } = renderWithProviders(<PrefixCombobox id="phonePrefix" value="+421" onChange={onChange} />);
    const trigger = screen.getByRole('combobox');

    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: /\+420/ }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('+420');
    expect(trigger).toHaveAccessibleName(/\+421/); // still the old value — component didn't mutate it internally

    rerender(<PrefixCombobox id="phonePrefix" value="+420" onChange={onChange} />);
    expect(trigger).toHaveAccessibleName(/\+420/);
  });
});
