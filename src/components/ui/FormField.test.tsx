import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { FormField, fieldA11yProps } from './FormField';
import { TextInput } from './TextInput';

describe('FormField', () => {
  it('associates the label with the input via htmlFor/id', () => {
    renderWithProviders(
      <FormField id="email" label="E-mail">
        <TextInput {...fieldA11yProps('email')} />
      </FormField>
    );

    expect(screen.getByLabelText('E-mail')).toBeInstanceOf(HTMLInputElement);
  });

  it('wires aria-invalid, aria-describedby, and a visible error message when error is set', () => {
    renderWithProviders(
      <FormField id="email" label="E-mail" error="Zadajte Váš e-mail">
        <TextInput {...fieldA11yProps('email', 'Zadajte Váš e-mail')} />
      </FormField>
    );

    const input = screen.getByLabelText('E-mail');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');

    const error = screen.getByText('Zadajte Váš e-mail');
    expect(error).toBeVisible();
    expect(error).toHaveAttribute('id', 'email-error');
  });

  it('renders no error slot content when error is absent', () => {
    renderWithProviders(
      <FormField id="email" label="E-mail">
        <TextInput {...fieldA11yProps('email')} />
      </FormField>
    );

    const input = screen.getByLabelText('E-mail');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
