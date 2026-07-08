import type { Metadata } from 'next';
import { Step3 } from '@/features/donation/steps/Step3';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Potvrdenie – Good Boy',
  description: 'Skontrolujte si zadané údaje a odošlite formulár príspevku.',
  openGraph: {
    title: 'Potvrdenie – Good Boy',
    description: 'Skontrolujte si zadané údaje a odošlite formulár príspevku.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function PotvrdeniePage() {
  return <Step3 />;
}
