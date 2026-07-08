'use client';

import { useId, useRef, type ChangeEvent, type MouseEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { PrefixCombobox } from './PrefixCombobox';
import type { PhonePrefix } from '../store';

export interface PhoneFieldProps {
  /** The national-number `<input>`'s id, verbatim; the shared error slot's
   * id derives from it (`${id}-error` — the input's `aria-describedby`
   * target). The group label and prefix trigger use internal
   * `useId()`-based ids instead. */
  id: string;
  prefix: PhonePrefix;
  onPrefixChange: (value: PhonePrefix) => void;
  number: string;
  onNumberChange: (value: string) => void;
  /** Already-translated error message text (caller resolves `t(error.message)`), like `FormField`. */
  error?: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

const GroupLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.labelMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.labelMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.labelMedium.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

// Mirrors `TextInput`'s box (h56, `radii.sm`, `surface` background, reserved
// transparent border) so the compound row reads as one continuous input —
// even though the `<input>` inside only ever holds the national number.
// `cursor: text` + the click-to-focus handler below keep that illusion
// honest: clicking the static prefix or the box's padding behaves like
// clicking anywhere in a normal text input.
const NumberBox = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex: 1 1 0;
  min-width: 0;
  height: 56px;
  padding: 0 ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ $error, theme }) => ($error ? theme.colors.error : 'transparent')};
  background: ${({ theme }) => theme.colors.surface};
  cursor: text;
`;

const PrefixStatic = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  font-weight: ${({ theme }) => theme.typography.body.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// No `outline: none` override here (unlike `AmountPicker`'s underline
// substitute) — this input keeps the global `:focus-visible` ring as its
// visible focus indicator, same as `TextInput`.
//
// `width: 0` (mobile overflow fix, round 2): an `<input>` has a
// ~220px default intrinsic width (`size="20"`), and `min-width: 0` alone
// only lets it shrink at *layout* time — the intrinsic width still feeds the
// flex container's min-content and propagated all the way up into the
// wizard's grid track, stretching the page horizontally on mobile. A
// definite zero width kills that contribution at the source; the rendered
// width is unaffected because `flex: 1 1 0` (basis 0 + grow) is what
// actually sizes it inside `NumberBox`.
const NumberInput = styled.input`
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  font-weight: ${({ theme }) => theme.typography.body.fontWeight};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;

/**
 * Groups `PrefixCombobox` + the national-number input under ONE visible
 * label ("Telefónne číslo"), per the Figma phone row. Semantics: the
 * wrapper is `role="group"` + `aria-labelledby` pointing at a plain `<span>`
 * label (chosen over `<fieldset>`/`<legend>` purely to avoid fighting the
 * browser's default fieldset/legend box model — a `role="group"` `<div>`
 * gets the same "these controls belong together, here's their name" AT
 * semantics without any extra CSS reset).
 *
 * The selected prefix renders as static text (e.g. "+420") at the start of
 * the number box, visually inside the same bordered container as the
 * `<input>` — but the `<input>` element itself holds ONLY the national
 * number, never the prefix. The number input carries its own
 * `aria-label` ("Telefónne číslo bez predvoľby") since the visible label
 * names the *group*, not this specific control; `PrefixCombobox` gets
 * `labelledBy` pointing at the same group label instead of composing its
 * own `aria-label`.
 *
 * One shared error slot below the row — its id is the number input's
 * `aria-describedby` target (the combobox has no separate error state; the
 * schema's phone errors are all reported against `phoneNumber`).
 */
export function PhoneField({ id, prefix, onPrefixChange, number, onNumberChange, error }: PhoneFieldProps) {
  const { t } = useTranslation('donation');
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const prefixId = `${baseId}-prefix`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    onNumberChange(event.target.value);
  }

  // Clicking the static prefix or the box's padding focuses the input, so
  // the whole bordered container behaves like one text field. Guarded so a
  // click landing on the `<input>` itself is left to the browser's native
  // focus/caret handling.
  function handleBoxClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== inputRef.current) inputRef.current?.focus();
  }

  return (
    <Wrapper role="group" aria-labelledby={labelId}>
      <GroupLabel id={labelId}>{t('step2.phoneLabel')}</GroupLabel>
      <Row>
        <PrefixCombobox id={prefixId} value={prefix} onChange={onPrefixChange} labelledBy={labelId} />
        <NumberBox $error={Boolean(error)} onClick={handleBoxClick}>
          <PrefixStatic>{prefix}</PrefixStatic>
          <NumberInput
            ref={inputRef}
            id={id}
            type="tel"
            autoComplete="tel-national"
            placeholder={t('step2.phonePlaceholder')}
            aria-label={t('step2.phoneNumberAriaLabel')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            value={number}
            onChange={handleNumberChange}
          />
        </NumberBox>
      </Row>
      {/* Always mounted so a later-appearing error is announced by AT;
          empty when there's nothing to say — same pattern as `FormField`. */}
      <div aria-live="polite">{error ? <ErrorText id={errorId}>{error}</ErrorText> : null}</div>
    </Wrapper>
  );
}
