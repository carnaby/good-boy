import { describe, expect, it } from 'vitest';
import { contributeResponseSchema, resultsResponseSchema, sheltersResponseSchema } from './schemas';

describe('sheltersResponseSchema', () => {
  it('parses a valid shelters list', () => {
    const input = {
      shelters: [
        { id: 1, name: 'Shelter A' },
        { id: 2, name: 'Shelter B' },
      ],
    };

    expect(sheltersResponseSchema.parse(input)).toEqual(input);
  });

  it('tolerates unknown extra properties on the envelope and on each shelter', () => {
    const input = {
      shelters: [{ id: 1, name: 'Shelter A', capacity: 40 }],
      requestId: 'abc-123',
    };

    expect(() => sheltersResponseSchema.parse(input)).not.toThrow();
  });

  it('rejects a shelter missing name', () => {
    expect(() => sheltersResponseSchema.parse({ shelters: [{ id: 1 }] })).toThrow();
  });

  it('rejects when shelters is not an array', () => {
    expect(() => sheltersResponseSchema.parse({ shelters: {} })).toThrow();
  });

  it('rejects when the envelope is missing entirely', () => {
    expect(() => sheltersResponseSchema.parse({})).toThrow();
  });
});

describe('resultsResponseSchema', () => {
  it('parses a numeric contribution', () => {
    const input = { contributors: 128, contribution: 45230.5 };

    expect(resultsResponseSchema.parse(input)).toEqual(input);
  });

  it('parses a null contribution (no contributions yet)', () => {
    const input = { contributors: 0, contribution: null };

    expect(resultsResponseSchema.parse(input)).toEqual(input);
  });

  it('rejects a missing contribution field', () => {
    expect(() => resultsResponseSchema.parse({ contributors: 1 })).toThrow();
  });

  it('rejects contribution as a string', () => {
    expect(() => resultsResponseSchema.parse({ contributors: 1, contribution: '10' })).toThrow();
  });

  it('rejects contributors as a string', () => {
    expect(() => resultsResponseSchema.parse({ contributors: '1', contribution: null })).toThrow();
  });
});

describe('contributeResponseSchema', () => {
  it('parses a success message list', () => {
    const input = { messages: [{ message: 'Thank you for your contribution!', type: 'SUCCESS' }] };

    expect(contributeResponseSchema.parse(input)).toEqual(input);
  });

  it('parses the verified 400 validation body, including path', () => {
    const input = {
      messages: [
        {
          type: 'ERROR',
          message: 'joi.body.contributors.0.firstName',
          path: 'body.contributors.0.firstName',
        },
      ],
    };

    expect(contributeResponseSchema.parse(input)).toEqual(input);
  });

  it('accepts a message without a path (path is optional)', () => {
    const input = { messages: [{ message: 'ok', type: 'INFO' }] };

    const parsed = contributeResponseSchema.parse(input);

    expect(parsed.messages[0]?.path).toBeUndefined();
  });

  it('accepts every documented message type', () => {
    const input = {
      messages: (['ERROR', 'WARNING', 'INFO', 'SUCCESS'] as const).map((type) => ({
        message: `msg-${type}`,
        type,
      })),
    };

    expect(() => contributeResponseSchema.parse(input)).not.toThrow();
  });

  it('rejects an invalid message type', () => {
    expect(() =>
      contributeResponseSchema.parse({ messages: [{ message: 'x', type: 'BOGUS' }] })
    ).toThrow();
  });

  it('rejects a message missing the message field', () => {
    expect(() => contributeResponseSchema.parse({ messages: [{ type: 'ERROR' }] })).toThrow();
  });
});
