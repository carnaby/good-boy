import { z } from 'zod';

/**
 * Response schemas + request/response types for the shelters API, pinned to
 * the contract empirically verified against the live API (see
 * `.superpowers/sdd/task-4-brief.md`) rather than to any published spec.
 * `z.object` strips-but-tolerates unknown keys by default, so extra fields
 * the API adds later won't break parsing.
 */

const shelterSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const sheltersResponseSchema: z.ZodType<{
  shelters: { id: number; name: string }[];
}> = z.object({
  shelters: z.array(shelterSchema),
});

export const resultsResponseSchema: z.ZodType<{
  contributors: number;
  contribution: number | null;
}> = z.object({
  contributors: z.number(),
  contribution: z.number().nullable(),
});

const apiMessageTypeSchema = z.enum(['ERROR', 'WARNING', 'INFO', 'SUCCESS']);

export const apiMessageSchema = z.object({
  message: z.string(),
  type: apiMessageTypeSchema,
  // Present on joi validation errors (e.g. 400s), absent on plain info/success
  // messages.
  path: z.string().optional(),
});

export const contributeResponseSchema = z.object({
  messages: z.array(apiMessageSchema),
});

export type Shelter = z.infer<typeof shelterSchema>;
export type ApiMessageType = z.infer<typeof apiMessageTypeSchema>;
export type ApiMessage = z.infer<typeof apiMessageSchema>;
export type SheltersResponse = z.infer<typeof sheltersResponseSchema>;
export type ResultsResponse = z.infer<typeof resultsResponseSchema>;
export type ContributeResponse = z.infer<typeof contributeResponseSchema>;

export interface ContributeRequest {
  contributors: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  }[];
  shelterID?: number | null;
  value: number;
}
