import type { Metadata } from 'next';
import { Step3 } from '@/features/donation/steps/Step3';

export const metadata: Metadata = {
  title: 'Potvrdenie – Good Boy',
  description: 'Skontrolujte si zadané údaje a odošlite formulár príspevku.',
};

export default function PotvrdeniePage() {
  return <Step3 />;
}
