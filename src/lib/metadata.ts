/**
 * Shared between the root layout's default `openGraph` and every route's own
 * `openGraph` override (`src/app/**\/page.tsx`). Next.js resolves a segment's
 * `openGraph` metadata as a whole rather than merging it field-by-field with
 * the parent's — a route that sets its own `openGraph.title`/`description`
 * to get a per-page preview title loses the parent's `images` in the same
 * step, unless it repeats it. Referencing this constant from both places
 * keeps every route's preview image identical and in one place to update.
 */
export const DEFAULT_OG_IMAGE = '/og-image.jpg';
