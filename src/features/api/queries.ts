'use client';

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { ApiError, apiFetch } from './client';
import {
  contributeResponseSchema,
  resultsResponseSchema,
  sheltersResponseSchema,
  type ContributeRequest,
  type ContributeResponse,
  type ResultsResponse,
  type Shelter,
} from './schemas';

/** Aggregate contribution totals shape, aliased for readability at the call site. */
type Results = ResultsResponse;

/**
 * Thin TanStack Query wrappers around `apiFetch`. No UI logic lives here —
 * components read `data` / `error` / mutation state and decide what to
 * render.
 */

/** Shelter picker options; rarely changes, so cached for 5 minutes. */
export function useShelters(): UseQueryResult<Shelter[]> {
  return useQuery({
    queryKey: ['shelters'],
    queryFn: async () => (await apiFetch('/api/v1/shelters/', sheltersResponseSchema)).shelters,
    staleTime: 5 * 60_000,
  });
}

/** Aggregate contribution totals; polled so the counter stays live. */
export function useResults(): UseQueryResult<Results> {
  return useQuery({
    queryKey: ['results'],
    queryFn: () => apiFetch('/api/v1/shelters/results', resultsResponseSchema),
    refetchInterval: 15_000,
  });
}

/** Submits a contribution; consumers read `messages` off the response for user-facing feedback. */
export function useContribute(): UseMutationResult<ContributeResponse, ApiError, ContributeRequest> {
  return useMutation({
    mutationFn: (body: ContributeRequest) =>
      apiFetch('/api/v1/shelters/contribute', contributeResponseSchema, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}
