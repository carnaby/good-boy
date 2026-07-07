import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { StyledComponentsRegistry } from '@/lib/registry';
import { Providers } from '@/lib/providers';

// Inter, self-hosted via next/font: latin + latin-ext (Slovak diacritics),
// weights 400/500/600/700 to cover the type scale in src/styles/theme.ts.
// Exposed as a CSS variable (--font-inter) consumed by theme.fontFamily.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Good Boy',
  description: 'Good Boy',
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
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
