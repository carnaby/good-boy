import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { renderWithProviders } from '@/test-utils';

function AppName() {
  const { t } = useTranslation('common');
  return <p>{t('appName')}</p>;
}

describe('Providers', () => {
  it('makes translations available via useTranslation inside <Providers>', () => {
    renderWithProviders(<AppName />);

    expect(screen.getByText('Good Boy')).toBeVisible();
  });
});
