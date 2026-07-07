import type { DonationDraft } from './store';
import type { ContributeRequest } from '@/features/api/schemas';
import { normalizePhone } from './phone';

/**
 * Maps a completed donation draft to the shape the `/contribute` API
 * expects. Only ever called after the step 1/2/consent schemas have all
 * passed, so the only thing left to guard against here is `amount` still
 * being `null` (it's `number | null` in the draft to represent "not filled
 * in yet").
 *
 * `shelterID` is sent whenever a shelter was chosen, regardless of
 * `helpType` — a foundation donation can still name a shelter (see Figma's
 * step 3 summary, which shows the foundation help type together with a
 * shelter row).
 */
export function toContributeRequest(draft: DonationDraft): ContributeRequest {
  if (draft.amount === null) {
    throw new Error('donation draft is incomplete');
  }

  return {
    contributors: [
      {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: `${draft.phonePrefix}${normalizePhone(draft.phoneNumber)}`,
      },
    ],
    shelterID: draft.shelterId,
    value: draft.amount,
  };
}
