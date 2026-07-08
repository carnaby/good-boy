'use client';

import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { fieldLabelId } from '@/components/ui/FormField';
import { useShelters } from '@/features/api/queries';

export interface ShelterSelectA11yProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export interface ShelterSelectProps {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: boolean;
  a11y: ShelterSelectA11yProps;
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

// `appearance: none` drops the native chevron so the custom one below can
// take its place; the real border is reserved (transparent) even when
// `$error` is false so toggling it never shifts layout (same trick as
// `TextInput`).
const StyledSelect = styled.select<{ $error?: boolean }>`
  width: 100%;
  height: 56px;
  padding: 0 ${({ theme }) => theme.spacing(10)} 0 ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.error : 'transparent')};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.bodyMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.bodyMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodyMedium.fontWeight};
  appearance: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.32;
    cursor: not-allowed;
  }
`;

const Chevron = styled.svg`
  position: absolute;
  right: ${({ theme }) => theme.spacing(4)};
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  min-height: 56px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
`;

function ChevronDownIcon() {
  return (
    <Chevron width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Chevron>
  );
}

/**
 * Shelter picker — a styled NATIVE `<select>` (not a custom listbox) so
 * keyboard/AT support comes for free. Renders one of three states depending
 * on `useShelters()`: disabled+loading placeholder, an inline error with a
 * retry button (no `<select>` in this state), or the populated dropdown.
 *
 * The error state has no `<select>` for the field's `<label htmlFor={id}>`
 * (rendered by the parent `FormField`) to point at — a `<label for>` only
 * associates with labelable elements (input/select/textarea/…), so leaving
 * that dangling would silently drop the field's name for AT users. Instead
 * the retry container itself becomes `role="group"` + `aria-labelledby`
 * pointing at the SAME label (via `fieldLabelId`, `FormField`'s label id
 * convention) — group semantics, not native label association, but it keeps
 * "Útulok" as the accessible name either way.
 */
export function ShelterSelect({ id, value, onChange, error, a11y }: ShelterSelectProps) {
  const { t } = useTranslation('donation');
  const { data, isPending, isError, refetch } = useShelters();

  if (isError) {
    return (
      <ErrorRow role="group" aria-labelledby={fieldLabelId(id)}>
        <ErrorText>{t('step1.sheltersError')}</ErrorText>
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          {t('common:actions.retry')}
        </Button>
      </ErrorRow>
    );
  }

  return (
    <Wrapper>
      <StyledSelect
        {...a11y}
        id={id}
        $error={error}
        disabled={isPending}
        value={value === null ? '' : String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? null : Number(raw));
        }}
      >
        <option value="" disabled>
          {isPending ? t('step1.sheltersLoading') : t('step1.shelterPlaceholder')}
        </option>
        {data?.map((shelter) => (
          <option key={shelter.id} value={shelter.id}>
            {shelter.name}
          </option>
        ))}
      </StyledSelect>
      <ChevronDownIcon />
    </Wrapper>
  );
}
