'use client';

import { useState, type ChangeEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

export interface AmountPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: boolean;
  describedBy?: string;
}

const PRESETS = [5, 10, 20, 30, 50, 100] as const;

const currencyFormatter = new Intl.NumberFormat('sk-SK', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(6)};
  width: 100%;
`;

// The underline IS the focus indicator (owner decision — no outline ring):
// idle it's a 2px gray \`border\`-token line; while the input inside has
// focus (\`:focus-within\`) it becomes 3px \`primary\`. That color + thickness
// change is the WCAG-visible focus indicator — do NOT re-add an outline
// ring on the input. \`padding-bottom\` shrinks by the same 1px the border
// grows, so focusing never shifts layout.
const CustomRow = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(1)};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing(1)};

  &:focus-within {
    border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
    padding-bottom: calc(${({ theme }) => theme.spacing(1)} - 1px);
  }
`;

const CustomInput = styled.input<{ $chars: number }>`
  /* Figma's "O projekte" instance of Metric uses the token's 60px/72px size
     as-is, but this particular field renders visibly heavier than
     \`theme.typography.metric.fontWeight\` (400) — 600 is a literal to match
     the design PNG rather than a second metric-weight token for one field. */
  width: ${({ $chars }) => Math.max(3, $chars + 1)}ch;
  border: none;
  background: transparent;
  text-align: right;
  font-size: ${({ theme }) => theme.typography.metric.fontSize};
  line-height: ${({ theme }) => theme.typography.metric.lineHeight};
  font-weight: 600;
  letter-spacing: ${({ theme }) => theme.typography.metric.letterSpacing};
  color: ${({ theme }) => theme.colors.textPrimary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  /* The wrapper's underline change (gray 2px -> primary 3px on
     :focus-within) is the WCAG-visible focus indicator for this field —
     that's why the ring is suppressed here. */
  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

const CurrencySuffix = styled.span`
  font-size: ${({ theme }) => theme.typography.section.fontSize};
  line-height: ${({ theme }) => theme.typography.section.lineHeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ChipRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const Chip = styled.button<{ $active: boolean }>`
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.bodyMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.bodyMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodyMedium.fontWeight};
  cursor: pointer;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.surface)};
  color: ${({ $active, theme }) => ($active ? theme.colors.inverseText : theme.colors.textPrimary)};
`;

/** Comma-tolerant decimal parse; `''` (and anything non-numeric) become `null`. */
function parseAmountInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Amount input with two-way chips <-> input sync (owner decision): the RHF
 * `amount` value is the single source of truth. The custom input always
 * displays the current amount (a chip click writes its number into the
 * input), a chip is active iff `value === chip` — so typing "20" lights the
 * 20 chip, typing "23" lights none, clearing the input yields `null`. The
 * `text` state only preserves in-progress input (e.g. a trailing "7,") that
 * wouldn't survive a round-trip through parsing; it never diverges from
 * `value` in meaning. Fully controlled — the caller (an RHF `Controller`)
 * owns `value`.
 */
export function AmountPicker({ value, onChange, error, describedBy }: AmountPickerProps) {
  const { t } = useTranslation('donation');
  const [text, setText] = useState(value === null ? '' : String(value));

  function handleChipClick(amount: number) {
    setText(String(amount));
    onChange(amount);
  }

  function handleCustomChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    setText(raw);
    onChange(parseAmountInput(raw));
  }

  return (
    <Wrapper>
      <CustomRow>
        <CustomInput
          type="text"
          inputMode="decimal"
          aria-label={t('step1.customAmountLabel')}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          value={text}
          $chars={text.length}
          onChange={handleCustomChange}
          placeholder="0"
        />
        <CurrencySuffix>€</CurrencySuffix>
      </CustomRow>
      <ChipRow>
        {PRESETS.map((amount) => {
          const active = value === amount;
          return (
            <Chip key={amount} type="button" aria-pressed={active} $active={active} onClick={() => handleChipClick(amount)}>
              {currencyFormatter.format(amount)}
            </Chip>
          );
        })}
      </ChipRow>
    </Wrapper>
  );
}
