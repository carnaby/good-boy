'use client';

import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useHasMounted } from '@/lib/use-has-mounted';
import { useContribute, useShelters } from '@/features/api/queries';
import { ApiError } from '@/features/api/client';
import type { ApiMessage, ContributeRequest } from '@/features/api/schemas';
import { Stepper } from '../components/Stepper';
import { StepHeading } from '../components/StepHeading';
import { StepActions } from '../components/StepActions';
import { SummaryList, type SummaryGroup } from '../components/SummaryList';
import { stepConsentSchema, type StepConsentValues } from '../schemas';
import { toContributeRequest } from '../mapper';
import { useDonationStore, type DonationDraft } from '../store';

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(8)};
  width: 100%;
`;

const ConsentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;

const AlertBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.error};
  /* One-off rgba of the error token for a low-alpha tint background: the
     design system has no "error surface" token, so a one-off rgba of the
     error color here is intentional rather than an oversight. */
  background: rgba(190, 18, 60, 0.06);
`;

const AlertText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const AlertLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
`;

const AlertActions = styled.div`
  display: flex;
`;

// joi validation `path`s the API can send back on a 400. Contributor-scoped
// fields are prefixed with `body.contributors.<index>.` (ANY donor index —
// the visible message names only the FIELD, never the donor, so the index
// is matched but deliberately not surfaced); the help-selection fields sit
// directly under `body`.
const CONTRIBUTOR_PATH_REGEX = /^body\.contributors\.\d+\./;
const HELP_SELECTION_PATHS = new Set(['body.value', 'body.shelterID']);

const CONTRIBUTOR_FIELD_I18N_KEYS: Record<string, string> = {
  firstName: 'step3.errors.fieldNames.firstName',
  lastName: 'step3.errors.fieldNames.lastName',
  email: 'step3.errors.fieldNames.email',
  phone: 'step3.errors.fieldNames.phone',
};

interface ValidationClassification {
  /** i18n keys for the (deduplicated, order-of-first-appearance) affected contributor fields. */
  fieldKeys: string[];
  hasHelpSelectionError: boolean;
}

/**
 * Groups a 400 response's `messages[].path`s into "which step needs fixing":
 * contributor-scoped paths (step 2's fields) vs. help/amount paths (step 1).
 * A path this function doesn't recognize is silently dropped — the caller
 * still shows the generic `step3.errors.validation` text either way.
 */
function classifyValidationMessages(messages: ApiMessage[]): ValidationClassification {
  const fieldKeys: string[] = [];
  let hasHelpSelectionError = false;

  for (const message of messages) {
    const path = message.path;
    if (!path) continue;

    const contributorMatch = CONTRIBUTOR_PATH_REGEX.exec(path);
    if (contributorMatch) {
      const suffix = path.slice(contributorMatch[0].length);
      const key = CONTRIBUTOR_FIELD_I18N_KEYS[suffix];
      if (key && !fieldKeys.includes(key)) fieldKeys.push(key);
    } else if (HELP_SELECTION_PATHS.has(path)) {
      hasHelpSelectionError = true;
    }
  }

  return { fieldKeys, hasHelpSelectionError };
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Both supported prefixes take 9-digit national numbers (see `phone.ts`), so
// a fixed 3-3-3 split always covers the stored (already-normalized, digits
// only) `phoneNumber`; anything that doesn't match that shape (shouldn't
// happen post-Step2-validation) is shown as-is rather than mangled.
const PHONE_GROUPING_REGEX = /^(\d{3})(\d{3})(\d{3})$/;

function formatPhone(prefix: string, number: string): string {
  const match = PHONE_GROUPING_REGEX.exec(number);
  const grouped = match ? `${match[1]} ${match[2]} ${match[3]}` : number;
  return `${prefix} ${grouped}`;
}

/** Punctuation, not copy — used as-is regardless of locale. */
const SHELTER_NAME_FALLBACK = '—';

interface ErrorPanelProps {
  // `unknown`, not `ApiError`: `mutation.error` is typed as `ApiError` by
  // `useContribute`, but that's a lie the type system can't catch — a 200
  // response with a body that doesn't match `contributeResponseSchema` makes
  // `apiFetch` throw the schema's own `ZodError` instead (see the contract
  // note on `apiFetch` in `src/features/api/client.ts`), and that ZodError
  // reaches this component as `mutation.error` just the same. Typing `error`
  // as `unknown` and narrowing with `instanceof ApiError` below means that
  // contract-drift ZodError can never crash this render by reaching for
  // `.kind`/`.messages` off a shape it doesn't have — it just falls into the
  // same "server" branch as a real 5xx, generic message and a retry button.
  error: unknown;
  onRetry: () => void;
}

/**
 * Maps `mutation.error`'s `ApiError.kind` to the full error taxonomy: a
 * network/server error gets a generic message plus a retry button (re-firing
 * the exact same request); a validation error gets a generic message plus,
 * where the API's `messages[].path`s are recognized, links back to whichever
 * step needs fixing — no retry button, since editing is the actual recovery
 * path there.
 */
function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const { t } = useTranslation('donation');
  const { t: tCommon } = useTranslation('common');

  const apiError = error instanceof ApiError ? error : null;
  // Anything that isn't an `ApiError` (the contract-drift ZodError case above)
  // is presented exactly like a `'server'` `ApiError` would be.
  if (!apiError || apiError.kind === 'network' || apiError.kind === 'server') {
    const kindKey = apiError?.kind === 'network' ? 'network' : 'server';
    return (
      <AlertBox role="alert">
        <AlertText>{t(`step3.errors.${kindKey}`)}</AlertText>
        <AlertActions>
          <Button type="button" variant="secondary" onClick={onRetry}>
            {tCommon('actions.retry')}
          </Button>
        </AlertActions>
      </AlertBox>
    );
  }

  const { fieldKeys, hasHelpSelectionError } = classifyValidationMessages(apiError.messages);

  return (
    <AlertBox role="alert">
      <AlertText>{t('step3.errors.validation')}</AlertText>
      {fieldKeys.length > 0 ? (
        <AlertText>
          {t('step3.errors.fieldsIntro')} {fieldKeys.map((key) => t(key)).join(', ')}{' '}
          <AlertLink href="/osobne-udaje">{t('step3.editPersonalAria')}</AlertLink>
        </AlertText>
      ) : null}
      {hasHelpSelectionError ? (
        <AlertText>
          <AlertLink href="/">{t('step3.editHelpAria')}</AlertLink>
        </AlertText>
      ) : null}
    </AlertBox>
  );
}

interface Step3FormProps {
  draft: DonationDraft;
  shelterName: string;
  onBack: () => void;
  /** Marks the submit as succeeded; MUST be called before the store reset (see the guard in `Step3`). */
  onSubmitSucceeded: () => void;
}

function Step3Form({ draft, shelterName, onBack, onSubmitSucceeded }: Step3FormProps) {
  const { t } = useTranslation('donation');
  const router = useRouter();
  const setConsent = useDonationStore((state) => state.setConsent);
  const reset = useDonationStore((state) => state.reset);
  const mutation = useContribute();
  // Holds the exact payload of the most recent submit attempt so "Skúsiť
  // znova" can re-fire THE SAME request rather than rebuilding one (which
  // would coincidentally be identical here, since nothing else can change
  // the draft while this error panel is showing, but re-using the captured
  // payload keeps that invariant explicit). Plain state rather than a ref:
  // it's only ever read from an event handler (never during render), and
  // `useCallback`-wrapped functions that read/write a ref's `.current` trip
  // the `react-hooks/refs` rule when handed to `handleSubmit`, which can't
  // be proven (by static analysis) to invoke them outside of render.
  const [lastPayload, setLastPayload] = useState<ContributeRequest | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StepConsentValues>({
    resolver: zodResolver(stepConsentSchema),
    // `stepConsentSchema`'s `z.literal(true, …)` types `StepConsentValues.consent`
    // as the literal `true` — but the actual pre-validation UI state (and the
    // store's `consent` field it's seeded from) is a plain `boolean`, and can
    // very much be `false` here (that's exactly what surfaces the "required"
    // error on submit). The cast only bridges that type gap; the real runtime
    // value flows through unchanged.
    defaultValues: { consent: draft.consent as true },
  });

  const consentError = errors.consent?.message ? t(errors.consent.message) : undefined;

  const submitPayload = useCallback(
    (payload: ContributeRequest) => {
      setLastPayload(payload);
      mutation.mutate(payload, {
        onSuccess: () => {
          // Order matters: flag success BEFORE reset(). reset() drops
          // `completedStep` to 0, which would otherwise re-trigger the outer
          // guard's `replace('/')` and race (and likely beat) the `push`
          // below, stranding the user on "/" after a successful donation.
          // React batches the flag update with the store reset, so the guard
          // effect only ever re-runs with both already applied.
          onSubmitSucceeded();
          reset();
          router.push('/o-projekte?stav=dakujeme');
        },
      });
    },
    [mutation, onSubmitSucceeded, reset, router]
  );

  const onSubmit = handleSubmit(() => {
    submitPayload(toContributeRequest(draft));
  });

  const handleRetry = () => {
    if (lastPayload) submitPayload(lastPayload);
  };

  const helpTypeLabel = draft.helpType === 'foundation' ? t('step3.helpTypeFoundation') : t('step3.helpTypeShelter');

  // Single donor: one heading-less subgroup — renders identically to the
  // pre-multi-donor flat row list. 2+ donors: one subgroup per donor, each
  // headed by "Darca N", still under the ONE "Upraviť osobné údaje" edit
  // link for the whole group below.
  const personalSubgroups: SummaryGroup['subgroups'] = draft.contributors.map((contributor, index) => ({
    heading: draft.contributors.length > 1 ? t('step2.donorHeading', { number: index + 1 }) : undefined,
    rows: [
      { label: t('step3.nameLabel'), value: `${contributor.firstName} ${contributor.lastName}` },
      { label: t('step3.emailLabel'), value: contributor.email },
      { label: t('step3.phoneLabel'), value: formatPhone(contributor.phonePrefix, contributor.phoneNumber) },
    ],
  }));

  const groups: SummaryGroup[] = [
    {
      title: t('step3.summaryTitle'),
      editHref: '/',
      editLabel: t('step3.edit'),
      editAriaLabel: t('step3.editHelpAria'),
      subgroups: [
        {
          rows: [
            { label: t('step3.helpTypeLabel'), value: helpTypeLabel },
            ...(draft.shelterId !== null ? [{ label: t('step3.shelterLabel'), value: shelterName }] : []),
            { label: t('step3.amountLabel'), value: draft.amount !== null ? formatAmount(draft.amount) : '' },
          ],
        },
      ],
    },
    {
      editHref: '/osobne-udaje',
      editLabel: t('step3.edit'),
      editAriaLabel: t('step3.editPersonalAria'),
      subgroups: personalSubgroups,
    },
  ];

  const isPending = mutation.isPending;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Fields>
        <SummaryList groups={groups} />

        <ConsentRow>
          <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="consent"
                checked={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  setConsent(value);
                }}
                error={Boolean(consentError)}
                aria-describedby={consentError ? 'consent-error' : undefined}
              >
                {t('step3.consentLabel')}
              </Checkbox>
            )}
          />
          <div aria-live="polite">{consentError ? <ErrorText id="consent-error">{consentError}</ErrorText> : null}</div>
        </ConsentRow>

        {mutation.isError ? <ErrorPanel error={mutation.error} onRetry={handleRetry} /> : null}

        <StepActions onBack={onBack} nextLabel={t('step3.submit')} nextDisabled={isPending} nextBusy={isPending} />
      </Fields>
    </form>
  );
}

export function Step3() {
  const { t } = useTranslation('donation');
  const router = useRouter();
  const hasMounted = useHasMounted();
  // Success-path guard escape hatch: submitting successfully reset()s the
  // store (completedStep back to 0) before push()ing to the thank-you page,
  // which would otherwise re-arm the "not far enough into the wizard"
  // redirect below and race the push with a replace('/'). Set (via
  // `onSubmitSucceeded`) BEFORE the reset so the guard stands down first.
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const completedStep = useDonationStore((state) => state.completedStep);
  const helpType = useDonationStore((state) => state.helpType);
  const shelterId = useDonationStore((state) => state.shelterId);
  const amount = useDonationStore((state) => state.amount);
  const contributors = useDonationStore((state) => state.contributors);
  const consent = useDonationStore((state) => state.consent);
  const { data: shelters } = useShelters();

  // Same rehydration-timing rationale as Step2's guard: only redirect once
  // `hasMounted` confirms `completedStep` reflects the real (possibly
  // rehydrated) draft, not the pristine first-render snapshot. This step
  // additionally requires step 2 (not just step 1) to be done.
  useEffect(() => {
    if (hasMounted && completedStep < 2 && !submitSucceeded) {
      router.replace('/');
    }
  }, [hasMounted, completedStep, submitSucceeded, router]);

  const canRenderForm = hasMounted && completedStep >= 2;
  // Em dash rather than a blank string: the shelters query can still be
  // loading, or can have errored, at the moment this renders — either way
  // there's no name to show yet, and a blank "Útulok" value would read as a
  // rendering bug rather than a known, temporary gap.
  const shelterName = shelters?.find((shelter) => shelter.id === shelterId)?.name ?? SHELTER_NAME_FALLBACK;

  return (
    <WizardLayout image="/images/dog-steps.jpg">
      <Stepper current={3} />
      <StepHeading>{t('step3.heading')}</StepHeading>
      {canRenderForm ? (
        <Step3Form
          draft={{ helpType, shelterId, amount, contributors, consent }}
          shelterName={shelterName}
          onBack={() => router.push('/osobne-udaje')}
          onSubmitSucceeded={() => setSubmitSucceeded(true)}
        />
      ) : null}
    </WizardLayout>
  );
}
