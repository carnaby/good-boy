import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AboutContent } from '@/features/about/AboutContent';

export const metadata: Metadata = {
  title: 'O projekte – Good Boy',
  description:
    'Zistite viac o nadácii Good Boy, jej poslaní a aktuálnych výsledkoch zbierky pre opustené a týrané psy v Žiline.',
};

// `AboutContent` calls `useSearchParams()` (to read `?stav=dakujeme`), which
// requires a `<Suspense>` boundary during prerendering — without it, `next
// build` fails static generation of this route with the "missing suspense
// boundary" error. No fallback UI: the boundary only ever suspends for the
// length of one client-side render pass, never for real async data.
export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <AboutContent />
    </Suspense>
  );
}
