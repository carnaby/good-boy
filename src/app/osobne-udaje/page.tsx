import type { Metadata } from 'next';
import { Step2 } from '@/features/donation/steps/Step2';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'Osobné údaje – Good Boy',
  description: 'Vyplňte svoje kontaktné údaje pre dokončenie príspevku.',
  openGraph: {
    title: 'Osobné údaje – Good Boy',
    description: 'Vyplňte svoje kontaktné údaje pre dokončenie príspevku.',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function OsobneUdajePage() {
  return <Step2 />;
}
