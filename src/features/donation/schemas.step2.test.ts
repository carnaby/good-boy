import { describe, expect, it } from 'vitest';
import { stepConsentSchema, stepPersonalSchema } from './schemas';

// A fully valid single donor. Individual tests override just the field(s)
// under test so every case still exercises the whole object schema (needed
// since phone validation depends on the sibling `phonePrefix`).
const validContributor = {
  firstName: 'Ján',
  lastName: 'Novák',
  email: 'a@b.sk',
  phonePrefix: '+421' as const,
  phoneNumber: '902237207',
};

function parseContributors(contributors: unknown[]) {
  return stepPersonalSchema.safeParse({ contributors });
}

function findIssue(result: ReturnType<typeof parseContributors>, path: (string | number)[]) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join('.') === path.join('.'));
}

describe('stepPersonalSchema', () => {
  describe('firstName', () => {
    it.each([
      { name: 'empty fails with firstNameRequired', value: '', valid: false, message: 'validation.firstNameRequired' },
      { name: 'single char fails with firstNameLength', value: 'A', valid: false, message: 'validation.firstNameLength' },
      {
        name: '21 chars fails with firstNameLength',
        value: 'A'.repeat(21),
        valid: false,
        message: 'validation.firstNameLength',
      },
      { name: 'padded short name is trimmed then passes', value: '  Jo  ', valid: true, trimmedTo: 'Jo' },
      { name: 'normal name passes', value: 'Ján', valid: true, trimmedTo: 'Ján' },
    ])('$name', ({ value, valid, message, trimmedTo }) => {
      const result = parseContributors([{ ...validContributor, firstName: value }]);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(findIssue(result, ['contributors', 0, 'firstName'])?.message).toBe(message);
      } else if (result.success) {
        expect(result.data.contributors[0]?.firstName).toBe(trimmedTo);
      }
    });
  });

  describe('lastName', () => {
    it.each([
      { name: 'empty fails with lastNameRequired', value: '', valid: false, message: 'validation.lastNameRequired' },
      { name: 'single char fails with lastNameLength', value: 'X', valid: false, message: 'validation.lastNameLength' },
      {
        name: '31 chars fails with lastNameLength',
        value: 'X'.repeat(31),
        valid: false,
        message: 'validation.lastNameLength',
      },
      { name: 'normal name passes', value: 'Novák', valid: true },
    ])('$name', ({ value, valid, message }) => {
      const result = parseContributors([{ ...validContributor, lastName: value }]);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(findIssue(result, ['contributors', 0, 'lastName'])?.message).toBe(message);
      }
    });
  });

  describe('email', () => {
    it.each([
      { name: 'empty fails with emailRequired', value: '', valid: false, message: 'validation.emailRequired' },
      {
        name: 'malformed fails with emailInvalid',
        value: 'not-an-email',
        valid: false,
        message: 'validation.emailInvalid',
      },
      { name: 'valid email passes', value: 'a@b.sk', valid: true },
    ])('$name', ({ value, valid, message }) => {
      const result = parseContributors([{ ...validContributor, email: value }]);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(findIssue(result, ['contributors', 0, 'email'])?.message).toBe(message);
      }
    });
  });

  describe('phone', () => {
    it.each([
      {
        name: 'spaced national number normalizes and passes (+421)',
        phonePrefix: '+421' as const,
        phoneNumber: '902 237 207',
        valid: true,
        normalizedTo: '902237207',
      },
      {
        name: 'same valid number passes with +420',
        phonePrefix: '+420' as const,
        phoneNumber: '902 237 207',
        valid: true,
        normalizedTo: '902237207',
      },
      {
        name: 'leading zero (10 digits) fails with phoneInvalid',
        phonePrefix: '+421' as const,
        phoneNumber: '0902237207',
        valid: false,
        message: 'validation.phoneInvalid',
      },
      {
        name: 'too short (8 digits) fails with phoneInvalid',
        phonePrefix: '+421' as const,
        phoneNumber: '90223720',
        valid: false,
        message: 'validation.phoneInvalid',
      },
      {
        name: 'too long (10 digits) fails with phoneInvalid',
        phonePrefix: '+421' as const,
        phoneNumber: '9022372071',
        valid: false,
        message: 'validation.phoneInvalid',
      },
      {
        name: 'non-numeric fails with phoneInvalid',
        phonePrefix: '+421' as const,
        phoneNumber: 'abcdefghi',
        valid: false,
        message: 'validation.phoneInvalid',
      },
      {
        name: 'empty fails with phoneRequired',
        phonePrefix: '+421' as const,
        phoneNumber: '',
        valid: false,
        message: 'validation.phoneRequired',
      },
    ])('$name', ({ phonePrefix, phoneNumber, valid, message, normalizedTo }) => {
      const result = parseContributors([{ ...validContributor, phonePrefix, phoneNumber }]);

      expect(result.success).toBe(valid);
      if (!valid) {
        expect(findIssue(result, ['contributors', 0, 'phoneNumber'])?.message).toBe(message);
      } else if (result.success) {
        expect(result.data.contributors[0]?.phoneNumber).toBe(normalizedTo);
      }
    });
  });

  describe('contributors array', () => {
    it('fails when the array is empty', () => {
      const result = parseContributors([]);

      expect(result.success).toBe(false);
    });

    it('passes with 2 valid donors', () => {
      const result = parseContributors([validContributor, { ...validContributor, firstName: 'Jana' }]);

      expect(result.success).toBe(true);
    });

    it('fails at contributors.1.email when the second donor has an invalid email', () => {
      const result = parseContributors([validContributor, { ...validContributor, email: 'not-an-email' }]);

      expect(result.success).toBe(false);
      const issue = findIssue(result, ['contributors', 1, 'email']);
      expect(issue?.message).toBe('validation.emailInvalid');
      // The first (valid) donor must not have produced any issue of its own.
      expect(findIssue(result, ['contributors', 0, 'email'])).toBeUndefined();
    });

    it('fails when there are more than 10 donors', () => {
      const result = parseContributors(Array.from({ length: 11 }, () => ({ ...validContributor })));

      expect(result.success).toBe(false);
    });

    it('passes with exactly 10 donors', () => {
      const result = parseContributors(Array.from({ length: 10 }, () => ({ ...validContributor })));

      expect(result.success).toBe(true);
    });
  });
});

describe('stepConsentSchema', () => {
  it.each([
    { name: 'false fails with consentRequired', value: false, valid: false },
    { name: 'true passes', value: true, valid: true },
  ])('$name', ({ value, valid }) => {
    const result = stepConsentSchema.safeParse({ consent: value });

    expect(result.success).toBe(valid);
    if (!valid) {
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.join('.') === 'consent');
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('validation.consentRequired');
      }
    }
  });
});
