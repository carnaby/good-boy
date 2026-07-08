import { beforeEach, describe, expect, it } from 'vitest';
import { initialContributor, initialDraft, useDonationStore } from './store';

beforeEach(() => {
  sessionStorage.clear();
  useDonationStore.setState({ ...initialDraft, completedStep: 0 });
});

describe('useDonationStore', () => {
  it('starts with the initial draft and completedStep 0', () => {
    const state = useDonationStore.getState();

    expect(state.helpType).toBe('shelter');
    expect(state.shelterId).toBeNull();
    expect(state.amount).toBeNull();
    expect(state.contributors).toEqual([initialContributor]);
    expect(state.consent).toBe(false);
    expect(state.completedStep).toBe(0);
  });

  it('setHelp sets the help fields and bumps completedStep to 1', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 3, amount: 25 });

    const state = useDonationStore.getState();
    expect(state.helpType).toBe('shelter');
    expect(state.shelterId).toBe(3);
    expect(state.amount).toBe(25);
    expect(state.completedStep).toBe(1);
  });

  it('switching helpType to foundation keeps the previously selected shelterId', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 7, amount: 10 });
    useDonationStore.getState().setHelp({ helpType: 'foundation', shelterId: 7, amount: 15 });

    const state = useDonationStore.getState();
    expect(state.helpType).toBe('foundation');
    expect(state.shelterId).toBe(7);
    expect(state.amount).toBe(15);
  });

  it('setPersonal sets the contributors array and bumps completedStep to 2', () => {
    useDonationStore.getState().setPersonal([
      {
        firstName: 'Jana',
        lastName: 'Nováková',
        email: 'jana@example.com',
        phonePrefix: '+420',
        phoneNumber: '777123456',
      },
    ]);

    const state = useDonationStore.getState();
    expect(state.contributors).toEqual([
      {
        firstName: 'Jana',
        lastName: 'Nováková',
        email: 'jana@example.com',
        phonePrefix: '+420',
        phoneNumber: '777123456',
      },
    ]);
    expect(state.completedStep).toBe(2);
  });

  it('setPersonal accepts multiple contributors, preserving order', () => {
    useDonationStore.getState().setPersonal([
      { firstName: 'A', lastName: 'One', email: 'a@one.com', phonePrefix: '+421', phoneNumber: '900000001' },
      { firstName: 'B', lastName: 'Two', email: 'b@two.com', phonePrefix: '+420', phoneNumber: '900000002' },
    ]);

    const state = useDonationStore.getState();
    expect(state.contributors).toHaveLength(2);
    expect(state.contributors[0]?.firstName).toBe('A');
    expect(state.contributors[1]?.firstName).toBe('B');
    expect(state.completedStep).toBe(2);
  });

  it('completedStep never decreases: calling setHelp after setPersonal keeps it at 2', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 1, amount: 5 });
    useDonationStore.getState().setPersonal([
      { firstName: 'A', lastName: 'B', email: 'a@b.com', phonePrefix: '+421', phoneNumber: '900123456' },
    ]);
    expect(useDonationStore.getState().completedStep).toBe(2);

    useDonationStore.getState().setHelp({ helpType: 'foundation', shelterId: null, amount: 20 });

    expect(useDonationStore.getState().completedStep).toBe(2);
  });

  it('setConsent updates consent without changing completedStep', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 2, amount: 10 });
    expect(useDonationStore.getState().completedStep).toBe(1);

    useDonationStore.getState().setConsent(true);

    expect(useDonationStore.getState().consent).toBe(true);
    expect(useDonationStore.getState().completedStep).toBe(1);
  });

  it('reset restores the initial draft and completedStep 0', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 4, amount: 30 });
    useDonationStore.getState().setPersonal([
      { firstName: 'X', lastName: 'Y', email: 'x@y.com', phonePrefix: '+421', phoneNumber: '900000000' },
      { firstName: 'X2', lastName: 'Y2', email: 'x2@y.com', phonePrefix: '+421', phoneNumber: '900000001' },
    ]);
    useDonationStore.getState().setConsent(true);

    useDonationStore.getState().reset();

    expect(useDonationStore.getState()).toMatchObject({ ...initialDraft, completedStep: 0 });
  });

  it('persists the draft to sessionStorage under the goodboy-donation key', () => {
    useDonationStore.getState().setHelp({ helpType: 'shelter', shelterId: 9, amount: 50 });

    const raw = sessionStorage.getItem('goodboy-donation');
    expect(raw).not.toBeNull();

    const persisted = JSON.parse(raw!);
    expect(persisted.state.helpType).toBe('shelter');
    expect(persisted.state.shelterId).toBe(9);
    expect(persisted.state.amount).toBe(50);
    expect(persisted.state.completedStep).toBe(1);
    expect(persisted.version).toBe(1);
  });

  describe('v0 -> v1 migration', () => {
    it('lifts a v0 (flat personal fields) sessionStorage draft into contributors[0] on rehydrate', async () => {
      const legacyPersisted = {
        state: {
          helpType: 'shelter',
          shelterId: 2,
          amount: 40,
          firstName: 'Old',
          lastName: 'Shape',
          email: 'old@shape.sk',
          phonePrefix: '+420',
          phoneNumber: '777123456',
          consent: false,
          completedStep: 2,
        },
        version: 0,
      };
      sessionStorage.setItem('goodboy-donation', JSON.stringify(legacyPersisted));

      await useDonationStore.persist.rehydrate();

      const state = useDonationStore.getState();
      expect(state.contributors).toEqual([
        {
          firstName: 'Old',
          lastName: 'Shape',
          email: 'old@shape.sk',
          phonePrefix: '+420',
          phoneNumber: '777123456',
        },
      ]);
      expect(state.helpType).toBe('shelter');
      expect(state.shelterId).toBe(2);
      expect(state.amount).toBe(40);
      expect(state.consent).toBe(false);
      expect(state.completedStep).toBe(2);
    });

    it('fills in defaults for any missing legacy fields rather than crashing', async () => {
      sessionStorage.setItem(
        'goodboy-donation',
        JSON.stringify({ state: { completedStep: 0 }, version: 0 })
      );

      await useDonationStore.persist.rehydrate();

      expect(useDonationStore.getState().contributors).toEqual([initialContributor]);
    });
  });
});
