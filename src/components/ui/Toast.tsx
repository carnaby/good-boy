'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from './icons';

export interface ToastProps {
  message: string;
  onClose: () => void;
  autoDismissMs?: number;
}

const DEFAULT_AUTO_DISMISS_MS = 6000;

// Slide-up + fade entrance (no existing design covers this state, so this is
// a from-scratch treatment). Same shape as `WizardLayout`'s `stepEnter`
// (opacity + a single `translateY`, `ease-out`) — just a taller offset and a
// touch longer since this is a bigger, more attention-grabbing surface than
// a step transition.
// The "to" keyframe (translateX(-50%) translateY(0)) matches `Wrapper`'s own
// static `transform` below exactly, so once the animation finishes and the
// element falls back to its plain (non-animated) style, there's no visual
// snap.
const toastEnter = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, 16px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

// Bottom-center (over top-center): `StepHeading` focuses itself on mount, so
// a toast surfacing right after a step transition (e.g. a "saved"
// confirmation) never visually competes with the just-announced heading at
// the top of the page.
const Wrapper = styled.div`
  position: fixed;
  left: 50%;
  bottom: ${({ theme }) => theme.spacing(6)};
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: calc(100vw - ${({ theme }) => theme.spacing(8)});
  padding: ${({ theme }) => theme.spacing(4)};
  padding-left: ${({ theme }) => theme.spacing(5)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.primaryLight};
  /* One-off shadow literal: the design system has no elevation/shadow token,
     so a one-off box-shadow here is intentional. A touch stronger than a
     typical resting-state card shadow (still soft, no hard edge) so this
     reads as a deliberately elevated, hard-to-miss surface. */
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.2);
  animation: ${toastEnter} ${({ theme }) => theme.motion.medium} ${({ theme }) => theme.motion.easeOut};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const IconCircle = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
`;

const Message = styled.p`
  margin: 0;
  flex: 1 1 auto;
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  transition: color ${({ theme }) => theme.motion.fast} ease;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Transient status message, portaled to `document.body` so it always renders
 * above whatever's currently mounted regardless of where `<Toast>` itself
 * lives in the tree. `role="status"` carries an implicit `aria-live="polite"`
 * (+ `aria-atomic`) per the ARIA spec, so no explicit `aria-live` is needed.
 *
 * No `useHasMounted` gate: unlike a step page's body copy, a toast is only
 * ever mounted in response to a client-side event (a mutation settling, a
 * save completing, …), never as part of the initial SSR/hydration pass, so
 * `document` is always available by the time this renders.
 *
 * Deliberately prominent (a plain version proved easy to miss) — a leading
 * check glyph in a `primaryLight` circle, a
 * `primaryLight` border + a slightly stronger shadow, semibold message text,
 * and a slide-up/fade entrance (`prefers-reduced-motion: reduce` disables it,
 * matching `WizardLayout`'s step-enter convention).
 *
 * Auto-dismisses after `autoDismissMs` (default 6s) by calling `onClose` —
 * it's the caller's job to stop rendering `<Toast>` in response (typically
 * unmounting it, which also cancels the timer below). The timer is re-armed
 * whenever `autoDismissMs` changes and always cleared on unmount, so it can
 * never fire against an unmounted caller or fire twice for one mount.
 */
export function Toast({ message, onClose, autoDismissMs = DEFAULT_AUTO_DISMISS_MS }: ToastProps) {
  const { t } = useTranslation('common');
  // Keeps the effect below from re-arming the timer just because the
  // caller re-created its `onClose` callback identity on some unrelated
  // re-render — only `autoDismissMs` changing should reset the countdown.
  // Written from an effect (not inline during render) per the rules of
  // hooks: mutating a ref's `.current` is only safe outside of render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  return createPortal(
    <Wrapper role="status">
      <IconCircle aria-hidden="true">
        <CheckIcon size={16} />
      </IconCircle>
      <Message>{message}</Message>
      <CloseButton type="button" aria-label={t('actions.close')} onClick={onClose}>
        <CloseIcon />
      </CloseButton>
    </Wrapper>,
    document.body
  );
}
