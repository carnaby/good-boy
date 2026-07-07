import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { ZodError } from 'zod';
import { Providers } from '@/lib/providers';
import { ApiError, apiFetch } from './client';
import { contributeResponseSchema, resultsResponseSchema, sheltersResponseSchema } from './schemas';
import { useShelters } from './queries';
import {
  contributeServerError,
  contributeValidationError,
  defaultContributeMessages,
  defaultResults,
  defaultShelters,
  networkError,
  server,
} from './testing/handlers';

describe('apiFetch', () => {
  it('parses a successful shelters response', async () => {
    const data = await apiFetch('/api/v1/shelters/', sheltersResponseSchema);

    expect(data).toEqual({ shelters: defaultShelters });
  });

  it('parses a successful results response with a nullable contribution', async () => {
    server.use(http.get('*/api/v1/shelters/results', () => HttpResponse.json({ contributors: 0, contribution: null })));

    const data = await apiFetch('/api/v1/shelters/results', resultsResponseSchema);

    expect(data).toEqual({ contributors: 0, contribution: null });
  });

  it('parses a successful results response with a numeric contribution', async () => {
    const data = await apiFetch('/api/v1/shelters/results', resultsResponseSchema);

    expect(data).toEqual(defaultResults);
  });

  it('parses a successful contribute response', async () => {
    const data = await apiFetch('/api/v1/shelters/contribute', contributeResponseSchema, {
      method: 'POST',
      body: JSON.stringify({ contributors: [], value: 100 }),
    });

    expect(data).toEqual({ messages: defaultContributeMessages });
  });

  it('throws a validation ApiError with populated messages on a 400 response', async () => {
    server.use(contributeValidationError(['body.contributors.0.firstName']));

    const error: unknown = await apiFetch('/api/v1/shelters/contribute', contributeResponseSchema, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.kind).toBe('validation');
    expect(apiError.status).toBe(400);
    expect(apiError.messages).toEqual([
      {
        type: 'ERROR',
        message: 'joi.body.contributors.0.firstName',
        path: 'body.contributors.0.firstName',
      },
    ]);
  });

  it('throws a server ApiError (with no messages) when the 500 body is not JSON', async () => {
    server.use(contributeServerError());

    const error: unknown = await apiFetch('/api/v1/shelters/contribute', contributeResponseSchema, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.kind).toBe('server');
    expect(apiError.status).toBe(500);
    expect(apiError.messages).toEqual([]);
  });

  it('throws a network ApiError with status 0 when the request never reaches the server', async () => {
    server.use(networkError('*/api/v1/shelters/results'));

    const error: unknown = await apiFetch('/api/v1/shelters/results', resultsResponseSchema).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.kind).toBe('network');
    expect(apiError.status).toBe(0);
    expect(apiError.messages).toEqual([]);
  });

  it('throws the schema ZodError (not an ApiError) when a 200 response has an invalid shape', async () => {
    server.use(http.get('*/api/v1/shelters/', () => HttpResponse.json({ shelters: 'not-an-array' })));

    await expect(apiFetch('/api/v1/shelters/', sheltersResponseSchema)).rejects.toBeInstanceOf(ZodError);
  });
});

describe('useShelters (smoke)', () => {
  it('fetches and exposes the shelters list through TanStack Query', async () => {
    const { result } = renderHook(() => useShelters(), { wrapper: Providers });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(defaultShelters);
  });
});
