import type { Metadata } from 'next';
import { Step1 } from '@/features/donation/steps/Step1';

export const metadata: Metadata = {
  title: 'Výber útulku – Good Boy',
  description: 'Vyberte si útulok a sumu, ktorou chcete prispieť na pomoc psom v núdzi.',
};

export default function Home() {
  return <Step1 />;
}
