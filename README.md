# Good Boy

Good Boy is a donation platform for a dog-shelter foundation based in Žilina. It runs a focused three-step
wizard (choose a shelter or the general fund and an amount → personal details → review and confirm), shows
the foundation's live collection metrics on its about page, and gives supporters a way to reach the
foundation directly. The UI is entirely in Slovak.

## Tech stack

| Choice | Why |
| --- | --- |
| **Next.js 16 (App Router) + React 19** | File-system routing gives each wizard step its own URL, its own metadata, and its own prerendered shell for free. |
| **TypeScript (strict)** | The donation flow moves data through a store, a mapper, and an API layer before it ever reaches the network — strict types keep that pipeline honest end to end. |
| **TanStack Query** | Owns everything that comes from the network: caching, retries, and polling (live metrics) without hand-rolled `useEffect` fetching. |
| **Zustand** | Owns the in-progress wizard draft — a small, un-networked piece of client state that doesn't belong in a query cache. |
| **Zod** | One schema per step is the single source of truth for validation, shared by the form layer and the parsed API responses. |
| **react-hook-form** | Uncontrolled-by-default form state with a `zodResolver`, so validation logic never has to be duplicated as component code. |
| **styled-components** | Co-locates styling with components while still supporting a token-based theme and full SSR (see [Architecture decisions](#architecture-decisions)). |
| **react-i18next** | Namespaced translation resources with a message-key convention for validation errors (see [i18n](#i18n)). |
| **Vitest + Testing Library + MSW** | Fast Vite-native test runner; MSW intercepts at the network boundary so components and hooks are tested through the same `fetch` calls they make in production. |
| **Docker (multi-stage) + Compose** | Reproducible production builds using Next's `standalone` output, independent of the host's Node install. |

## Getting started

**Prerequisites:** Node 20 or later (the Docker image and local development were both verified on Node 22).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production build, run locally:**

```bash
npm run build
npm start
```

**Docker:**

```bash
npm run docker:up    # docker compose up --build — builds the image and serves it on :3000
npm run docker:down   # docker compose down
```

The image is a 3-stage build (`deps` → `build` → `runner`) that copies only `next build`'s `standalone`
output and static assets into the final stage, so the shipped image doesn't carry the full
`node_modules` tree or source.

## Environment

Copy `.env.example` to `.env.local` and adjust if needed:

```
NEXT_PUBLIC_API_BASE=https://frontend-assignment-api.goodrequest.dev
```

`NEXT_PUBLIC_API_BASE` is the base URL the client uses for every API call (shelters, live results,
contribution submission). It's optional — if unset, the code falls back to the same production URL
shown above (see `DEFAULT_API_BASE` in `src/features/api/client.ts`), so the app works out of the box
with no `.env` file at all.

## Architecture decisions

### Server state vs. client state

TanStack Query and Zustand each own a different half of the app's state, split along one line: **did this
come from the network?**

- **TanStack Query** owns everything the API returns — shelter list, live contribution totals, and the
  submission mutation. It gets caching, retry, and (for the metrics on `/o-projekte`) a 15-second
  `refetchInterval` for free, with no manual polling code.
- **Zustand** owns the wizard's in-progress draft (`src/features/donation/store.ts`) — data the user is
  typing that hasn't been submitted yet. This is deliberately *not* query cache: it's not fetched, and it
  needs to survive across the three wizard routes.

The draft store is persisted to **`sessionStorage`**, not `localStorage`, on purpose: a donation draft is
scoped to "this visit" — a page refresh mid-flow should restore it, but it shouldn't quietly resurface
someone else's half-finished form on the same machine days later. The store also tracks a `completedStep`
high-water mark, which each step route reads to redirect a visitor back to step 1 if they jump ahead via
the URL bar with nothing filled in yet.

### Zod-first validation

Every step's schema (`src/features/donation/schemas.ts`) is the single source of truth for what "valid"
means, consumed by `react-hook-form` through `@hookform/resolvers/zod` — there's no parallel validation
logic in the components themselves. Two details matter beyond the basic shape checks:

- **Error `message`s are i18n keys, not display text.** A schema produces `message: 'validation.phoneInvalid'`,
  and components resolve it via `t(message, { ns: 'donation' })` at render time. This keeps the schemas
  language-agnostic and keeps every user-facing string in one place (the locale JSON).
- **Cross-field rules live in object-level `superRefine`, not chained field validators**, specifically so a
  first submit with nothing filled in surfaces *all* the relevant errors at once instead of stopping at the
  first one Zod's base parse would otherwise short-circuit on. This is how the conditional "shelter is
  required only when helping a specific shelter" rule and the per-prefix phone-length rule are implemented —
  the valid national-number length is looked up per selected prefix from a single data table
  (`src/features/donation/phone.ts`), so adding a country with a different length is a one-line data change,
  not a validation rewrite.
- The API requires a non-empty first name for each contributor, so the form marks the field as required
  (2–20 characters).

### styled-components with the App Router SSR registry

`src/lib/registry.tsx` implements Next's documented pattern for styled-components v6 under the App Router:
a `ServerStyleSheet` collects every style rule generated while a request is rendered on the server, and
`useServerInsertedHTML` flushes them into `<head>` before the corresponding markup streams to the client.
Without this, styled-components' styles would only exist in a client-side `<style>` tag injected after
hydration — a visible flash of unstyled content on every page load. The theme itself
(`src/styles/theme.ts`) is tokens-only (color, typography, radii, spacing, breakpoints) extracted from the
design system, so components never hardcode a value the design didn't define.

### API layer

`src/features/api/client.ts` wraps every request behind one function, `apiFetch<T>`, which:

- throws a typed `ApiError` with a `kind` of `'network'` (request never reached the server), `'validation'`
  (4xx), or `'server'` (5xx) — callers branch on `kind` instead of re-deriving it from a raw status code;
- parses every response body through its Zod schema before handing it back, so a contract change on the
  API's side fails loudly (a thrown `ZodError`) instead of quietly propagating `undefined`s through the UI.

The submission step (`Step3`) uses this taxonomy directly: network/server errors get a generic message and
a retry button that re-fires the exact failed request; validation errors instead map the API's field
paths back to the specific wizard step that needs correcting, with a link to jump straight there.

### Wizard routing

Each step is its own route (`/`, `/osobne-udaje`, `/potvrdenie`) rather than one page swapping components
client-side. This buys two things a single-page wizard would have to build by hand: real per-step
`<title>`/`<meta>` metadata, and a natural point to move focus to the new step's heading on navigation
(part of the accessibility contract — see below). Route guards compare each route's requirement against
the store's `completedStep` high-water mark and `router.replace` the visitor back to the first step when
the saved progress doesn't cover the requested step — so a stale bookmark or a deep link into the middle
of the flow never lands on a step with nothing to show. On a successful submission the store resets and
the app redirects to `/o-projekte?stav=dakujeme`, where a one-time toast confirms the contribution (see
[Design notes](#design-notes)).

## Project structure

```
src/
  app/                    # App Router routes — one folder per URL
    page.tsx                # step 1: help type + amount
    osobne-udaje/           # step 2: personal details
    potvrdenie/             # step 3: review + submit
    o-projekte/             # about page + live metrics + success toast
    kontakt/                # contact page
  components/
    layout/                 # PageLayout, WizardLayout, SiteFooter — landmarks & shells
    ui/                     # Button, TextInput, Checkbox, FormField, Toast, SkipLink, …
  features/
    donation/               # wizard: schemas, store, mapper, step components
      components/             # AmountPicker, PrefixCombobox, ShelterSelect, Stepper, …
      steps/                  # Step1 / Step2 / Step3 (one component per route)
    api/                    # typed client, ApiError, TanStack Query hooks, schemas
      testing/                # MSW handlers/fixtures shared across tests
    about/, contact/        # content components for their respective routes
  lib/                    # i18n init, SSR styled-components registry, providers
  locales/sk/             # common.json, donation.json, about.json, contact.json
  styles/                 # theme tokens, global styles
```

Tests are co-located next to the file they cover (`Foo.tsx` + `Foo.test.tsx`), not in a parallel `__tests__`
tree — this keeps a component and its test moving together under a rename or a move.

## Testing

171 tests across 25 files, run with Vitest + Testing Library + MSW (`jsdom` environment).

- **Unit-level TDD** for the parts with the most edge cases and the least visual surface: Zod schemas
  (`schemas.step1.test.ts`, `schemas.step2.test.ts`), the Zustand store (`store.test.ts`), the donation
  mapper (`mapper.test.ts`), and the phone-prefix combobox's keyboard/ARIA behavior
  (`PrefixCombobox.test.tsx`).
- **Integration tests at the network boundary.** `src/features/api/testing/handlers.ts` defines MSW
  handlers for the three API endpoints (shelters, results, contribute) plus fixtures for validation
  errors, server errors, and network failures; components and hooks under test make real `fetch` calls
  that MSW intercepts — nothing mocks `fetch` or a query hook directly, so the tests exercise the same
  code path production traffic does.
- **A full-wizard flow test** drives step 1 → step 2 → step 3 → submit end to end, the way a real
  supporter would.

Run once:

```bash
npm test -- --run
```

Watch mode (default):

```bash
npm test
```

## Accessibility

The app targets WCAG 2.1 AA:

- **Phone country-prefix picker** (`PrefixCombobox`) is a WAI-ARIA APG "select-only combobox" — a
  `role="combobox"` trigger with `aria-activedescendant` pointing at the current option in a
  `role="listbox"` popup — rather than a native `<select>`, because the trigger shows only a flag and a
  chevron and still needs an accessible name announcing the current selection. Focus never moves into the
  popup; arrow keys move `aria-activedescendant` while the trigger keeps real DOM focus throughout.
- **Focus management on wizard navigation**: each step's heading is a programmatic focus target
  (`tabIndex={-1}`, out of the normal tab order) so moving between steps hands focus somewhere meaningful
  instead of leaving it on a control that no longer exists.
- **Errors are wired through `aria-describedby`** (`fieldA11yProps` in `FormField.tsx`) plus an
  always-mounted `aria-live="polite"` region next to each field, so a validation message is announced by
  assistive tech the moment it appears, not just visible to sighted users.
- **Skip link** (`SkipLink.tsx`) is the first focusable element on every page, jumping straight to the
  `<main id="main-content">` landmark past the header/stepper chrome.
- **Landmarks**: `<main>` and a `<footer>` that stays a sibling of `<main>` (not nested inside it) so it
  keeps its implicit `contentinfo` role per the HTML–ARIA mapping.
- **Touch targets** are ≥44px throughout the wizard controls (inputs, checkboxes, the prefix trigger) — see
  [Design notes](#design-notes) for how this plays out on mobile specifically.
- **`prefers-reduced-motion` is respected** — the wizard's step-enter animation is disabled outright for
  users who've asked for reduced motion.
- **Placeholder text is deliberately lower-contrast than labels.** Every field's instructions live in its
  always-visible `<label>` (and, where relevant, a visible "(Nepovinné)" hint) — both set at a contrast
  ratio that passes WCAG AA. Placeholder text is supplementary example content, not instructional, so it's
  allowed to sit at a lower contrast without failing accessibility requirements, and doing so also signals
  visually that it will disappear once the user types.

## i18n

All UI copy goes through `react-i18next`, split into four Slovak namespaces under `src/locales/sk/`:
`common` (shared strings — actions, skip link), `donation` (the wizard, including every validation
message), `about`, and `contact`. There's no hardcoded UI text in a component.

Validation messages follow a **message-as-key** convention: a Zod schema's `message` field is never
display text, only a key (e.g. `validation.phoneInvalid`) — components resolve it with
`t(message, { ns: 'donation' })` at render time. This keeps schemas free of any particular language and
means adding a new locale later touches only the JSON files, not the validation logic.

The contact page's card copy (address, phone, email, opening hours) is reproduced verbatim from the design
— it's foundation contact information, not something to paraphrase.

## Commit convention

This repository follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): message
```

where `type` is one of `feat`, `fix`, `test`, `chore`, `docs`, `refactor`. Each commit is one logical unit
of work, written in the imperative mood ("add", not "added"/"adds"), in English.

## Design notes

The desktop layout is the source of truth; there is no separate mobile design. Mobile is derived from it
deliberately rather than guessed at: the two-column wizard shell collapses to a single stacked column
below the `lg` breakpoint (the photo panel hides entirely, per the desktop design's own intent for smaller
viewports), form controls stack full-width, and every interactive control keeps a minimum 44px touch
target regardless of viewport.

There's no dedicated "success screen" as a distinct view — a confirmed submission resets the wizard draft
and redirects to `/o-projekte` (the live metrics page) with a one-time toast confirming the contribution.
This puts a supporter's confirmation moment next to the number their donation just moved, instead of a
dead-end screen with nowhere to go.
