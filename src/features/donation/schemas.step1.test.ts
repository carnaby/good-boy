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
        name: 'amount missing fails with amountRequired',
        input: { helpType: 'shelter', shelterId: 1 },
        valid: false,
        path: ['amount'],
        message: 'validation.amountRequired',
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
});
