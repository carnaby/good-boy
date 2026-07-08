import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type HelpType = 'shelter' | 'foundation';
export type PhonePrefix = '+421' | '+420';

/** Max number of donors a single donation can list (also the array bound in `stepPersonalSchema`). */
export const MAX_CONTRIBUTORS = 10;

export interface ContributorDraft {
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: PhonePrefix;
  phoneNumber: string;
}

export const initialContributor: ContributorDraft = {
  firstName: '',
  lastName: '',
  email: '',
  phonePrefix: '+421',
  phoneNumber: '',
};

export interface DonationDraft {
  helpType: HelpType;
  shelterId: number | null;
  amount: number | null;
  contributors: ContributorDraft[];
  consent: boolean;
}

interface DonationStore extends DonationDraft {
  completedStep: 0 | 1 | 2; // highest step whose data is saved
  setHelp(d: { helpType: HelpType; shelterId: number | null; amount: number }): void; // sets completedStep >= 1
  setPersonal(contributors: ContributorDraft[]): void; // completedStep >= 2
  setConsent(v: boolean): void;
  reset(): void; // back to initialState
}

export const initialDraft: DonationDraft = {
  helpType: 'shelter',
  shelterId: null,
  amount: null,
  contributors: [initialContributor],
  consent: false,
};

/** The full shape persisted to `sessionStorage` (draft + `completedStep`, no store methods). */
type PersistedDraft = DonationDraft & { completedStep: 0 | 1 | 2 };

/**
 * Pre-v1 persisted shape: the five personal fields lived flat on the draft
 * instead of inside `contributors[0]`. Every key is optional here since this
 * is what `JSON.parse` of an untrusted (older) `sessionStorage` entry hands
 * back — `migrate` below fills in the current `initialContributor` defaults
 * for anything missing rather than trusting the cast blindly.
 */
interface LegacyPersistedDraftV0 {
  helpType?: HelpType;
  shelterId?: number | null;
  amount?: number | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  phonePrefix?: PhonePrefix;
  phoneNumber?: string;
  consent?: boolean;
  completedStep?: 0 | 1 | 2;
}

export const useDonationStore = create<DonationStore>()(
  persist(
    (set) => ({
      ...initialDraft,
      completedStep: 0,
      setHelp: ({ helpType, shelterId, amount }) =>
        set((state) => ({
          helpType,
          shelterId,
          amount,
          completedStep: Math.max(state.completedStep, 1) as 0 | 1 | 2,
        })),
      setPersonal: (contributors) =>
        set((state) => ({
          contributors,
          completedStep: Math.max(state.completedStep, 2) as 0 | 1 | 2,
        })),
      setConsent: (consent) => set({ consent }),
      reset: () => set({ ...initialDraft, completedStep: 0 }),
    }),
    {
      name: 'goodboy-donation',
      storage: createJSONStorage<PersistedDraft>(() => sessionStorage),
      version: 1,
      // Bumping `version` to 1 for the `contributors` array refactor — a
      // mid-session draft saved under the old (v0) flat-fields shape must
      // still rehydrate correctly, so this lifts `firstName`/`lastName`/
      // `email`/`phonePrefix`/`phoneNumber` into `contributors[0]` instead of
      // discarding the session. Any other (currently impossible, since 1 was
      // the first bump) mismatched version falls through unchanged.
      migrate: (persistedState, version): PersistedDraft => {
        if (version === 0) {
          const legacy = persistedState as LegacyPersistedDraftV0;
          return {
            helpType: legacy.helpType ?? initialDraft.helpType,
            shelterId: legacy.shelterId ?? initialDraft.shelterId,
            amount: legacy.amount ?? initialDraft.amount,
            contributors: [
              {
                firstName: legacy.firstName ?? initialContributor.firstName,
                lastName: legacy.lastName ?? initialContributor.lastName,
                email: legacy.email ?? initialContributor.email,
                phonePrefix: legacy.phonePrefix ?? initialContributor.phonePrefix,
                phoneNumber: legacy.phoneNumber ?? initialContributor.phoneNumber,
              },
            ],
            consent: legacy.consent ?? initialDraft.consent,
            completedStep: legacy.completedStep ?? 0,
          };
        }
        return persistedState as PersistedDraft;
      },
    }
  )
);
