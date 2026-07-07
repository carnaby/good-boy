import { z } from 'zod';
import type { HelpType } from './store';

/**
 * Zod schemas for the multi-step donation form. Error `message`s are i18n
 * KEYS (not display text) — components resolve them via
 * `t(error.message, { ns: 'donation' })` at render time. See
 * `src/locales/sk/donation.json` for the resolved Slovak strings.
 *
 * Step 1 (help + amount) lives here now; Task 7 extends this file with the
 * step-2 (personal details) schema.
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
