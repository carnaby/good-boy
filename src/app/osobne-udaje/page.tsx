import type { Metadata } from 'next';
import { Step2 } from '@/features/donation/steps/Step2';

export const metadata: Metadata = {
  title: 'Osobné údaje – Good Boy',
  description: 'Vyplňte svoje kontaktné údaje pre dokončenie príspevku.',
};

export default function OsobneUdajePage() {
  return <Step2 />;
}
