import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StyledComponentsRegistry } from '@/lib/registry';
import { Providers } from '@/lib/providers';
import { SkipLink } from '@/components/ui/SkipLink';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';

// Inter, self-hosted via next/font: latin + latin-ext (Slovak diacritics),
// weights 400/500/600/700 to cover the type scale in src/styles/theme.ts.
// Exposed as a CSS variable (--font-inter) consumed by theme.fontFamily.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

// Falls back to localhost in dev/test when `NEXT_PUBLIC_SITE_URL` isn't set
// — required so Next can resolve the relative `openGraph.images` path below
// into an absolute URL (and so `next build` doesn't warn about a missing
// `metadataBase`). Every route's own `metadata.title`/`description` (see
// each `src/app/**/page.tsx`) replaces these defaults. `openGraph` does NOT
// merge across a layout/page pair the same way — a route that declares its
// own `openGraph` replaces this one wholesale, so each route repeats
// `DEFAULT_OG_IMAGE` in its own `openGraph.images` to keep the same preview
// image everywhere.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Good Boy',
  description: 'Good Boy',
  openGraph: {
    title: 'Good Boy',
    description: 'Good Boy — nadácia pre opustené a týrané psy v Žiline.',
    siteName: 'Good Boy',
    locale: 'sk_SK',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className={inter.variable}>
      <body>
        <StyledComponentsRegistry>
          <Providers>
            <SkipLink />
            {children}
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
