'use client';

import { useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { FormField, fieldA11yProps } from '@/components/ui/FormField';
import { TextInput } from '@/components/ui/TextInput';
import { useHasMounted } from '@/lib/use-has-mounted';
import { Stepper } from '../components/Stepper';
import { StepHeading } from '../components/StepHeading';
import { StepActions } from '../components/StepActions';
import { PhoneField } from '../components/PhoneField';
import { stepPersonalSchema, type StepPersonalValues } from '../schemas';
import { useDonationStore } from '../store';

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
    formState: { errors, isSubmitted },
  } = useForm<StepPersonalValues>({
    resolver: zodResolver(stepPersonalSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const { field: prefixField } = useController({ name: 'phonePrefix', control });
  const { field: numberField } = useController({ name: 'phoneNumber', control });

  const firstNameError = errors.firstName?.message ? t(errors.firstName.message) : undefined;
  const lastNameError = errors.lastName?.message ? t(errors.lastName.message) : undefined;
  const emailError = errors.email?.message ? t(errors.email.message) : undefined;
  const phoneError = errors.phoneNumber?.message ? t(errors.phoneNumber.message) : undefined;

  return (
    <form onSubmit={handleSubmit(onSaved)} noValidate>
      <Fields>
        <Section>
          <SectionTitle>{t('step2.aboutTitle')}</SectionTitle>

          <NameGrid>
            <FormField id="firstName" label={t('step2.firstNameLabel')} error={firstNameError}>
              <TextInput
                {...register('firstName')}
                {...fieldA11yProps('firstName', firstNameError)}
                error={Boolean(firstNameError)}
                placeholder={t('step2.firstNamePlaceholder')}
                autoComplete="given-name"
              />
            </FormField>
            <FormField id="lastName" label={t('step2.lastNameLabel')} error={lastNameError}>
              <TextInput
                {...register('lastName')}
                {...fieldA11yProps('lastName', lastNameError)}
                error={Boolean(lastNameError)}
                placeholder={t('step2.lastNamePlaceholder')}
                autoComplete="family-name"
              />
            </FormField>
          </NameGrid>

          <FormField id="email" label={t('step2.emailLabel')} error={emailError}>
            <TextInput
              {...register('email')}
              {...fieldA11yProps('email', emailError)}
              error={Boolean(emailError)}
              type="email"
              placeholder={t('step2.emailPlaceholder')}
              autoComplete="email"
            />
          </FormField>

          <PhoneField
            id="phoneNumber"
            prefix={prefixField.value}
            onPrefixChange={(next) => {
              prefixField.onChange(next);
              // Revalidate `phoneNumber` on prefix change so switching
              // country immediately re-checks the per-prefix national
              // length against the (possibly already-shown) error — but
              // only once the form's been submitted at least once, same
              // "don't surface premature errors" rule `Step1` uses for
              // `helpType`/`shelterId`.
              if (isSubmitted) void trigger('phoneNumber');
            }}
            number={numberField.value}
            onNumberChange={numberField.onChange}
            error={phoneError}
          />
        </Section>

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
  const firstName = useDonationStore((state) => state.firstName);
  const lastName = useDonationStore((state) => state.lastName);
  const email = useDonationStore((state) => state.email);
  const phonePrefix = useDonationStore((state) => state.phonePrefix);
  const phoneNumber = useDonationStore((state) => state.phoneNumber);
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
          defaultValues={{ firstName, lastName, email, phonePrefix, phoneNumber }}
          onSaved={(values) => {
            setPersonal(values);
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
