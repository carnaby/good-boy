'use client';

import { Fragment, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  useForm,
  useController,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormTrigger,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { FormField, fieldA11yProps } from '@/components/ui/FormField';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useHasMounted } from '@/lib/use-has-mounted';
import { Stepper } from '../components/Stepper';
import { StepHeading } from '../components/StepHeading';
import { StepActions } from '../components/StepActions';
import { PhoneField } from '../components/PhoneField';
import { stepPersonalSchema, type StepPersonalValues } from '../schemas';
import { MAX_CONTRIBUTORS, initialContributor, useDonationStore } from '../store';

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(8)};
  width: 100%;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.section.fontSize};
  line-height: ${({ theme }) => theme.typography.section.lineHeight};
  font-weight: ${({ theme }) => theme.typography.section.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// Meno + Priezvisko side by side at >=md (Figma), stacked below it.
const NameGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`;

// Separates each additional donor from the one before it — a plain 1px
// `border`-token rule, same divider treatment `SummaryList` uses between its
// groups.
const Divider = styled.hr`
  width: 100%;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0;
`;

const DonorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

const DonorHeading = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.labelMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.labelMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.labelMedium.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// A from-scratch "subtle text link" treatment (no direct Figma read for
// this — see `SummaryList`'s `EditLink`, which is the same idea for a
// different action), in the `error` token since removing a donor is a
// destructive action.
const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.spacing(2)};
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.labelMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.labelMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.labelMedium.fontWeight};
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    text-decoration: underline;
  }
`;

interface ContributorFieldsProps {
  index: number;
  control: Control<StepPersonalValues>;
  register: UseFormRegister<StepPersonalValues>;
  errors: FieldErrors<StepPersonalValues>;
  trigger: UseFormTrigger<StepPersonalValues>;
  isSubmitted: boolean;
}

/**
 * One donor's firstName/lastName/email/phone fields, wired to
 * `contributors.${index}.*` — used for every donor (index 0 included), so
 * ids/errors/registration all key off `index` rather than a fixed field
 * name. The caller decides what (if anything) renders above this per donor
 * (the shared "O vás" section title for index 0, a "Darca N" header row for
 * every index after that).
 */
function ContributorFields({ index, control, register, errors, trigger, isSubmitted }: ContributorFieldsProps) {
  const { t } = useTranslation('donation');
  const contributorErrors = errors.contributors?.[index];

  const firstNameId = `contributors.${index}.firstName`;
  const lastNameId = `contributors.${index}.lastName`;
  const emailId = `contributors.${index}.email`;
  const phoneId = `contributors.${index}.phoneNumber`;

  const { field: prefixField } = useController({ name: `contributors.${index}.phonePrefix`, control });
  const { field: numberField } = useController({ name: `contributors.${index}.phoneNumber`, control });

  const firstNameError = contributorErrors?.firstName?.message ? t(contributorErrors.firstName.message) : undefined;
  const lastNameError = contributorErrors?.lastName?.message ? t(contributorErrors.lastName.message) : undefined;
  const emailError = contributorErrors?.email?.message ? t(contributorErrors.email.message) : undefined;
  const phoneError = contributorErrors?.phoneNumber?.message ? t(contributorErrors.phoneNumber.message) : undefined;

  return (
    <>
      <NameGrid>
        <FormField id={firstNameId} label={t('step2.firstNameLabel')} error={firstNameError}>
          <TextInput
            {...register(`contributors.${index}.firstName`)}
            {...fieldA11yProps(firstNameId, firstNameError)}
            error={Boolean(firstNameError)}
            placeholder={t('step2.firstNamePlaceholder')}
            autoComplete="given-name"
          />
        </FormField>
        <FormField id={lastNameId} label={t('step2.lastNameLabel')} error={lastNameError}>
          <TextInput
            {...register(`contributors.${index}.lastName`)}
            {...fieldA11yProps(lastNameId, lastNameError)}
            error={Boolean(lastNameError)}
            placeholder={t('step2.lastNamePlaceholder')}
            autoComplete="family-name"
          />
        </FormField>
      </NameGrid>

      <FormField id={emailId} label={t('step2.emailLabel')} error={emailError}>
        <TextInput
          {...register(`contributors.${index}.email`)}
          {...fieldA11yProps(emailId, emailError)}
          error={Boolean(emailError)}
          type="email"
          placeholder={t('step2.emailPlaceholder')}
          autoComplete="email"
        />
      </FormField>

      <PhoneField
        id={phoneId}
        prefix={prefixField.value}
        onPrefixChange={(next) => {
          prefixField.onChange(next);
          // Same "don't surface premature errors" rule as before: only
          // revalidate once the form's been submitted at least once.
          if (isSubmitted) void trigger(`contributors.${index}.phoneNumber`);
        }}
        number={numberField.value}
        onNumberChange={numberField.onChange}
        error={phoneError}
      />
    </>
  );
}

interface Step2FormProps {
  defaultValues: StepPersonalValues;
  onSaved: (values: StepPersonalValues) => void;
  onBack: () => void;
}

function Step2Form({ defaultValues, onSaved, onBack }: Step2FormProps) {
  const { t } = useTranslation('donation');
  const { t: tCommon } = useTranslation('common');
  const {
    control,
    register,
    handleSubmit,
    trigger,
    setFocus,
    formState: { errors, isSubmitted },
  } = useForm<StepPersonalValues>({
    resolver: zodResolver(stepPersonalSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'contributors' });

  // Focuses the newly-appended donor's first input once it's actually in
  // the DOM (this effect runs post-render, after `register` has wired the
  // new fieldset's ref) — comparing against the previous length so this
  // only fires on an append, never on a remove (which also changes
  // `fields.length`) or on the initial mount.
  const previousLengthRef = useRef(fields.length);
  useEffect(() => {
    if (fields.length > previousLengthRef.current) {
      setFocus(`contributors.${fields.length - 1}.firstName`);
    }
    previousLengthRef.current = fields.length;
  }, [fields.length, setFocus]);

  const canAddDonor = fields.length < MAX_CONTRIBUTORS;

  return (
    <form onSubmit={handleSubmit(onSaved)} noValidate>
      <Fields>
        <Section>
          <SectionTitle>{t('step2.aboutTitle')}</SectionTitle>
          <ContributorFields
            index={0}
            control={control}
            register={register}
            errors={errors}
            trigger={trigger}
            isSubmitted={isSubmitted}
          />
        </Section>

        {fields.slice(1).map((field, i) => {
          const index = i + 1;
          const donorNumber = index + 1;
          return (
            <Fragment key={field.id}>
              <Divider aria-hidden="true" />
              <Section>
                <DonorHeader>
                  <DonorHeading>{t('step2.donorHeading', { number: donorNumber })}</DonorHeading>
                  <RemoveButton
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t('step2.removeDonorAria', { number: donorNumber })}
                  >
                    {t('step2.removeDonor')}
                  </RemoveButton>
                </DonorHeader>
                <ContributorFields
                  index={index}
                  control={control}
                  register={register}
                  errors={errors}
                  trigger={trigger}
                  isSubmitted={isSubmitted}
                />
              </Section>
            </Fragment>
          );
        })}

        <Button type="button" variant="secondary" onClick={() => append({ ...initialContributor })} disabled={!canAddDonor}>
          {t('step2.addDonor')}
        </Button>

        <StepActions onBack={onBack} nextLabel={tCommon('actions.continue')} />
      </Fields>
    </form>
  );
}

export function Step2() {
  const { t } = useTranslation('donation');
  const router = useRouter();
  const hasMounted = useHasMounted();
  const completedStep = useDonationStore((state) => state.completedStep);
  const contributors = useDonationStore((state) => state.contributors);
  const setPersonal = useDonationStore((state) => state.setPersonal);

  // `completedStep` only reflects the real (possibly rehydrated) draft once
  // `hasMounted` is true — see `useHasMounted`'s doc comment. Checking the
  // guard before that would risk redirecting away from a legitimately
  // mid-wizard session just because the pristine SSR/first-render snapshot
  // still reads `completedStep: 0`.
  useEffect(() => {
    if (hasMounted && completedStep === 0) {
      router.replace('/');
    }
  }, [hasMounted, completedStep, router]);

  const canRenderForm = hasMounted && completedStep > 0;

  return (
    <WizardLayout image="/images/dog-steps.jpg">
      <Stepper current={2} />
      <StepHeading>{t('step2.heading')}</StepHeading>
      {canRenderForm ? (
        <Step2Form
          defaultValues={{ contributors }}
          onSaved={(values) => {
            setPersonal(values.contributors);
            router.push('/potvrdenie');
          }}
          onBack={() => {
            // Unsubmitted edits are intentionally not saved — "Späť" just
            // navigates back; the store-backed `defaultValues` above mean
            // whatever WAS saved (from a previous successful submit) is
            // still there next time this step mounts.
            router.push('/');
          }}
        />
      ) : null}
    </WizardLayout>
  );
}
