'use client';

import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { FormField, fieldA11yProps } from '@/components/ui/FormField';
import { useHasMounted } from '@/lib/use-has-mounted';
import { Stepper } from '../components/Stepper';
import { StepHeading } from '../components/StepHeading';
import { StepActions } from '../components/StepActions';
import { SegmentedControl } from '../components/SegmentedControl';
import { ShelterSelect } from '../components/ShelterSelect';
import { AmountPicker } from '../components/AmountPicker';
import { stepHelpSchema, type StepHelpValues } from '../schemas';
import { useDonationStore, type HelpType } from '../store';

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

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;

interface Step1FormProps {
  helpType: HelpType;
  shelterId: number | null;
  amount: number | null;
  onSaved: (values: StepHelpValues) => void;
}

function Step1Form({ helpType, shelterId, amount, onSaved }: Step1FormProps) {
  const { t } = useTranslation('donation');
  const { t: tCommon } = useTranslation('common');
  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<StepHelpValues>({
    resolver: zodResolver(stepHelpSchema),
    mode: 'onTouched',
    defaultValues: { helpType, shelterId, amount },
  });
  const currentHelpType = useWatch({ control, name: 'helpType' });

  const shelterError = errors.shelterId?.message ? t(errors.shelterId.message) : undefined;
  const amountError = errors.amount?.message ? t(errors.amount.message) : undefined;

  return (
    <form onSubmit={handleSubmit(onSaved)} noValidate>
      <Fields>
        <Controller
          name="helpType"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              onChange={(next) => {
                field.onChange(next);
                // Revalidate `shelterId` on help-type change so switching to
                // "foundation" immediately clears an already-shown error —
                // but only once the form's been submitted at least once, so
                // switching around before a first submit never surfaces a
                // premature "required" error.
                if (isSubmitted) void trigger('shelterId');
              }}
            />
          )}
        />

        <Section>
          <SectionTitle>{t('step1.aboutTitle')}</SectionTitle>
          <FormField
            id="shelterId"
            label={t('step1.shelterLabel')}
            optionalHint={currentHelpType === 'foundation' ? t('step1.shelterOptional') : undefined}
            error={shelterError}
          >
            <Controller
              name="shelterId"
              control={control}
              render={({ field }) => (
                <ShelterSelect
                  id="shelterId"
                  value={field.value}
                  onChange={field.onChange}
                  error={Boolean(shelterError)}
                  a11y={fieldA11yProps('shelterId', shelterError)}
                />
              )}
            />
          </FormField>
        </Section>

        <Section>
          <SectionTitle>{t('step1.amountTitle')}</SectionTitle>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <AmountPicker
                value={field.value}
                onChange={field.onChange}
                error={Boolean(amountError)}
                describedBy={amountError ? 'amount-error' : undefined}
              />
            )}
          />
          <div aria-live="polite">{amountError ? <ErrorText id="amount-error">{amountError}</ErrorText> : null}</div>
        </Section>

        <StepActions onBack={() => {}} backDisabled nextLabel={tCommon('actions.continue')} />
      </Fields>
    </form>
  );
}

export function Step1() {
  const { t } = useTranslation('donation');
  const router = useRouter();
  const hasMounted = useHasMounted();
  const helpType = useDonationStore((state) => state.helpType);
  const shelterId = useDonationStore((state) => state.shelterId);
  const amount = useDonationStore((state) => state.amount);
  const setHelp = useDonationStore((state) => state.setHelp);

  return (
    <WizardLayout image="/images/dog-steps.jpg">
      <Stepper current={1} />
      <StepHeading>{t('step1.heading')}</StepHeading>
      {hasMounted ? (
        <Step1Form
          helpType={helpType}
          shelterId={shelterId}
          amount={amount}
          onSaved={(values) => {
            // The schema guarantees a non-null amount at runtime (its
            // superRefine rejects `null`); this guard exists purely so
            // TypeScript narrows `amount` to `number` for `setHelp`.
            if (values.amount === null) return;
            setHelp({ ...values, amount: values.amount });
            router.push('/osobne-udaje');
          }}
        />
      ) : null}
    </WizardLayout>
  );
}
