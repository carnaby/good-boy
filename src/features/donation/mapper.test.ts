import { describe, expect, it } from 'vitest';
import type { DonationDraft } from './store';
import { toContributeRequest } from './mapper';

const baseDraft: DonationDraft = {
  helpType: 'shelter',
  shelterId: 3,
  amount: 50,
  firstName: '  Ján  ',
  lastName: '  Novák  ',
  email: '  a@b.sk  ',
  phonePrefix: '+421',
  phoneNumber: '902 237 207',
  consent: true,
};

describe('toContributeRequest', () => {
  it('maps a full shelter draft to the API request shape', () => {
    expect(toContributeRequest(baseDraft)).toEqual({
      contributors: [
        {
          firstName: 'Ján',
          lastName: 'Novák',
          email: 'a@b.sk',
          phone: '+421902237207',
        },
      ],
      shelterID: 3,
      value: 50,
    });
  });

  it('keeps the shelterID when helpType is foundation and a shelter was chosen', () => {
    const draft: DonationDraft = { ...baseDraft, helpType: 'foundation', shelterId: 5 };

    expect(toContributeRequest(draft).shelterID).toBe(5);
  });

  it('sends shelterID null for a foundation donation with no shelter chosen', () => {
    const draft: DonationDraft = { ...baseDraft, helpType: 'foundation', shelterId: null };

    expect(toContributeRequest(draft).shelterID).toBeNull();
  });

  it('throws when amount is null (draft incomplete)', () => {
    const draft: DonationDraft = { ...baseDraft, amount: null };

    expect(() => toContributeRequest(draft)).toThrow('donation draft is incomplete');
  });

  it('trims first name, last name, and email in the mapped output', () => {
    const result = toContributeRequest(baseDraft);

    expect(result.contributors[0]?.firstName).toBe('Ján');
    expect(result.contributors[0]?.lastName).toBe('Novák');
    expect(result.contributors[0]?.email).toBe('a@b.sk');
  });

  it('builds the phone number from prefix + normalized national number', () => {
    const draft: DonationDraft = { ...baseDraft, phonePrefix: '+420', phoneNumber: '902 237 207' };

    expect(toContributeRequest(draft).contributors[0]?.phone).toBe('+420902237207');
  });
});
