import { z } from 'zod';
import { apiMessageSchema, type ApiMessage } from './schemas';

const DEFAULT_API_BASE = 'https://frontend-assignment-api.goodrequest.dev';

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_API_BASE;
}

export type ApiErrorKind = 'network' | 'validation' | 'server';

const errorBodySchema = z.object({ messages: z.array(apiMessageSchema) });

/**
 * Thrown by `apiFetch` for any non-2xx response, or when the request never
 * reached the server at all (`kind: 'network'`, `status: 0`). `kind` lets
 * callers branch without re-deriving it from `status`; `messages` carries
 * the API's message list (untranslated, joi-keyed on validation errors) when
 * the response body provided one, and `[]` otherwise.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly messages: ApiMessage[];

  constructor(kind: ApiErrorKind, status: number, messages: ApiMessage[]) {
    super(messages[0]?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.messages = messages;
  }
}

/** Best-effort parse of an error response body; never throws — falls back to `[]`. */
async function readErrorMessages(res: Response): Promise<ApiMessage[]> {
  try {
    const body: unknown = await res.json();
    const parsed = errorBodySchema.safeParse(body);
    return parsed.success ? parsed.data.messages : [];
  } catch {
    return [];
  }
}

/**
 * Fetches `path` against the configured API base and parses the JSON body
 * with `schema`.
 *
 * - A request that never reaches the server (offline, DNS, CORS, …) throws
 *   `ApiError('network', 0, [])`.
 * - A non-2xx response throws `ApiError('validation' | 'server', status, messages)`,
 *   `messages` best-effort parsed from the body (`[]` if absent/unparseable).
 * - A 2xx response whose body doesn't match `schema` throws `schema`'s own
 *   `ZodError` — that's a contract bug, not a request-level failure, so it
 *   is intentionally not wrapped as an `ApiError`.
 */
export async function apiFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('network', 0, []);
  }

  if (!res.ok) {
    const messages = await readErrorMessages(res);
    const kind: ApiErrorKind = res.status >= 500 ? 'server' : 'validation';
    throw new ApiError(kind, res.status, messages);
  }

  const body: unknown = await res.json();
  return schema.parse(body);
}
