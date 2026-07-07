import { describe, expect, it } from 'vitest';
import { stepHelpSchema } from './schemas';

describe('stepHelpSchema', () => {
  describe('shelterId / helpType conditional requirement', () => {
    it.each([
      {
        name: 'shelter + shelterId null fails at shelterId with shelterRequired',
        input: { helpType: 'shelter', shelterId: null, amount: 10 },
        valid: false,
        path: ['shelterId'],
        message: 'validation.shelterRequired',
      },
      {
        name: 'shelter + shelterId set passes',
        input: { helpType: 'shelter', shelterId: 3, amount: 10 },
        valid: true,
      },
      {
        name: 'foundation + shelterId null passes',
        input: { helpType: 'foundation', shelterId: null, amount: 10 },
        valid: true,
      },
      {
        name: 'foundation + shelterId 3 passes (optional, kept)',
        input: { helpType: 'foundation', shelterId: 3, amount: 10 },
        valid: true,
      },
    ])('$name', ({ input, valid, path, message }) => {
      const result = stepHelpSchema.safeParse(input);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(result.success).toBe(false);
        if (!result.success) {
          const issue = result.error.issues.find((i) => i.path.join('.') === path!.join('.'));
          expect(issue).toBeDefined();
          expect(issue?.message).toBe(message);
        }
      }
    });
  });

  describe('amount validation', () => {
    it.each([
      {
        name: 'amount null fails with amountRequired',
        input: { helpType: 'shelter', shelterId: 1, amount: null },
        valid: false,
        path: ['amount'],
        message: 'validation.amountRequired',
      },
      {
        // The form itself always supplies `amount` (its empty value is
        // `null`, never `undefined`), so a truly-missing key only happens
        // for malformed programmatic input — the base invalid-type message
        // is the right one there, and (unlike `null`) it short-circuits the
        // superRefine.
        name: 'amount missing (undefined) fails with amountInvalid',
        input: { helpType: 'shelter', shelterId: 1 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountInvalid',
      },
      {
        name: 'amount 0 fails with amountPositive',
        input: { helpType: 'shelter', shelterId: 1, amount: 0 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountPositive',
      },
      {
        name: 'amount -5 fails with amountPositive',
        input: { helpType: 'shelter', shelterId: 1, amount: -5 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountPositive',
      },
      {
        name: 'amount 10001 fails with amountMax',
        input: { helpType: 'shelter', shelterId: 1, amount: 10001 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountMax',
      },
      {
        name: 'amount 10000 passes',
        input: { helpType: 'shelter', shelterId: 1, amount: 10000 },
        valid: true,
      },
      {
        name: 'amount 7.5 passes',
        input: { helpType: 'shelter', shelterId: 1, amount: 7.5 },
        valid: true,
      },
      {
        name: 'amount 7.123 fails with amountInvalid (max 2 decimals)',
        input: { helpType: 'shelter', shelterId: 1, amount: 7.123 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountInvalid',
      },
    ])('$name', ({ input, valid, path, message }) => {
      const result = stepHelpSchema.safeParse(input);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(result.success).toBe(false);
        if (!result.success) {
          const issue = result.error.issues.find((i) => i.path.join('.') === path!.join('.'));
          expect(issue).toBeDefined();
          expect(issue?.message).toBe(message);
        }
      }
    });
  });

  describe('combined first-submit state', () => {
    it('reports BOTH shelterRequired and amountRequired when nothing is filled in', () => {
      // The whole point of `amount` being `.nullable()` with its required
      // check in the object-level superRefine: a first submit with nothing
      // filled must surface both errors at once, not just the amount one.
      const result = stepHelpSchema.safeParse({ helpType: 'shelter', shelterId: null, amount: null });

      expect(result.success).toBe(false);
      if (!result.success) {
        const byPath = new Map(result.error.issues.map((i) => [i.path.join('.'), i.message]));
        expect(byPath.get('shelterId')).toBe('validation.shelterRequired');
        expect(byPath.get('amount')).toBe('validation.amountRequired');
      }
    });
  });
});
