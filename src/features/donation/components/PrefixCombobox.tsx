'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { SkFlag, CzFlag } from '@/components/ui/flags';
import { PHONE_PREFIXES } from '../phone';
import type { PhonePrefix } from '../store';

export interface PrefixComboboxProps {
  /** Trigger element id — what a `FormField`/`PhoneField` label associates with. */
  id: string;
  value: PhonePrefix;
  onChange: (value: PhonePrefix) => void;
  /**
   * Id of an external `<label>`-ish element. When given, the trigger's name
   * is wired via `aria-labelledby` (external label + an internal
   * `VisuallyHidden` span holding the current selection) instead of
   * `aria-label`.
   */
  labelledBy?: string;
}

// Order matches the Figma "Step 2" phone row — SK is the default prefix
// (see `initialDraft.phonePrefix` in `store.ts`).
const PREFIX_ORDER: readonly PhonePrefix[] = ['+421', '+420'];

const FLAG_BY_COUNTRY = { SK: SkFlag, CZ: CzFlag } as const;

// `PHONE_PREFIXES[prefix].country` is `'SK' | 'CZ'`; the i18n JSON keys its
// `phone.options` object by lowercase country code (`sk`/`cz`) instead of by
// prefix value, so this table bridges the two. It only holds the *country
// name* (e.g. "Slovensko") — the prefix digits are never baked into copy,
// `PHONE_PREFIXES` stays the single source of truth for those.
const COUNTRY_I18N_KEY = { SK: 'sk', CZ: 'cz' } as const;

const OPEN_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End']);

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

// `:focus-visible` styling is inherited from the global reset (no override
// here) — the ring must stay visible on this trigger, per the a11y contract.
const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 80px;
  height: 56px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
`;

const Chevron = styled.svg`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Listbox = styled.div`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.spacing(1)});
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 160px;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.white};
`;

// Selected always reads as `primaryLight` regardless of keyboard position;
// an active-but-not-selected option (the current arrow-key cursor) gets the
// subtler `surface` highlight so the two states stay visually distinct.
const Option = styled.div<{ $active: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ $active, $selected, theme }) => {
    if ($selected) return theme.colors.primaryLight;
    if ($active) return theme.colors.surface;
    return 'transparent';
  }};
`;

const OptionCode = styled.span`
  font-size: ${({ theme }) => theme.typography.bodyMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.bodyMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodyMedium.fontWeight};
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
 * Phone country-prefix picker — a WAI-ARIA APG "select-only combobox"
 * (trigger `role="combobox"` + `aria-activedescendant`, popup
 * `role="listbox"`/`role="option"`), NOT a native `<select>`, because the
 * trigger shows only a flag + chevron (no visible text — the prefix digits
 * render inside the phone number input, `PhoneField`'s job) while still
 * needing an accessible name that announces the current selection.
 *
 * Focus never moves into the listbox: keyboard navigation while open just
 * moves `aria-activedescendant` and the trigger keeps DOM focus throughout,
 * including after a selection (Enter/Space) or Escape.
 */
export function PrefixCombobox({ id, value, onChange, labelledBy }: PrefixComboboxProps) {
  const { t } = useTranslation('donation');
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const valueTextId = `${baseId}-value`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => PREFIX_ORDER.indexOf(value));

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Click-outside-closes: a document-level listener attached only while
  // open, torn down on close/unmount so no listener ever leaks between tests
  // or renders.
  useEffect(() => {
    if (!open) return undefined;

    function handleDocumentMouseDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [open]);

  function optionId(prefix: PhonePrefix): string {
    return `${baseId}-option-${COUNTRY_I18N_KEY[PHONE_PREFIXES[prefix].country]}`;
  }

  function optionLabel(prefix: PhonePrefix): string {
    const countryName = t(`phone.options.${COUNTRY_I18N_KEY[PHONE_PREFIXES[prefix].country]}`);
    return `${countryName} ${prefix}`;
  }

  function openList() {
    setActiveIndex(PREFIX_ORDER.indexOf(value));
    setOpen(true);
  }

  function selectIndex(index: number) {
    onChange(PREFIX_ORDER[index]);
    setOpen(false);
  }

  function handleTriggerClick() {
    if (open) {
      setOpen(false);
    } else {
      openList();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (OPEN_KEYS.has(event.key)) {
        // Prevent the browser's default Enter/Space button-activation so it
        // never fires a synthetic click that would re-toggle right after
        // `openList()` runs.
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, PREFIX_ORDER.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(PREFIX_ORDER.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectIndex(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        // No `preventDefault` — Tab must still move focus on naturally; it
        // just closes the popup without changing the selection.
        setOpen(false);
        break;
      default:
        break;
    }
  }

  const CurrentFlag = FLAG_BY_COUNTRY[PHONE_PREFIXES[value].country];
  const currentLabel = optionLabel(value);
  const prefixLabel = t('phone.prefixLabel');

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        // Only referenced while the listbox is actually mounted — the popup
        // unmounts when closed, so an always-on `aria-controls` would dangle
        // (axe `aria-valid-attr-value`), same reasoning as
        // `aria-activedescendant` below.
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(PREFIX_ORDER[activeIndex]) : undefined}
        aria-label={labelledBy ? undefined : `${prefixLabel}: ${currentLabel}`}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueTextId}` : undefined}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
      >
        <CurrentFlag />
        <ChevronDownIcon />
        {labelledBy ? <VisuallyHidden id={valueTextId}>{currentLabel}</VisuallyHidden> : null}
      </Trigger>

      {open ? (
        <Listbox id={listboxId} role="listbox" aria-label={prefixLabel}>
          {PREFIX_ORDER.map((prefix, index) => {
            const country = PHONE_PREFIXES[prefix].country;
            const Flag = FLAG_BY_COUNTRY[country];
            const selected = prefix === value;
            const active = index === activeIndex;

            return (
              <Option
                key={prefix}
                id={optionId(prefix)}
                role="option"
                aria-selected={selected}
                $active={active}
                $selected={selected}
                // Options are never focusable (activedescendant pattern) so
                // a mouse click can't move focus off the trigger anyway;
                // this is just defensive against that assumption changing.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectIndex(index)}
              >
                <Flag />
                <VisuallyHidden>{t(`phone.options.${COUNTRY_I18N_KEY[country]}`)}</VisuallyHidden>
                <OptionCode>{prefix}</OptionCode>
              </Option>
            );
          })}
        </Listbox>
      ) : null}
    </Wrapper>
  );
}
