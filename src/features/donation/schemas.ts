import { z } from 'zod';
import type { HelpType, PhonePrefix } from './store';
import { PHONE_PREFIXES, normalizePhone } from './phone';

/**
 * Zod schemas for the multi-step donation form. Error `message`s are i18n
 * KEYS (not display text) — components resolve them via
 * `t(error.message, { ns: 'donation' })` at render time. See
 * `src/locales/sk/donation.json` for the resolved Slovak strings.
 *
 * Step 1 (help + amount), step 2 (personal details) and the final consent
 * checkbox all live here.
 */

// Reuses `HelpType` from the store (rather than redeclaring the literals) so
// the two stay in sync — `satisfies` fails to compile if they ever diverge.
const helpTypeValues = ['shelter', 'foundation'] as const satisfies readonly HelpType[];

export const stepHelpSchema = z
  .object({
    helpType: z.enum(helpTypeValues),
    shelterId: z.number().int().positive().nullable(),
    amount: z
      .number({ error: 'validation.amountRequired' })
      .positive('validation.amountPositive')
      .max(10000, 'validation.amountMax')
      .multipleOf(0.01, 'validation.amountInvalid'),
  })
  .superRefine((val, ctx) => {
    if (val.helpType === 'shelter' && val.shelterId === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['shelterId'], message: 'validation.shelterRequired' });
    }
  });

export type StepHelpValues = z.infer<typeof stepHelpSchema>;

// Same `satisfies` device as `helpTypeValues` above, keeping the enum in
// sync with the store's `PhonePrefix` union.
const phonePrefixValues = ['+421', '+420'] as const satisfies readonly PhonePrefix[];

// Digits-only national number, no leading zero. The overall length (per
// prefix) is enforced separately below since it needs `PHONE_PREFIXES`.
const phoneShapeRegex = /^[1-9]\d{8}$/;

/**
 * Trims a string field and reports at most one issue: an "empty" message if
 * nothing (or only whitespace) was entered, otherwise a "length" message if
 * outside `[min, max]`. Keeping this as two mutually-exclusive checks (via
 * `superRefine`, not chained `.min()`s) avoids ever reporting both messages
 * for the same empty input.
 */
function requiredTrimmedString(bounds: { min: number; max: number; requiredKey: string; lengthKey: string }) {
  return z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (val.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: bounds.requiredKey });
        return;
      }
      if (val.length < bounds.min || val.length > bounds.max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: bounds.lengthKey });
      }
    });
}

export const stepPersonalSchema = z
  .object({
    firstName: requiredTrimmedString({
      min: 2,
      max: 20,
      requiredKey: 'validation.firstNameRequired',
      lengthKey: 'validation.firstNameLength',
    }),
    lastName: requiredTrimmedString({
      min: 2,
      max: 30,
      requiredKey: 'validation.lastNameRequired',
      lengthKey: 'validation.lastNameLength',
    }),
    email: z
      .string()
      .trim()
      .superRefine((val, ctx) => {
        if (val.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.emailRequired' });
          return;
        }
        if (!z.email().safeParse(val).success) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.emailInvalid' });
        }
      }),
    phonePrefix: z.enum(phonePrefixValues),
    // Normalizes (strips whitespace) first so the schema's output already
    // has a dial-ready national number; shape (digit count + no leading
    // zero) is checked here, the per-prefix length in the object-level
    // `superRefine` below (it needs the sibling `phonePrefix`).
    phoneNumber: z
      .string()
      .transform((val) => normalizePhone(val))
      .superRefine((val, ctx) => {
        if (val.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.phoneRequired' });
          return;
        }
        if (!phoneShapeRegex.test(val)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.phoneInvalid' });
        }
      }),
  })
  .superRefine((val, ctx) => {
    const shapeValid = val.phoneNumber.length > 0 && phoneShapeRegex.test(val.phoneNumber);
    if (shapeValid && val.phoneNumber.length !== PHONE_PREFIXES[val.phonePrefix].nationalLength) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phoneNumber'], message: 'validation.phoneInvalid' });
    }
  });

export type StepPersonalValues = z.infer<typeof stepPersonalSchema>;

export const stepConsentSchema = z.object({
  consent: z.literal(true, 'validation.consentRequired'),
});

export type StepConsentValues = z.infer<typeof stepConsentSchema>;
