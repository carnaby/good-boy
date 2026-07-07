import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type HelpType = 'shelter' | 'foundation';
export type PhonePrefix = '+421' | '+420';

export interface DonationDraft {
  helpType: HelpType;
  shelterId: number | null;
  amount: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: PhonePrefix;
  phoneNumber: string;
  consent: boolean;
}

interface DonationStore extends DonationDraft {
  completedStep: 0 | 1 | 2; // highest step whose data is saved
  setHelp(d: { helpType: HelpType; shelterId: number | null; amount: number }): void; // sets completedStep >= 1
  setPersonal(d: {
    firstName: string;
    lastName: string;
    email: string;
    phonePrefix: PhonePrefix;
    phoneNumber: string;
  }): void; // completedStep >= 2
  setConsent(v: boolean): void;
  reset(): void; // back to initialState
}

export const initialDraft: DonationDraft = {
  helpType: 'shelter',
  shelterId: null,
  amount: null,
  firstName: '',
  lastName: '',
  email: '',
  phonePrefix: '+421',
  phoneNumber: '',
  consent: false,
};

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
      setPersonal: ({ firstName, lastName, email, phonePrefix, phoneNumber }) =>
        set((state) => ({
          firstName,
          lastName,
          email,
          phonePrefix,
          phoneNumber,
          completedStep: Math.max(state.completedStep, 2) as 0 | 1 | 2,
        })),
      setConsent: (consent) => set({ consent }),
      reset: () => set({ ...initialDraft, completedStep: 0 }),
    }),
    {
      name: 'goodboy-donation',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
