import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { Toast } from './Toast';

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('renders the message inside a status region, portaled to document.body', () => {
    renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={() => {}} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Príspevok bol odoslaný');
    // The status wrapper is the portal's own child, so its DIRECT parent
    // must be document.body — `.closest('body')` would pass for any
    // attached element (including one rendered inline in the RTL container)
    // and would prove nothing about portaling.
    expect(status.parentElement).toBe(document.body);
  });

  it('calls onClose exactly once when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Zavrieť' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has a close button with a >=44px touch target', () => {
    renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={() => {}} />);

    const button = screen.getByRole('button', { name: 'Zavrieť' });
    expect(button).toHaveStyle({ width: '44px', height: '44px' });
  });

  it('auto-dismisses after the default 6s timeout by calling onClose', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(5999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('honors a custom autoDismissMs', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={onClose} autoDismissMs={1000} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clears the auto-dismiss timer on unmount, never calling onClose afterwards', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = renderWithProviders(<Toast message="Príspevok bol odoslaný" onClose={onClose} autoDismissMs={1000} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
